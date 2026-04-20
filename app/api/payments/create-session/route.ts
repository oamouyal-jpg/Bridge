import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/payments-checkout";
import type { PaymentProductType } from "@/lib/types";
import { getAggregate, resolveRoomIdFromCode } from "@/lib/room-service";

const PRODUCTS: PaymentProductType[] = [
  "resolution",
  "insight",
  "extend_session",
  "subscription",
  "business",
  "prepare",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: PaymentProductType;
      roomId?: string;
      participantId?: string;
    };
    const type = body.type;
    const roomId = resolveRoomIdFromCode(body.roomId ?? "") ?? body.roomId;
    const participantId = body.participantId ?? "";
    if (!type || !PRODUCTS.includes(type)) {
      return NextResponse.json({ error: "Invalid product type." }, { status: 400 });
    }
    if (!roomId || !getAggregate(roomId)) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }
    if (!participantId) {
      return NextResponse.json({ error: "Participant required." }, { status: 400 });
    }

    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const { url, mock } = await createCheckoutSession({
      origin,
      roomId,
      participantId,
      productType: type,
    });

    if (!url) {
      return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl: url, mock });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payment error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
