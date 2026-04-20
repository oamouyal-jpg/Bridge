import type { RoomCategory } from "./types";

/** Hard limits for how many people can join one room (including the host). */
export const ROOM_PARTICIPANT_CAP_MIN = 2;
export const ROOM_PARTICIPANT_CAP_MAX = 12;

/** Suggested default when the client does not send a value. */
export function suggestedMaxParticipants(category: RoomCategory): number {
  switch (category) {
    case "family":
      return 6;
    case "workplace":
      return 8;
    case "other":
      return 4;
    case "friendship":
      return 2;
    default:
      return 2;
  }
}

/**
 * Couples / pair context stays at 2. Family, workplace, friendship, and other allow 2–12.
 */
export function clampMaxParticipants(raw: unknown, category: RoomCategory): number {
  if (category === "relationship") return 2;
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
  const fallback = suggestedMaxParticipants(category);
  const base = Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.min(
    ROOM_PARTICIPANT_CAP_MAX,
    Math.max(ROOM_PARTICIPANT_CAP_MIN, base)
  );
}

export function roomCapacityLabel(max: number): string {
  return max <= 2 ? "2 people" : `up to ${max} people`;
}
