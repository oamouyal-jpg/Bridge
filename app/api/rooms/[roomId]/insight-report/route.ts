import { NextResponse } from "next/server";
import { generateAdvancedInsightReport } from "@/lib/advanced-insight-report-service";
import { isFreeMode } from "@/lib/free-mode";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { getAggregate, resolveRoomIdFromCode } from "@/lib/room-service";
import { saveRoomAggregate } from "@/lib/store";
import type { ParticipantProfile } from "@/lib/types";

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

    const freeMode = isFreeMode();
    if (!freeMode && (agg.credits?.insightReport ?? 0) < 1) {
      return NextResponse.json(
        { error: "Insight report requires purchase.", code: "PAYWALL", feature: "insight" },
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
    const report = await generateAdvancedInsightReport({
      sharedMessages: agg.sharedMessages,
      profiles,
      map: agg.conflictMap,
      locale,
    });

    if (!freeMode) {
      agg.credits!.insightReport -= 1;
    }
    agg.latestInsightReport = report;
    saveRoomAggregate(agg);

    return NextResponse.json({ report });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
