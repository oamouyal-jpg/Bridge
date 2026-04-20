import { NextResponse } from "next/server";
import { isGroupMediationRoom } from "@/lib/group-mediation";
import { getAggregate, resolveRoomIdFromCode } from "@/lib/room-service";
import { rewriteDraft, type RewriteKind } from "@/lib/rewrite-service";

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
      draft?: string;
      kind?: RewriteKind;
    };
    const participantId = body.participantId ?? "";
    const draft = (body.draft ?? "").trim();
    const kind = body.kind ?? "clearer";
    if (!participantId || !agg.participants.has(participantId)) {
      return NextResponse.json({ error: "Invalid participant." }, { status: 400 });
    }

    const profile = agg.profiles.get(participantId);
    const map = agg.conflictMap;
    if (!profile || !map) {
      return NextResponse.json({ error: "Not ready." }, { status: 400 });
    }

    const text = await rewriteDraft({
      text: draft,
      kind,
      profile,
      map,
      groupRoom: isGroupMediationRoom(agg),
    });
    return NextResponse.json({ draft: text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not rewrite.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
