import { FREE_SHARED_MESSAGE_LIMIT } from "./pricing";
import type { RoomAggregate } from "./store";

export function effectiveMessageCap(aggregate: RoomAggregate): number | null {
  if (aggregate.room.entitlements.unlimitedMessages) return null;
  return FREE_SHARED_MESSAGE_LIMIT + (aggregate.additionalMessageAllowance ?? 0);
}

export function canSendMediatedMessage(aggregate: RoomAggregate): boolean {
  const cap = effectiveMessageCap(aggregate);
  if (cap === null) return true;
  return aggregate.sharedMessages.length < cap;
}

export function messagesRemaining(aggregate: RoomAggregate): number | null {
  const cap = effectiveMessageCap(aggregate);
  if (cap === null) return null;
  return Math.max(0, cap - aggregate.sharedMessages.length);
}
