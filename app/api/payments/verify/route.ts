import { NextResponse } from "next/server";
import { applyPurchaseUnlock } from "@/lib/entitlements";
import { getStripe } from "@/lib/payments-checkout";
import type { PaymentProductType } from "@/lib/types";
import { getAggregate } from "@/lib/room-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sessionId?: string };
    const sessionId = body.sessionId?.trim();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required." }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 501 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session.status === "complete" &&
      (session.payment_status === "paid" ||
        session.payment_status === "no_payment_required" ||
        (session.mode === "subscription" && !!session.subscription));

    if (!paid) {
      return NextResponse.json({ error: "Payment not completed." }, { status: 400 });
    }

    const roomId = session.metadata?.roomId;
    const productType = session.metadata?.productType as PaymentProductType | undefined;
    if (!roomId || !productType) {
      return NextResponse.json({ error: "Invalid session metadata." }, { status: 400 });
    }

    const agg = getAggregate(roomId);
    if (!agg) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    applyPurchaseUnlock(agg, productType);

    return NextResponse.json({ ok: true, roomId, productType });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Verification failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
