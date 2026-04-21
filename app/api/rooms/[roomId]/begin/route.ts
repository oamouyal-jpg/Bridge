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

  // Idempotent: if the other party already started mediation, return OK
  // so the UI just advances to the shared thread instead of erroring out.
  if (agg.room.status === "active" || agg.room.status === "paused") {
    return NextResponse.json({ ok: true, room: agg.room, alreadyActive: true });
  }

  if (agg.room.status !== "ready_for_mediation") {
    return NextResponse.json(
      { error: "Room is not ready to begin mediation yet." },
      { status: 400 }
    );
  }

  bumpRoomStatus(agg, "active");
  return NextResponse.json({ ok: true, room: agg.room });
}
