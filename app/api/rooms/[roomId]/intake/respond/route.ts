import { NextResponse } from "next/server";
import { buildConflictMap } from "@/lib/conflict-map-service";
import { respondIntake } from "@/lib/intake-service";
import { extractParticipantProfile } from "@/lib/profile-service";
import { bumpRoomStatus, getAggregate, resolveRoomIdFromCode } from "@/lib/room-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: raw } = await context.params;
    const id = resolveRoomIdFromCode(raw) ?? raw;
    const agg = getAggregate(id);
    if (!agg) return NextResponse.json({ error: "Room not found." }, { status: 404 });

    const body = (await request.json()) as { participantId?: string; message?: string };
    const participantId = body.participantId ?? "";
    const message = (body.message ?? "").trim();
    if (!participantId || !agg.participants.has(participantId)) {
      return NextResponse.json({ error: "Invalid participant." }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
    if (agg.room.status !== "intake_in_progress") {
      return NextResponse.json({ error: "Intake is not active." }, { status: 400 });
    }

    const turn = await respondIntake(agg, participantId, message);

    if (turn.enough_information) {
      await extractParticipantProfile(agg, participantId);
      const ids = agg.room.participantIds;
      const allDone =
        ids.length > 0 &&
        ids.every(
          (id) =>
            Boolean(agg.participants.get(id)?.intakeCompleted) && agg.profiles.has(id)
        );
      if (allDone) {
        await buildConflictMap(agg);
        bumpRoomStatus(agg, "ready_for_mediation");
      }
    }

    return NextResponse.json({ turn });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not continue intake.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
