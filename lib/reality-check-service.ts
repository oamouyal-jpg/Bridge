import { completeJson, isAiConfigured } from "./ai";
import { GROUP_REALITY_CHECK_APPEND } from "./group-mediation";
import { localeSystemInstruction } from "./i18n/server-locale";
import type { Locale } from "./i18n/types";
import type { RealityCheckResult, RealityFlagType } from "./types";

const REALITY_SYSTEM = `You are a private fairness and reality-check assistant inside an AI mediation app.

You review a participant's raw draft before it is translated into a mediated shared message.

Detect whether the draft contains:
- absolutist language
- mind-reading
- assumptions stated as facts
- one-sided blame
- lack of self-accountability
- contradiction with earlier statements if context is provided
- unsupported accusations
- selective framing
- guilt-inducing or coercive framing
- double standards

Important rules:
- Do not shame the user.
- Do not call them a liar, manipulative, abusive, or toxic unless the content is explicit and severe.
- Use calm, neutral, sharp language.
- Return practical flags that would help the user make the message fairer and more credible.

Return JSON:
{
  "hasConcern": boolean,
  "severity": number,
  "flags": [{ "type": string, "title": string, "body": string }],
  "suggestedAction": "send" | "revise_before_send" | "add_context"
}`;

const FLAG_TYPES: RealityFlagType[] = [
  "absolute_language",
  "mind_reading",
  "fact_feeling_mix",
  "accountability_gap",
  "double_standard",
  "contradiction",
  "unsupported_claim",
  "blame_heavy",
  "guilt_framing",
  "selective_framing",
];

function normalizeFlagType(t: string): RealityFlagType {
  return FLAG_TYPES.includes(t as RealityFlagType) ? (t as RealityFlagType) : "unsupported_claim";
}

export async function runRealityCheck(
  draft: string,
  priorContext?: string,
  /** When "group", the draft may be read by several people — tighten triangulation / pile-on checks. */
  roomMode: "pair" | "group" = "pair",
  locale?: Locale
): Promise<RealityCheckResult> {
  const d = draft.trim();
  if (!d) {
    return {
      hasConcern: false,
      severity: 0,
      flags: [],
      suggestedAction: "send",
    };
  }

  if (!isAiConfigured()) {
    const absolutes = /\b(always|never|every time|nothing|everything)\b/i.test(d);
    const mindread = /\b(you (just )?want|you only care|you never think)\b/i.test(d);
    const flags: RealityCheckResult["flags"] = [];
    if (absolutes) {
      flags.push({
        type: "absolute_language",
        title: "Absolute language weakens credibility",
        body: "Words like “always” or “never” can sound totalizing. Try one specific example instead.",
      });
    }
    if (mindread) {
      flags.push({
        type: "mind_reading",
        title: "Possible mind-reading",
        body: "This may be assuming intent. Try naming impact and a question, not a verdict on their motives.",
      });
    }
    const hasConcern = flags.length > 0;
    return {
      hasConcern,
      severity: hasConcern ? 5 : 1,
      flags,
      suggestedAction: hasConcern ? "revise_before_send" : "send",
    };
  }

  const groupTail = roomMode === "group" ? GROUP_REALITY_CHECK_APPEND : "";
  const user = `Draft:\n${d}${groupTail}\n\nEarlier private context (optional):\n${priorContext ?? "(none)"}`;
  const system = locale ? `${REALITY_SYSTEM}${localeSystemInstruction(locale)}` : REALITY_SYSTEM;
  const raw = await completeJson<RealityCheckResult>(system, user);

  const flags = Array.isArray(raw.flags)
    ? raw.flags.map((f) => ({
        type: normalizeFlagType(String(f.type)),
        title: String(f.title ?? "").trim() || "Notice",
        body: String(f.body ?? "").trim() || "",
      }))
    : [];

  return {
    hasConcern: Boolean(raw.hasConcern),
    severity: Math.min(10, Math.max(1, Number(raw.severity ?? 1))),
    flags,
    suggestedAction: normalizeAction(raw.suggestedAction),
  };
}

function normalizeAction(
  v: unknown
): RealityCheckResult["suggestedAction"] {
  const s = String(v);
  return s === "send" || s === "add_context" || s === "revise_before_send"
    ? s
    : "revise_before_send";
}
