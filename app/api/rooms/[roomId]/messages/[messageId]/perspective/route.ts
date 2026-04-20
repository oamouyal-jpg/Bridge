import { NextResponse } from "next/server";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { generatePerspectiveBridge } from "@/lib/perspective-bridge-service";
import { getAggregate, resolveRoomIdFromCode } from "@/lib/room-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const { roomId: raw, messageId } = await context.params;
    const id = resolveRoomIdFromCode(raw) ?? raw;
    const agg = getAggregate(id);
    if (!agg) return NextResponse.json({ error: "Room not found." }, { status: 404 });

    const body = (await request.json().catch(() => ({}))) as {
      readerParticipantId?: string;
    };
    const readerId = body.readerParticipantId ?? "";
    const reader = readerId ? agg.participants.get(readerId) : undefined;
    if (!reader) {
      return NextResponse.json(
        { error: "Invalid participant." },
        { status: 400 }
      );
    }

    const msg = agg.sharedMessages.find((m) => m.id === messageId);
    if (!msg) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }
    if (msg.sourceParticipantId === readerId) {
      // Perspective bridging is for the *other* side's messages. No point
      // asking the app to explain the reader's own message back to them.
      return NextResponse.json(
        { error: "Perspective is meant for messages from other participants." },
        { status: 400 }
      );
    }

    const senderProfile = agg.profiles.get(msg.sourceParticipantId);
    const sender = agg.participants.get(msg.sourceParticipantId);
    const map = agg.conflictMap;
    if (!senderProfile || !sender || !map) {
      return NextResponse.json(
        { error: "Context not ready — sender profile or conflict map missing." },
        { status: 400 }
      );
    }

    const locale = await getRequestLocale();
    const perspective = await generatePerspectiveBridge({
      message: msg,
      senderProfile,
      senderDisplayName: sender.displayName,
      readerDisplayName: reader.displayName,
      map,
      locale,
    });

    return NextResponse.json({ ok: true, perspective });
  } catch (e) {
    const err = e instanceof Error ? e.message : "Could not generate perspective.";
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
