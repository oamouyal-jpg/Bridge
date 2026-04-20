import { NextResponse } from "next/server";
import { isFreeMode } from "@/lib/free-mode";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { generatePrepareConversation } from "@/lib/prepare-conversation-service";
import { getAggregate, resolveRoomIdFromCode } from "@/lib/room-service";
import { saveRoomAggregate } from "@/lib/store";
import type { ParticipantProfile, PrepareConversationKind } from "@/lib/types";

const KINDS: PrepareConversationKind[] = ["in_person", "phone", "final_message"];

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
      kind?: PrepareConversationKind;
    };
    const participantId = body.participantId ?? "";
    const kind = body.kind;
    if (!participantId || !agg.participants.has(participantId)) {
      return NextResponse.json({ error: "Invalid participant." }, { status: 400 });
    }
    if (!kind || !KINDS.includes(kind)) {
      return NextResponse.json({ error: "Invalid kind." }, { status: 400 });
    }

    const freeMode = isFreeMode();
    if (!freeMode && (agg.credits?.prepareConversation ?? 0) < 1) {
      return NextResponse.json(
        { error: "Prepare conversation requires purchase.", code: "PAYWALL", feature: "prepare" },
        { status: 402 }
      );
    }

    const profiles = agg.room.participantIds
      .map((pid) => agg.profiles.get(pid))
      .filter((p): p is ParticipantProfile => Boolean(p));
    if (profiles.length < 2 || !agg.conflictMap) {
      return NextResponse.json({ error: "Profiles or conflict map not ready." }, { status: 400 });
    }

    const locale = await getRequestLocale();
    const result = await generatePrepareConversation({
      kind,
      sharedMessages: agg.sharedMessages,
      profiles,
      map: agg.conflictMap,
      locale,
    });

    if (!freeMode) {
      agg.credits!.prepareConversation -= 1;
    }
    agg.latestPrepare = result;
    saveRoomAggregate(agg);

    return NextResponse.json({ prepare: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
