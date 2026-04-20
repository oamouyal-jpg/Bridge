import { NextResponse } from "next/server";
import { bumpRoomStatus, getAggregate, resolveRoomIdFromCode } from "@/lib/room-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  const { roomId: raw } = await context.params;
  const id = resolveRoomIdFromCode(raw) ?? raw;
  const agg = getAggregate(id);
  if (!agg) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  if (agg.room.status !== "ready_for_mediation") {
    return NextResponse.json(
      { error: "Room is not ready to begin mediation yet." },
      { status: 400 }
    );
  }

  bumpRoomStatus(agg, "active");
  return NextResponse.json({ ok: true, room: agg.room });
}
