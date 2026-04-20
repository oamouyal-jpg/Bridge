import { NextResponse } from "next/server";
import { generateResolution } from "@/lib/resolution-generator-service";
import { getAggregate, resolveRoomIdFromCode } from "@/lib/room-service";
import { saveRoomAggregate } from "@/lib/store";
import type { ParticipantProfile, ResolutionGenerationType } from "@/lib/types";

const TYPES: ResolutionGenerationType[] = [
  "repair",
  "boundary",
  "closure",
  "prepare_meeting",
];

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: raw } = await context.params;
    const id = resolveRoomIdFromCode(raw) ?? raw;
    const agg = getAggregate(id);
    if (!agg) return NextResponse.json({ error: "Room not found." }, { status: 404 });

    const body = (await request.json()) as {
      participantId?: string;
      type?: ResolutionGenerationType;
    };
    const participantId = body.participantId ?? "";
    const type = body.type;
    if (!participantId || !agg.participants.has(participantId)) {
      return NextResponse.json({ error: "Invalid participant." }, { status: 400 });
    }
    if (!type || !TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid type." }, { status: 400 });
    }

    if ((agg.credits?.resolution ?? 0) < 1) {
      return NextResponse.json(
        { error: "Resolution credits required.", code: "PAYWALL", feature: "resolution" },
        { status: 402 }
      );
    }

    const profiles = agg.room.participantIds
      .map((pid) => agg.profiles.get(pid))
      .filter((p): p is ParticipantProfile => Boolean(p));
    if (profiles.length < 2 || !agg.conflictMap) {
      return NextResponse.json({ error: "Profiles or conflict map not ready." }, { status: 400 });
    }

    const result = await generateResolution({
      type,
      sharedMessages: agg.sharedMessages,
      profiles,
      map: agg.conflictMap,
    });

    agg.credits!.resolution -= 1;
    agg.resolutionOutputs.push(result);
    saveRoomAggregate(agg);

    return NextResponse.json({ resolution: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
