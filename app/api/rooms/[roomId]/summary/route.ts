import { NextResponse } from "next/server";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { getAggregate, resolveRoomIdFromCode, bumpRoomStatus } from "@/lib/room-service";
import { generateSessionDebrief } from "@/lib/summary-service";
import { saveRoomAggregate } from "@/lib/store";

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: raw } = await context.params;
    const id = resolveRoomIdFromCode(raw) ?? raw;
    const agg = getAggregate(id);
    if (!agg) return NextResponse.json({ error: "Room not found." }, { status: 404 });

    const map = agg.conflictMap;
    if (!map) {
      return NextResponse.json({ error: "Conflict map not available." }, { status: 400 });
    }

    const locale = await getRequestLocale();
    const debrief = await generateSessionDebrief({
      map,
      shared: agg.sharedMessages,
      participantCount: agg.participants.size,
      locale,
    });

    agg.debrief = debrief;
    bumpRoomStatus(agg, "completed");
    saveRoomAggregate(agg);

    return NextResponse.json({ debrief });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not generate summary.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
