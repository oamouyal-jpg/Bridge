import { NextResponse } from "next/server";
import { applyPurchaseUnlock } from "@/lib/entitlements";
import { getStripe } from "@/lib/payments-checkout";
import type { PaymentProductType } from "@/lib/types";
import { getAggregate, resolveRoomIdFromCode } from "@/lib/room-service";

/**
 * Dev / no-Stripe fallback: completes a purchase and unlocks entitlements.
 * Disabled when STRIPE_SECRET_KEY is set (real checkouts only).
 */
export async function GET(request: Request) {
  if (getStripe()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { searchParams } = new URL(request.url);
  const rawRoom = searchParams.get("roomId") ?? "";
  const roomId = resolveRoomIdFromCode(rawRoom) ?? rawRoom;
  const productType = searchParams.get("productType") as PaymentProductType | null;
  const participantId = searchParams.get("participantId") ?? "";

  if (!roomId || !productType || !participantId) {
    return NextResponse.json({ error: "Invalid query." }, { status: 400 });
  }

  const agg = getAggregate(roomId);
  if (!agg || !agg.participants.has(participantId)) {
    return NextResponse.json({ error: "Room or participant not found." }, { status: 404 });
  }

  applyPurchaseUnlock(agg, productType);

  return NextResponse.redirect(
    new URL(`/room/${encodeURIComponent(roomId)}?unlocked=1`, request.url)
  );
}
