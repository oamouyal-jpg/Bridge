import { NextResponse } from "next/server";
import { startParticipantIntake } from "@/lib/intake-service";
import { getAggregate, resolveRoomIdFromCode } from "@/lib/room-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: raw } = await context.params;
    const id = resolveRoomIdFromCode(raw) ?? raw;
    const agg = getAggregate(id);
    if (!agg) return NextResponse.json({ error: "Room not found." }, { status: 404 });

    const body = (await request.json()) as { participantId?: string };
    const participantId = body.participantId ?? "";
    if (!participantId || !agg.participants.has(participantId)) {
      return NextResponse.json({ error: "Invalid participant." }, { status: 400 });
    }

    if (agg.room.status !== "intake_in_progress") {
      return NextResponse.json({ error: "Intake is not active." }, { status: 400 });
    }

    const turn = await startParticipantIntake(agg, participantId);
    return NextResponse.json({ turn });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not start intake.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
