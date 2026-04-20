import { completeJson, isAiConfigured } from "./ai";
import { GROUP_SAFETY_THREAD_APPEND } from "./group-mediation";
import type { RoomRiskState, SharedMediatedMessage } from "./types";

const ANALYZER_SYSTEM = `You are a safety signal analyzer in an AI-mediated communication app.

Your task is to analyze messages and detect patterns that may indicate risk, such as:
- coercion
- threats (direct or implied)
- manipulation (e.g. guilt, "if you loved me you would…")
- boundary strain or repeated boundary pressure
- escalation in tone
- emotional volatility
- fixation or obsession language
- refusal to accept refusal
- extreme dependency language

Important rules:
- Do NOT diagnose or label people.
- Do NOT say "this person is dangerous", "unstable", "abusive", or similar.
- Focus only on observable communication patterns in the text.
- Use neutral, careful language.

Return JSON:
{
  "score": 0,
  "level": "low" | "medium" | "high",
  "signals": ["short observable pattern descriptions"],
  "message": "one short neutral sentence summarizing the interaction risk tone (not a label of any person)"
}`;

/** User-facing copy by level — awareness, not judgment. */
export const RISK_LEVEL_UI_MESSAGE: Record<RoomRiskState["level"], string> = {
  low: "This conversation shows signs of emotional escalation.",
  medium:
    "There are patterns of pressure or boundary strain in this interaction.",
  high: "This interaction contains signals that may indicate emotional or psychological risk. Proceed with caution.",
};

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

function levelFromScore(score: number): RoomRiskState["level"] {
  if (score < 40) return "low";
  if (score < 70) return "medium";
  return "high";
}

function normalizeLevel(v: unknown): RoomRiskState["level"] | null {
  const s = String(v).toLowerCase();
  if (s === "low" || s === "medium" || s === "high") return s;
  return null;
}

function heuristicRisk(text: string): Omit<RoomRiskState, "lastUpdated" | "message"> {
  const lower = text.toLowerCase();
  const signals: string[] = [];
  let score = 15;

  if (/\b(kill|hurt you|harm you|regret you|destroy you|ruin your)\b/.test(lower)) {
    signals.push("Language may suggest threat or harm imagery — worth slowing down.");
    score += 45;
  }
  if (
    /\b(you must|you have to|or else|i'll leave if you don't|if you loved me you would)\b/.test(lower)
  ) {
    signals.push("Possible coercion or guilt pressure in how requests are framed.");
    score += 25;
  }
  if (/\b(never|always|every time)\b/.test(lower) && text.length > 80) {
    signals.push("Absolutist framing can track with escalating conflict tone.");
    score += 10;
  }
  if (/\b(can't live without you|only you can|don't you dare say no)\b/.test(lower)) {
    signals.push("Intensity or dependency pressure in the wording.");
    score += 20;
  }

  score = clamp(score, 0, 100);
  const level = levelFromScore(score);
  if (signals.length === 0) {
    signals.push(
      "Limited automated markers in this scan — still notice pacing, pressure, and how you feel."
    );
  }
  return { score, level, signals: signals.slice(0, 8) };
}

/**
 * Analyzes the shared mediated thread (and optional latest line) for interaction risk patterns.
 */
export async function analyzeSafetySignals(input: {
  sharedMessages: SharedMediatedMessage[];
  participantLabels: Record<string, string>;
  /** Latest mediated line just appended (included in sharedMessages too) */
  latestMediated?: string;
  /** When more than two, prompt includes multi-party pressure patterns. */
  participantCount?: number;
}): Promise<RoomRiskState> {
  const lines = input.sharedMessages.map((m) => {
    const who = input.participantLabels[m.sourceParticipantId] ?? "Participant";
    return `[${who}]: ${m.mediatedContent}`;
  });
  const block = lines.join("\n").slice(-12000);
  const groupTail =
    (input.participantCount ?? 0) > 2 ? GROUP_SAFETY_THREAD_APPEND : "";
  const prompt = `Mediated thread (newest last):\n${block}${groupTail}\n\nLatest mediated message (may duplicate last line):\n${
    input.latestMediated ?? "(same as last in thread)"
  }`;

  let score = 20;
  let level: RoomRiskState["level"] = "low";
  let signals: string[] = [];
  let aiNarrative = "";

  if (!isAiConfigured()) {
    const h = heuristicRisk(block + "\n" + (input.latestMediated ?? ""));
    score = h.score;
    level = h.level;
    signals = h.signals.length ? h.signals : ["No strong automated patterns detected in this pass."];
  } else {
    const raw = await completeJson<{
      score?: number;
      level?: string;
      signals?: unknown;
      message?: string;
    }>(ANALYZER_SYSTEM, prompt);

    score = clamp(Number(raw.score ?? 30), 0, 100);
    const parsedLevel = normalizeLevel(raw.level);
    level = parsedLevel ?? levelFromScore(score);
    signals = Array.isArray(raw.signals)
      ? raw.signals.map((s) => String(s).trim()).filter(Boolean).slice(0, 12)
      : [];
    aiNarrative = String(raw.message ?? "").trim();
    if (aiNarrative && !signals.some((s) => s.includes(aiNarrative.slice(0, 40)))) {
      signals = [aiNarrative, ...signals].slice(0, 12);
    }
    if (signals.length === 0) {
      signals = ["No specific patterns flagged in this pass — still check in with how you feel."];
    }
  }

  const message = RISK_LEVEL_UI_MESSAGE[level];

  return {
    score,
    level,
    signals,
    message,
    lastUpdated: new Date().toISOString(),
  };
}
