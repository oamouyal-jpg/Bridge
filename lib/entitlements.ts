import type { PaymentProductType } from "./types";
import type { RoomAggregate } from "./store";
import { ROOM_PARTICIPANT_CAP_MIN, suggestedMaxParticipants } from "./room-capacity";
import { saveRoomAggregate } from "./store";
import { isFreeMode } from "./free-mode";

export function defaultEntitlements() {
  /**
   * In free-mode we unlock everything at room creation. We intentionally also
   * flip `businessMode` so workplace rooms get the neutral-tone treatment
   * without any purchase, matching the no-paywall promise.
   */
  const free = isFreeMode();
  return {
    unlimitedMessages: free,
    businessMode: free,
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
  /**
   * Free-mode upgrade for rooms that were created BEFORE the flag was flipped
   * on (or before this code shipped). We want the whole room graph to behave
   * as free-for-all the instant the operator enables it — otherwise in-flight
   * rooms would keep hitting the 30-message cap and confused users would see
   * paywalls the newly-created rooms don't show.
   *
   * When the flag goes back OFF later we deliberately do NOT downgrade — if a
   * room has been enjoying unlimited messages mid-session, ripping that away
   * would be a worse UX than letting it finish under the old rules.
   */
  if (isFreeMode()) {
    if (!agg.room.entitlements.unlimitedMessages) {
      agg.room.entitlements.unlimitedMessages = true;
      dirty = true;
    }
    if (!agg.room.entitlements.businessMode) {
      agg.room.entitlements.businessMode = true;
      dirty = true;
    }
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
