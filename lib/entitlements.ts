import type { PaymentProductType } from "./types";
import type { RoomAggregate } from "./store";
import { ROOM_PARTICIPANT_CAP_MIN, suggestedMaxParticipants } from "./room-capacity";
import { saveRoomAggregate } from "./store";

export function defaultEntitlements() {
  return {
    unlimitedMessages: false,
    businessMode: false,
  };
}

export function defaultCredits() {
  return {
    resolution: 0,
    insightReport: 0,
    prepareConversation: 0,
  };
}

/** Normalize older aggregates missing monetization fields */
export function migrateMonetizationFields(agg: RoomAggregate): void {
  let dirty = false;
  if (!agg.room.entitlements) {
    agg.room.entitlements = defaultEntitlements();
    dirty = true;
  }
  if (agg.room.isBusiness === undefined) {
    agg.room.isBusiness = agg.room.category === "workplace";
    dirty = true;
  }
  if (!agg.credits) {
    agg.credits = defaultCredits();
    dirty = true;
  }
  if (agg.additionalMessageAllowance === undefined) {
    agg.additionalMessageAllowance = 0;
    dirty = true;
  }
  if (!agg.resolutionOutputs) {
    agg.resolutionOutputs = [];
    dirty = true;
  }
  if (
    agg.room.maxParticipants === undefined ||
    !Number.isFinite(agg.room.maxParticipants) ||
    agg.room.maxParticipants < ROOM_PARTICIPANT_CAP_MIN
  ) {
    agg.room.maxParticipants = suggestedMaxParticipants(agg.room.category);
    dirty = true;
  }
  if (agg.room.category === "relationship" && agg.room.maxParticipants !== 2) {
    agg.room.maxParticipants = 2;
    dirty = true;
  }
  if (dirty) saveRoomAggregate(agg);
}

export function applyPurchaseUnlock(
  agg: RoomAggregate,
  type: PaymentProductType
): void {
  migrateMonetizationFields(agg);
  switch (type) {
    case "resolution":
      agg.credits!.resolution += 1;
      break;
    case "insight":
      agg.credits!.insightReport += 1;
      break;
    case "prepare":
      agg.credits!.prepareConversation += 1;
      break;
    case "extend_session":
      agg.additionalMessageAllowance += 30;
      break;
    case "subscription":
      agg.room.entitlements.unlimitedMessages = true;
      break;
    case "business":
      agg.room.entitlements.businessMode = true;
      break;
    default:
      break;
  }
  saveRoomAggregate(agg);
}
