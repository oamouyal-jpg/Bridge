import type { RoomAggregate } from "./store";

/** More than two people in the room — shared thread and prompts need group-aware rules. */
export function isGroupMediationRoom(aggregate: RoomAggregate): boolean {
  return aggregate.participants.size > 2;
}

export function groupRoomSize(aggregate: RoomAggregate): number {
  return aggregate.participants.size;
}

/** Ordered display names for prompts (stable room order). */
export function rosterDisplayLines(aggregate: RoomAggregate): string {
  return aggregate.room.participantIds
    .map((id) => aggregate.participants.get(id))
    .filter(Boolean)
    .map((p) => `- ${p!.displayName} (${p!.id})`)
    .join("\n");
}

/** Extra system instructions for the mediator model in group rooms. */
export const GROUP_MEDIATION_SYSTEM_APPEND = `

GROUP ROOM (more than two participants):
- The mediated message is visible to every other member — not a single partner.
- Prefer inclusive or role-aware phrasing where it fits ("our team", "in this family", "here") alongside clear first-person statements.
- Do not corner, shame, or pile onto one named person in front of the group. If the raw draft sharply targets an individual, reshape into impact + request that preserves dignity with multiple readers.
- Avoid triangulation ("everyone thinks…", "we all agree you…") unless the speaker calmly attributes a narrow, checkable fact; prefer their own perspective.
- Use the conflict map for themes and tensions — do not invent subgroup attacks the map does not support.
`;

/** Intake: avoid dyadic mind-reading claims when several people exist. */
export const GROUP_INTAKE_SYSTEM_APPEND = `

GROUP ROOM NOTE:
- Several people are in this room, each with their own private intake. Do not speak as if you know what a specific other person thinks or feels.
- Refer to "others in the room" or "when you join the shared thread" rather than one imagined partner.
`;

export const GROUP_REALITY_CHECK_APPEND = `

Note: This draft may appear in a small-group shared thread. Pay extra attention to: pile-on, triangulation ("everyone knows…"), public humiliation of one member, or language that corners one person while others watch.
`;

export const GROUP_INSIGHT_USER_APPEND = `

(Group room: insight cards should acknowledge multiple readers — avoid "winning" framing; flag coalition pressure or speaking-for-others if relevant.)
`;

export const GROUP_REWRITE_USER_APPEND = `

(Group room: revision will be shared with several people — keep dignity for all named parties.)
`;

export const GROUP_SAFETY_THREAD_APPEND = `

This thread has multiple named participants. Watch for tag-team pressure, ganging up, or one member being isolated rhetorically while others stay silent.
`;

export function groupSummaryUserPrefix(participantCount: number): string {
  if (participantCount <= 2) return "";
  return `This room has ${participantCount} participants. "whatEachSideNeeds" may list distinct needs across people or clusters (up to 8 strings) — avoid forcing only a binary two-side framing.\n\n`;
}

export function groupPrepareResolutionUserAppend(profileCount: number): string {
  if (profileCount <= 2) return "";
  return `\n\n(Group / team / family context: ${profileCount} profiles — steps and wording should work when several people are in the same conversation. Prefer neutral facilitation tone; avoid two-party-only assumptions.)`;
}
