"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { IntakeChat } from "@/components/IntakeChat";
import { InsightPanel } from "@/components/InsightPanel";
import { PrivateComposer } from "@/components/PrivateComposer";
import { RoomHeader } from "@/components/RoomHeader";
import { SharedThread } from "@/components/SharedThread";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadSession, type BridgeSession } from "@/lib/bridge-session";
import { MonetizationPanel } from "@/components/MonetizationPanel";
import { PaywallModal } from "@/components/PaywallModal";
import { SafetySignalsBanner } from "@/components/SafetySignalsBanner";
import { IntakePartnerStatusBanner } from "@/components/IntakePartnerStatusBanner";
import { ShareInviteLinks } from "@/components/ShareInviteLinks";
import type {
  AdvancedInsightReport,
  InsightCard,
  IntakeMessage,
  Participant,
  PaymentProductType,
  ResolutionGeneration,
  Room,
  RoomCredits,
  RoomEntitlements,
  RoomRiskState,
  SharedMediatedMessage,
  SessionDebrief,
} from "@/lib/types";
import { useRoomUiStore } from "@/stores/room-ui-store";
import { WarmPageFrame } from "@/components/WarmPageFrame";

type RoomPayload = {
  room: Room;
  me?: Participant;
  participants?: Participant[];
  /** Other participant(s) — intakeCompleted drives in-app “background session” notices. */
  others?: { id: string; displayName: string; intakeCompleted: boolean }[];
  myIntake?: IntakeMessage[];
  myInsights?: InsightCard[];
  conflictSummary?: string;
  sharedMessages?: SharedMediatedMessage[];
  debrief?: SessionDebrief;
  riskState?: RoomRiskState;
  credits?: RoomCredits;
  entitlements?: RoomEntitlements;
  isBusiness?: boolean;
  messagesRemaining?: number | null;
  resolutionOutputs?: ResolutionGeneration[];
  latestInsightReport?: AdvancedInsightReport;
};

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const rawId = params?.roomId ?? "";

  const [data, setData] = useState<RoomPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paywallProduct, setPaywallProduct] = useState<PaymentProductType | null>(null);

  /**
   * Session comes from localStorage so we MUST NOT read it during SSR or the
   * first client render (that causes a hydration mismatch: server renders the
   * "no session" card, client immediately renders the loading state).
   * Start null on both sides, then resolve after mount.
   */
  const [session, setSession] = useState<BridgeSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  useEffect(() => {
    setSession(loadSession(rawId));
    setSessionReady(true);
  }, [rawId]);

  const resetUi = useRoomUiStore((s) => s.reset);

  const refresh = useCallback(async () => {
    if (!session) return;
    const res = await fetch(
      `/api/rooms/${encodeURIComponent(rawId)}?participantId=${encodeURIComponent(session.participantId)}`,
      { cache: "no-store" }
    );
    const json = (await res.json()) as RoomPayload & { error?: string };
    if (!res.ok) throw new Error(json.error ?? "Could not load room.");
    setData(json);
  }, [rawId, session]);

  useEffect(() => {
    if (!sessionReady) return;
    let cancelled = false;
    (async () => {
      if (!session) {
        setLoading(false);
        return;
      }
      try {
        await refresh();
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh, session, sessionReady]);

  useEffect(() => {
    resetUi();
  }, [rawId, resetUi]);

  useEffect(() => {
    if (data?.me?.translationMode) {
      useRoomUiStore.getState().setTranslationMode(data.me.translationMode);
    }
  }, [data?.me?.translationMode]);

  /** Soft updates so “other party still in background” changes without manual refresh. */
  useEffect(() => {
    if (!session || data?.room?.status !== "intake_in_progress") return;
    const t = window.setInterval(() => {
      void refresh();
    }, 12_000);
    return () => window.clearInterval(t);
  }, [data?.room?.status, refresh, session]);

  useEffect(() => {
    if (typeof window === "undefined" || !session) return;
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("checkout_session_id");
    const unlocked = params.get("unlocked");
    if (!sid && !unlocked) return;

    (async () => {
      try {
        if (sid) {
          await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sid }),
          });
        }
        window.history.replaceState({}, "", `/room/${encodeURIComponent(rawId)}`);
        await refresh();
      } catch {
        /* ignore */
      }
    })();
  }, [rawId, refresh, session]);

  if (!sessionReady || loading || (session && !data?.room)) {
    return (
      <WarmPageFrame>
        <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 py-20 text-center text-sm text-bridge-stone">
          <span
            className="inline-block h-9 w-9 animate-pulse rounded-full bg-bridge-peach/50 ring-4 ring-bridge-sage/15 motion-reduce:animate-none"
            aria-hidden
          />
          <p>Opening your room…</p>
        </main>
      </WarmPageFrame>
    );
  }

  if (!session) {
    return (
      <WarmPageFrame>
        <main className="min-h-screen px-4 py-16">
          <Card className="mx-auto max-w-lg border-bridge-mist shadow-lg">
            <CardContent className="space-y-4 p-6 text-sm leading-relaxed text-bridge-stone">
              <p className="text-bridge-ink">
                To protect your privacy, this room opens on the same device where you created or
                joined it.
              </p>
              <p>If you&apos;re on a new device, use your invite code to join again.</p>
              <Button asChild className="rounded-full">
                <Link href="/join">Join with code</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </WarmPageFrame>
    );
  }

  if (!data?.room) {
    return null;
  }

  if (error) {
    return (
      <WarmPageFrame>
        <main className="min-h-screen px-4 py-20 text-center text-sm text-red-700">
          {error}
        </main>
      </WarmPageFrame>
    );
  }

  const room = data.room;
  const joinCap = room.maxParticipants ?? 2;
  const participants: Participant[] = data.participants?.length
    ? data.participants
    : data.me
      ? [data.me]
      : [];

  const myId = session.participantId;

  const entitlements: RoomEntitlements = data.entitlements ?? {
    unlimitedMessages: false,
    businessMode: false,
  };
  const credits: RoomCredits = data.credits ?? {
    resolution: 0,
    insightReport: 0,
    prepareConversation: 0,
  };
  const resolutionOutputs = data.resolutionOutputs ?? [];
  const isBusinessRoom = data.isBusiness ?? false;
  const msgsLeft = data.messagesRemaining;
  const atMessageLimit =
    msgsLeft !== null && msgsLeft !== undefined && msgsLeft <= 0 && !entitlements.unlimitedMessages;

  async function beginMediation() {
    const res = await fetch(`/api/rooms/${encodeURIComponent(rawId)}/begin`, { method: "POST" });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      throw new Error(j.error ?? "Could not begin.");
    }
    await refresh();
  }

  async function generateSummary() {
    const res = await fetch(`/api/rooms/${encodeURIComponent(rawId)}/summary`, {
      method: "POST",
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      throw new Error(j.error ?? "Could not summarize.");
    }
    await refresh();
  }

  return (
    <WarmPageFrame>
    <main className="min-h-screen">
      <PaywallModal
        open={paywallProduct !== null}
        product={paywallProduct}
        roomId={rawId}
        participantId={myId}
        onClose={() => setPaywallProduct(null)}
      />
      <RoomHeader room={room} participantCount={participants.length} />

      {room.status === "waiting_for_second_participant" && (
        <div className="mx-auto max-w-2xl px-4 py-8 text-center text-sm text-bridge-stone">
          Updating room… refresh in a moment.
        </div>
      )}

      {room.status === "intake_in_progress" && (
        <div className="mx-auto max-w-2xl px-4 py-8">
          {participants.length === 1 ? (
            <div className="mb-4 space-y-3 rounded-2xl border border-bridge-sage/25 bg-gradient-to-br from-bridge-honey to-white p-5 text-sm text-bridge-ink shadow-sm">
              <p className="font-medium">You&apos;re in a private space first — that&apos;s intentional.</p>
              <p className="leading-relaxed text-bridge-stone">
                Take your time with Bridge&apos;s questions. Nothing reaches anyone else until they
                join, and the shared room only opens after everyone has had this private breathing
                room.
              </p>
              <p className="leading-relaxed text-bridge-stone">
                When you feel ready, send the invite below. They&apos;ll know they&apos;re stepping
                into something gentle — and they&apos;ll get their own private questions too.
              </p>
            </div>
          ) : participants.length < joinCap ? (
            <div className="mb-4 space-y-2 rounded-2xl border border-bridge-sage/20 bg-gradient-to-br from-bridge-honey/80 to-white p-5 text-sm leading-relaxed text-bridge-ink shadow-sm">
              <p className="font-medium">
                {participants.length} of {joinCap} people here — room for more
              </p>
              <p className="text-bridge-stone">
                Each person still gets their own private thread with Bridge first. Share the invite
                until everyone who should be in this conversation has joined.
              </p>
            </div>
          ) : (
            <div className="mb-4 space-y-2 rounded-2xl border border-bridge-mist bg-white p-5 text-sm leading-relaxed text-bridge-stone shadow-sm">
              <p className="font-medium text-bridge-ink">
                {joinCap <= 2
                  ? "Two private corners, one shared intention"
                  : "Private intake for each person, one shared thread later"}
              </p>
              <p>
                Each of you has a hidden thread with Bridge here. The door to mediation together opens
                when <strong className="font-medium text-bridge-ink">everyone</strong> has finished
                this step — no rushing, no surprises.
              </p>
            </div>
          )}
          {participants.length >= 2 && (
            <IntakePartnerStatusBanner
              roomStatus={room.status}
              me={data.me}
              others={data.others}
            />
          )}
          <IntakeChat
            roomId={rawId}
            participantId={myId}
            initialMessages={data.myIntake ?? []}
            onUpdate={refresh}
          />
          {participants.length < joinCap && (
            <Card className="mt-8 border-bridge-mist bg-white">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm font-medium text-bridge-ink">Invite when you&apos;re ready</p>
                <p className="text-sm text-bridge-stone">
                  Code: <span className="font-mono text-lg text-bridge-ink">{room.inviteCode}</span>
                  {joinCap > 2 && (
                    <span className="ms-2 text-bridge-stone">
                      · {participants.length}/{joinCap} joined
                    </span>
                  )}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => navigator.clipboard.writeText(room.inviteCode)}
                >
                  Copy code
                </Button>
                <ShareInviteLinks
                  inviteCode={room.inviteCode}
                  roomTitle={room.title}
                  maxParticipants={joinCap}
                  variant="full"
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {room.status === "ready_for_mediation" && (
        <div className="mx-auto max-w-2xl px-4 py-10 space-y-4">
          <Card className="border-bridge-mist bg-white">
            <CardContent className="space-y-3 p-6 text-sm text-bridge-stone">
              <p className="font-display text-lg text-bridge-ink">
                Bridge has enough context from{" "}
                {joinCap <= 2 ? "both sides" : "everyone in the room"} to begin mediated communication.
              </p>
              {data.conflictSummary && (
                <p className="rounded-xl bg-bridge-sand/50 p-3 text-bridge-ink">{data.conflictSummary}</p>
              )}
              <Button
                type="button"
                className="rounded-full"
                onClick={() => void beginMediation().catch((e) => alert(e.message))}
              >
                Begin mediation
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {(room.status === "active" || room.status === "paused") && (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
          {data.riskState && (
            <SafetySignalsBanner risk={data.riskState} />
          )}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-4 lg:col-span-1">
            <MonetizationPanel
              roomId={rawId}
              participantId={myId}
              sharedCount={data.sharedMessages?.length ?? 0}
              riskLevel={data.riskState?.level}
              credits={credits}
              entitlements={entitlements}
              isBusiness={isBusinessRoom}
              messagesRemaining={msgsLeft ?? null}
              resolutionOutputs={resolutionOutputs}
              latestInsightReport={data.latestInsightReport}
              onPaywall={(p) => setPaywallProduct(p)}
              onRefresh={refresh}
            />
            <PrivateComposer
              roomId={rawId}
              participantId={myId}
              messageBlocked={atMessageLimit}
              onMessageBlocked={() => setPaywallProduct("extend_session")}
              onSent={refresh}
            />
          </div>
          <div className="lg:col-span-1">
            <SharedThread messages={data.sharedMessages ?? []} participants={participants} />
          </div>
          <div className="lg:col-span-1">
            <InsightPanel cards={data.myInsights ?? []} />
          </div>
          </div>
        </div>
      )}

      {room.status === "completed" && data.debrief && (
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
          <Card className="border-bridge-mist bg-white">
            <CardContent className="space-y-4 p-6 text-sm text-bridge-stone">
              <h2 className="font-display text-xl text-bridge-ink">Session debrief</h2>
              <div>
                <p className="font-medium text-bridge-ink">What each side seems to need</p>
                <ul className="mt-2 list-disc pl-5">
                  {data.debrief.whatEachSideNeeds.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-bridge-ink">What is actually being struggled with</p>
                <p>{data.debrief.coreStruggle}</p>
              </div>
              <div>
                <p className="font-medium text-bridge-ink">Where misunderstanding may remain</p>
                <ul className="mt-2 list-disc pl-5">
                  {data.debrief.misunderstandings.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-bridge-ink">Best next step</p>
                <p>{data.debrief.bestNextStep}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="rounded-full" type="button" onClick={() => router.push("/create")}>
                  Start a new room
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(room.status === "active" || room.status === "paused") && (
        <div className="mx-auto max-w-3xl px-4 pb-16">
          <Button
            variant="secondary"
            className="rounded-full"
            type="button"
            onClick={() => void generateSummary().catch((e) => alert(e.message))}
          >
            Generate session summary
          </Button>
        </div>
      )}
    </main>
    </WarmPageFrame>
  );
}
