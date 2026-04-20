import { completeJson, isAiConfigured } from "./ai";

export type SafetyScreenResult = {
  safeToMediate: boolean;
  category?: "threat" | "self_harm" | "coercion" | "severe_abuse" | "other";
  userMessage: string;
};

const SAFETY_SYSTEM = `You are a safety moderation layer for a mediation app.

Decide if the user's private text should be processed normally or needs a bounded safety response.

Return JSON:
{
  "safeToMediate": boolean,
  "category": "threat" | "self_harm" | "coercion" | "severe_abuse" | "other" | null,
  "userMessage": "short calm guidance for the sender (private)"
}

If content suggests imminent harm, suicide/self-harm, explicit threats, stalking, or severe abuse, set safeToMediate false.

Do not shame the user. Be calm and humane.`;

export async function screenPrivateMessage(text: string): Promise<SafetyScreenResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { safeToMediate: false, category: "other", userMessage: "This message is empty." };
  }

  if (!isAiConfigured()) {
    const lower = trimmed.toLowerCase();
    const crisis =
      lower.includes("kill myself") ||
      lower.includes("suicide") ||
      lower.includes("end my life") ||
      lower.includes("hurt you") ||
      lower.includes("i will hurt");
    if (crisis) {
      return {
        safeToMediate: false,
        category: "self_harm",
        userMessage:
          "This sounds like it may be beyond what Bridge can safely help with. Please pause and reach out to local emergency services or a crisis line. You deserve real-time human support.",
      };
    }
    return { safeToMediate: true, userMessage: "" };
  }

  const raw = await completeJson<SafetyScreenResult>(
    SAFETY_SYSTEM,
    `Private message:\n${trimmed}`
  );
  return {
    safeToMediate: Boolean(raw.safeToMediate),
    category: raw.category ?? undefined,
    userMessage: String(raw.userMessage ?? "").trim(),
  };
}
