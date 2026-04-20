import { nanoid } from "nanoid";
import { completeJson, isAiConfigured } from "./ai";
import { GROUP_INTAKE_SYSTEM_APPEND } from "./group-mediation";
import { localeSystemInstruction } from "./i18n/server-locale";
import type { Locale } from "./i18n/types";
import type { IntakeMessage, IntakeSignals, IntakeTurnResult } from "./types";
import type { RoomAggregate } from "./store";
import { saveRoomAggregate } from "./store";

const INTAKE_SYSTEM = `You are an emotionally intelligent conflict intake guide inside a mediation app.

Your job is to help one participant privately clarify what is really happening for them before mediation begins.

Rules:
- Ask only one question at a time.
- Be warm, clear, concise, and non-clinical.
- Do not sound like a therapist or a generic support bot.
- Help the user uncover what hurt, what they need, what they fear, and what outcome they want.
- Do not over-explain.
- Keep questions natural and emotionally intelligent.
- Do not start mediation yet.
- Do not speak about the other participant as if you know their inner world.
- Your goal is to gather enough signal for a hidden emotional profile.

Focus on discovering:
- presenting complaint
- emotional state
- unmet need
- dominant fear
- conflict style
- desired outcome
- readiness for mediation

When enough information is gathered, return a final message indicating readiness in a natural way, such as:
"I think I understand the shape of this well enough to begin mediation."

Output JSON:
{
  "message": "the next message to show the participant",
  "enough_information": boolean,
  "signals": {
    "possible_emotions": [],
    "possible_needs": [],
    "possible_fears": [],
    "possible_desired_outcomes": []
  }
}`;

function now() {
  return new Date().toISOString();
}

function getThread(aggregate: RoomAggregate, participantId: string): IntakeMessage[] {
  return aggregate.intakeMessages.get(participantId) ?? [];
}

function pushMessage(
  aggregate: RoomAggregate,
  participantId: string,
  role: "user" | "assistant",
  content: string
): IntakeMessage {
  const msg: IntakeMessage = {
    id: `im_${nanoid(12)}`,
    roomId: aggregate.room.id,
    participantId,
    role,
    content,
    createdAt: now(),
  };
  const list = getThread(aggregate, participantId);
  list.push(msg);
  aggregate.intakeMessages.set(participantId, list);
  return msg;
}

function transcriptForPrompt(aggregate: RoomAggregate, participantId: string): string {
  const lines = getThread(aggregate, participantId).map((m) => `${m.role.toUpperCase()}: ${m.content}`);
  return lines.join("\n");
}

function assistantTurns(aggregate: RoomAggregate, participantId: string): number {
  return getThread(aggregate, participantId).filter((m) => m.role === "assistant").length;
}

function emptySignals(): IntakeSignals {
  return {
    possible_emotions: [],
    possible_needs: [],
    possible_fears: [],
    possible_desired_outcomes: [],
  };
}

/**
 * In-flight guard so concurrent `/intake/start` calls for the same participant
 * (React StrictMode double-invoke in dev, double-tap, quick refresh, etc.) do not
 * each trigger a separate AI call and push duplicate opening questions into the thread.
 */
const intakeStartInFlight = new Map<string, Promise<IntakeTurnResult>>();

function inFlightKey(aggregate: RoomAggregate, participantId: string): string {
  return `${aggregate.room.id}:${participantId}`;
}

function mockTurn(isFirst: boolean): IntakeTurnResult {
  if (isFirst) {
    return {
      message:
        "What happened from your point of view — in your own words? I’m only asking about your experience right now.",
      enough_information: false,
      signals: {
        possible_emotions: [],
        possible_needs: [],
        possible_fears: [],
        possible_desired_outcomes: [],
      },
    };
  }
  return {
    message:
      "Thanks — what hurt you most about it, and what did you wish had happened instead?",
    enough_information: false,
    signals: {
      possible_emotions: ["hurt"],
      possible_needs: ["understanding"],
      possible_fears: [],
      possible_desired_outcomes: ["repair"],
    },
  };
}

