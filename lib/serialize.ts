import { FREE_SHARED_MESSAGE_LIMIT } from "./pricing";
import type { Participant } from "./types";
import type { RoomAggregate } from "./store";
import { effectiveMessageCap, messagesRemaining } from "./limits";

/** Client-safe projection — never includes other participant private intake/raw messages. */
export function projectRoomForParticipant(aggregate: RoomAggregate, participantId: string) {
  const me = aggregate.participants.get(participantId);
  const ordered: Participant[] = aggregate.room.participantIds
    .map((id) => aggregate.participants.get(id))
    .filter((p): p is Participant => Boolean(p));
  const cap = effectiveMessageCap(aggregate);
  return {
    room: aggregate.room,
    me,
    participants: ordered,
    others: [...aggregate.participants.values()]
      .filter((p) => p.id !== participantId)
      .map((p) => ({
        id: p.id,
        displayName: p.displayName,
        intakeCompleted: p.intakeCompleted,
      })),
    myIntake: aggregate.intakeMessages.get(participantId) ?? [],
    myInsights: aggregate.insightsByParticipant.get(participantId) ?? [],
    myProfile: aggregate.profiles.get(participantId),
    conflictSummary: aggregate.conflictMap?.summary,
    sharedMessages: aggregate.sharedMessages,
    debrief: aggregate.debrief,
    riskState: aggregate.riskState,
    credits: aggregate.credits,
    entitlements: aggregate.room.entitlements,
    isBusiness: aggregate.room.isBusiness,
    freeMessageLimit: FREE_SHARED_MESSAGE_LIMIT,
    messageCap: cap,
    messagesRemaining: messagesRemaining(aggregate),
    resolutionOutputs: aggregate.resolutionOutputs,
    latestInsightReport: aggregate.latestInsightReport,
    latestPrepare: aggregate.latestPrepare,
  };
}
