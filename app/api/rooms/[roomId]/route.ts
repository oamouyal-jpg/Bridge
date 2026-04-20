import { NextResponse } from "next/server";
import { getAggregate, resolveRoomIdFromCode } from "@/lib/room-service";
import { projectRoomForParticipant } from "@/lib/serialize";

export async function GET(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  const { roomId: raw } = await context.params;
  const id = resolveRoomIdFromCode(raw) ?? raw;
  const agg = getAggregate(id);
  if (!agg) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }
  const { searchParams } = new URL(request.url);
  const pid = searchParams.get("participantId") ?? "";
  if (!pid || !agg.participants.has(pid)) {
    return NextResponse.json({
      room: agg.room,
      participants: [...agg.participants.values()].map((p) => ({
        id: p.id,
        displayName: p.displayName,
        intakeCompleted: p.intakeCompleted,
      })),
    });
  }
  return NextResponse.json(projectRoomForParticipant(agg, pid));
}