export async function startParticipantIntake(
  aggregate: RoomAggregate,
  participantId: string,
  locale?: Locale
): Promise<IntakeTurnResult> {
  const existingThread = getThread(aggregate, participantId);
  if (existingThread.length > 0) {
    const firstAssistant = existingThread.find((m) => m.role === "assistant");
    return {
      message: firstAssistant?.content ?? existingThread[0].content,
      enough_information: false,
      signals: emptySignals(),
    };
  }

  const key = inFlightKey(aggregate, participantId);
  const pending = intakeStartInFlight.get(key);
  if (pending) return pending;

  const task = (async (): Promise<IntakeTurnResult> => {
    if (!isAiConfigured()) {
      const turn = mockTurn(true);
      pushMessage(aggregate, participantId, "assistant", turn.message);
      aggregate.intakeAssistantTurns.set(participantId, assistantTurns(aggregate, participantId));
      saveRoomAggregate(aggregate);
      return turn;
    }

    const userPrompt = `Transcript so far:\n(Conversation beginning — ask your first question only.)\nParticipant display context: private intake.`;

    const baseSystem =
      aggregate.participants.size > 2 ? `${INTAKE_SYSTEM}${GROUP_INTAKE_SYSTEM_APPEND}` : INTAKE_SYSTEM;
    const intakeSystem = locale ? `${baseSystem}${localeSystemInstruction(locale)}` : baseSystem;
    const parsed = await completeJson<IntakeTurnResult>(intakeSystem, userPrompt);
    const normalized = normalizeTurn(parsed);
    if (getThread(aggregate, participantId).length > 0) {
      const firstAssistant = getThread(aggregate, participantId).find((m) => m.role === "assistant");
      return {
        message: firstAssistant?.content ?? normalized.message,
        enough_information: false,
        signals: emptySignals(),
      };
    }
    pushMessage(aggregate, participantId, "assistant", normalized.message);
    aggregate.intakeAssistantTurns.set(participantId, assistantTurns(aggregate, participantId));
    saveRoomAggregate(aggregate);
    return normalized;
  })();

  intakeStartInFlight.set(key, task);
  try {
    return await task;
  } finally {
    intakeStartInFlight.delete(key);
  }
}

function normalizeTurn(raw: IntakeTurnResult): IntakeTurnResult {
  return {
    message: String(raw.message ?? "").trim() || "What’s been hardest about this for you lately?",
    enough_information: Boolean(raw.enough_information),
    signals: normalizeSignals(raw.signals),
  };
}

function normalizeSignals(s?: IntakeSignals): IntakeSignals {
  return {
    possible_emotions: Array.isArray(s?.possible_emotions) ? s!.possible_emotions.map(String) : [],
    possible_needs: Array.isArray(s?.possible_needs) ? s!.possible_needs.map(String) : [],
    possible_fears: Array.isArray(s?.possible_fears) ? s!.possible_fears.map(String) : [],
    possible_desired_outcomes: Array.isArray(s?.possible_desired_outcomes)
      ? s!.possible_desired_outcomes.map(String)
      : [],
  };
}

/**
 * Append user message, generate next assistant turn. Enforces 3–8 question window.
 */
export async function respondIntake(
  aggregate: RoomAggregate,
  participantId: string,
  userText: string,
  locale?: Locale
): Promise<IntakeTurnResult> {
  const text = userText.trim();
  if (!text) throw new Error("Message is empty.");

  pushMessage(aggregate, participantId, "user", text);

  const turnsBefore = assistantTurns(aggregate, participantId);
  const userTurns = getThread(aggregate, participantId).filter((m) => m.role === "user").length;

  if (!isAiConfigured()) {
    const forceDone = userTurns >= 3;
    const turn: IntakeTurnResult = forceDone
      ? {
          message:
            "I think I understand the shape of this well enough to begin mediation. We’ll move carefully from here.",
          enough_information: true,
          signals: mockTurn(false).signals,
        }
      : mockTurn(false);
    pushMessage(aggregate, participantId, "assistant", turn.message);
    aggregate.intakeAssistantTurns.set(participantId, assistantTurns(aggregate, participantId));
    saveRoomAggregate(aggregate);
    return turn;
  }

  const userPrompt = `Here is the transcript so far between you and the participant:\n${transcriptForPrompt(
    aggregate,
    participantId
  )}\n\nRules:\n- Ask only ONE next question OR close if enough_information.\n- If you already have enough detail for a hidden profile, set enough_information true.\n- Never ask more than a total of 8 assistant questions in a full intake; this assistant has asked ${turnsBefore} questions so far (not including this response).`;

  const baseSystem =
    aggregate.participants.size > 2 ? `${INTAKE_SYSTEM}${GROUP_INTAKE_SYSTEM_APPEND}` : INTAKE_SYSTEM;
  const intakeSystem = locale ? `${baseSystem}${localeSystemInstruction(locale)}` : baseSystem;
  const parsed = await completeJson<IntakeTurnResult>(intakeSystem, userPrompt);
  let normalized = normalizeTurn(parsed);

  const afterTurn = turnsBefore + 1; // this response counts as next assistant message
  if (afterTurn < 3) {
    normalized = { ...normalized, enough_information: false };
  }
  if (afterTurn >= 8) {
    normalized = {
      ...normalized,
      enough_information: true,
      message:
        normalized.message ||
        "I think I understand the shape of this well enough to begin mediation. We’ll move carefully from here.",
    };
  }

  pushMessage(aggregate, participantId, "assistant", normalized.message);
  aggregate.intakeAssistantTurns.set(participantId, assistantTurns(aggregate, participantId));
  saveRoomAggregate(aggregate);
  return normalized;
}
