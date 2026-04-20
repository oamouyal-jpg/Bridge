import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { isGroupMediationRoom, rosterDisplayLines } from "@/lib/group-mediation";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { generateInsightCards } from "@/lib/insight-service";
import { mediatePrivateMessage } from "@/lib/mediation-service";
import { runRealityCheck } from "@/lib/reality-check-service";
import {
  getAggregate,
  resolveRoomIdFromCode,
  setParticipantTranslationMode,
} from "@/lib/room-service";
import { migrateMonetizationFields } from "@/lib/entitlements";
import { canSendMediatedMessage } from "@/lib/limits";
import { analyzeSafetySignals } from "@/lib/safety-signals-service";
import { screenPrivateMessage } from "@/lib/safety-service";
import { saveRoomAggregate } from "@/lib/store";
import type {
  MessageAnalysis,
  PrivateRawMessage,
  SharedMediatedMessage,
  TranslationMode,
} from "@/lib/types";

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: raw } = await context.params;
    const id = resolveRoomIdFromCode(raw) ?? raw;
    const agg = getAggregate(id);
    if (!agg) return NextResponse.json({ error: "Room not found." }, { status: 404 });

    if (agg.room.status !== "active") {
      return NextResponse.json(
        { error: "Mediation is not active yet." },
        { status: 400 }
      );
    }

    migrateMonetizationFields(agg);
    if (!canSendMediatedMessage(agg)) {
      return NextResponse.json(
        {
          error: "You’ve reached the free session limit for mediated messages.",
          code: "MESSAGE_LIMIT",
          limitReached: true,
        },
        { status: 402 }
      );
    }

    const body = (await request.json()) as {
      participantId?: string;
      content?: string;
      translationMode?: TranslationMode;
      confirmDespiteReality?: boolean;
      skipRealityCheck?: boolean;
      /**
       * When true, run safety + reality + mediation and RETURN the mediated
       * text without persisting anything. The client then asks the sender to
       * confirm, edit, or override before committing. Emotional-safety gate.
       */
      preview?: boolean;
      /**
       * When present on a commit call, persist this text as the shared
       * mediated message verbatim (the sender has seen and approved it, or
       * chose their own wording). Still screened for safety on the raw.
       */
      overrideMediated?: string;
      /** Delivery provenance for the override path. Defaults to "mediated". */
      deliveryMode?: "mediated" | "mediated_edited" | "sender_original";
      /** Pre-computed analysis/intent/risk from a prior preview call. Optional. */
      analysis?: MessageAnalysis;
      detectedIntent?: string;
      escalationRisk?: number;
    };

    const participantId = body.participantId ?? "";
    const content = (body.content ?? "").trim();
    if (!participantId || !agg.participants.has(participantId)) {
      return NextResponse.json({ error: "Invalid participant." }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (body.translationMode) {
      setParticipantTranslationMode(agg, participantId, body.translationMode);
    }

    const participant = agg.participants.get(participantId)!;
    const mode = body.translationMode ?? participant.translationMode;

    const safety = await screenPrivateMessage(content);
    if (!safety.safeToMediate) {
      return NextResponse.json(
        {
          ok: false,
          phase: "safety",
          safety,
        },
        { status: 200 }
      );
    }

    const priorContext = (agg.intakeMessages.get(participantId) ?? [])
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const groupRoom = isGroupMediationRoom(agg);
    const locale = await getRequestLocale();

    if (!body.skipRealityCheck && !body.confirmDespiteReality) {
      const reality = await runRealityCheck(
        content,
        priorContext,
        groupRoom ? "group" : "pair",
        locale
      );
      const blocking =
        reality.hasConcern &&
        (reality.suggestedAction === "revise_before_send" || reality.severity >= 7);
      if (blocking) {
        return NextResponse.json({
          ok: true,
          phase: "reality_check",
          realityCheck: reality,
        });
      }
    }

    const profile = agg.profiles.get(participantId);
    const map = agg.conflictMap;
    if (!profile || !map) {
      return NextResponse.json(
        { error: "Profile or conflict map missing. Complete intake first." },
        { status: 400 }
      );
    }

    const hasOverride = typeof body.overrideMediated === "string" && body.overrideMediated.trim().length > 0;
    const deliveryMode: "mediated" | "mediated_edited" | "sender_original" =
      body.deliveryMode ?? (hasOverride ? "mediated_edited" : "mediated");

    // Decide whether we need to call the mediator model. We skip it when the
    // sender has come back from a preview they already approved / edited and
    // passed the text explicitly.
    let mediatedText: string;
    let detectedIntent: string | undefined;
    let escalationRisk: number | undefined;
    let analysis: MessageAnalysis | undefined;

    if (hasOverride) {
      mediatedText = body.overrideMediated!.trim();
      detectedIntent = body.detectedIntent?.trim() || undefined;
      escalationRisk =
        typeof body.escalationRisk === "number" && !Number.isNaN(body.escalationRisk)
          ? Math.min(10, Math.max(1, body.escalationRisk))
          : undefined;
      // Only keep analysis if the sender is using (possibly lightly edited)
      // mediated content. A "sender_original" delivery intentionally has no
      // mediator analysis since we did not rewrite it.
      if (deliveryMode !== "sender_original" && body.analysis) {
        analysis = body.analysis;
      }
    } else {
      const mediated = await mediatePrivateMessage({
        raw: content,
        profile,
        map,
        mode,
        room: groupRoom
          ? {
              category: agg.room.category,
              participantCount: agg.participants.size,
              senderDisplayName: participant.displayName,
              senderParticipantId: participantId,
              rosterMarkdown: rosterDisplayLines(agg),
            }
          : undefined,
        locale,
      });
      mediatedText = mediated.mediatedMessage;
      detectedIntent = mediated.detectedIntent;
      escalationRisk = mediated.escalationRisk;
      analysis = mediated.analysis;

      // Preview-only: return what would be shared, persist nothing. The raw
      // draft is not stored until the sender commits, so a cancelled preview
      // leaves no trace in the room aggregate.
      if (body.preview) {
        return NextResponse.json({
          ok: true,
          phase: "preview",
          preview: {
            mediated: mediatedText,
            detectedIntent,
            escalationRisk,
            analysis,
          },
        });
      }
    }

    const rawMsg: PrivateRawMessage = {
      id: `pr_${nanoid(12)}`,
      roomId: agg.room.id,
      participantId,
      content,
      createdAt: new Date().toISOString(),
    };
    agg.privateRawMessages.push(rawMsg);

    const shared: SharedMediatedMessage = {
      id: `sm_${nanoid(12)}`,
      roomId: agg.room.id,
      sourceParticipantId: participantId,
      mediatedContent: mediatedText,
      detectedIntent,
      createdAt: new Date().toISOString(),
      escalationRisk,
      analysis,
      deliveryMode,
    };
    agg.sharedMessages.push(shared);

    const insights = await generateInsightCards({
      roomId: agg.room.id,
      participantId,
      draft: content,
      profile,
      map,
      groupRoom,
      locale,
    });
    agg.insightsByParticipant.set(participantId, insights);

    const participantLabels = Object.fromEntries(
      [...agg.participants.values()].map((p) => [p.id, p.displayName])
    );
    agg.riskState = await analyzeSafetySignals({
      sharedMessages: agg.sharedMessages,
      participantLabels,
      latestMediated: shared.mediatedContent,
      participantCount: agg.participants.size,
    });

    saveRoomAggregate(agg);

    return NextResponse.json({
      ok: true,
      phase: "mediated",
      sharedMessage: shared,
      insights,
      riskState: agg.riskState,
      mediationMeta: {
        escalationRisk,
        deliveryMode,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not send message.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
