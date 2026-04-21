"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { IntakeChat } from "@/components/IntakeChat";
import { InsightPanel } from "@/components/InsightPanel";
import { PrivateComposer } from "@/components/PrivateComposer";
import { RoomHeader } from "@/components/RoomHeader";
import { RoomJoinToasts, type RoomJoinToast } from "@/components/RoomJoinToasts";
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
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";

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
  /** See `lib/free-mode.ts` — when true the client hides credit/paywall UI. */
  freeMode?: boolean;
};

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const rawId = params?.roomId ?? "";
  const { t } = useBridgeLocale();

  const [data, setData] = useState<RoomPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paywallProduct, setPaywallProduct] = useState<PaymentProductType | null>(null);
  // Insights/monetization are tucked away by default so the chat UI is not cluttered.
  const [showOptions, setShowOptions] = useState(false);

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

  /**
   * Soft updates: we also poll during `waiting_for_second_participant` so the
   * creator sees the moment someone joins (toast in `RoomJoinToasts`), not
   * just when they manually refresh. Slightly faster cadence while waiting.
   */
  useEffect(() => {
    if (!session) return;
    const status = data?.room?.status;
    const isWaiting = status === "waiting_for_second_participant";
    const isIntake = status === "intake_in_progress";
    if (!isWaiting && !isIntake) return;
    const tick = window.setInterval(
      () => {
        void refresh();
      },
      isWaiting ? 6_000 : 12_000
    );
    return () => window.clearInterval(tick);
  }, [data?.room?.status, refresh, session]);

  /**
   * Detect *new* participants between polls and surface a toast. We seed the
   * baseline on first load (so pre-existing others don't spam toasts), then
   * compare ids on every subsequent snapshot.
   */
  const knownOtherIdsRef = useRef<Set<string> | null>(null);
  const [joinToasts, setJoinToasts] = useState<RoomJoinToast[]>([]);
  useEffect(() => {
    const others = data?.others;
    if (!others) return;
    const currentIds = new Set(others.map((o) => o.id));
    const prior = knownOtherIdsRef.current;
    if (!prior) {
      knownOtherIdsRef.current = currentIds;
      return;
    }
    const arrived = others.filter((o) => !prior.has(o.id));
    if (arrived.length > 0) {
      const toast: RoomJoinToast = {
        id: `join-${Date.now()}-${arrived.map((a) => a.id).join("-")}`,
        names: arrived.map((a) => a.displayName || "Someone"),
      };
      setJoinToasts((ts) => [...ts, toast]);
      // Flash the document title when the tab is backgrounded so the creator
      // notices even without the window focused. Reverts on next navigation.
      if (typeof document !== "undefined" && document.hidden) {
        const original = document.title;
        document.title = `• ${toast.names.join(", ")} joined — Bridge`;
        const revert = () => {
          document.title = original;
          document.removeEventListener("visibilitychange", revert);
        };
        document.addEventListener("visibilitychange", revert);
      }
      // Auto-dismiss after 8s.
      window.setTimeout(() => {
        setJoinToasts((ts) => ts.filter((t) => t.id !== toast.id));
      }, 8_000);
    }
    knownOtherIdsRef.current = currentIds;
  }, [data?.others]);

  const dismissToast = useCallback((id: string) => {
    setJoinToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

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
          <p>{t.room.loading}</p>
        </main>
      </WarmPageFrame>
    );
  }

  if (!session) {
    /**
     * Someone (usually the person who was sent the host's /room/<id> URL) is
     * here without a local session. Send them to /join with the room id
     * pre-filled — the join API accepts either invite code or room id so
     * this "just works" whether the URL was a share link or a copy of the
     * host's address bar.
     */
    const joinHref = rawId ? `/join?code=${encodeURIComponent(rawId)}` : "/join";
    return (
      <WarmPageFrame>
        <main className="min-h-screen px-4 py-16">
          <Card className="mx-auto max-w-lg border-bridge-mist shadow-lg">
            <CardContent className="space-y-4 p-6 text-sm leading-relaxed text-bridge-stone">
              <p className="text-bridge-ink">{t.room.noSessionBody1}</p>
              <p>{t.room.noSessionBody2}</p>
              <Button asChild className="rounded-full">
                <Link href={joinHref}>{t.room.noSessionButton}</Link>
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
      <RoomJoinToasts toasts={joinToasts} onDismiss={dismissToast} />
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
          {t.room.updatingBanner}
        </div>
      )}

      {room.status === "intake_in_progress" && (
        <div className="mx-auto max-w-2xl px-4 py-8">
          {participants.length === 1 ? (
            <div className="mb-4 space-y-3 rounded-2xl border border-bridge-sage/25 bg-gradient-to-br from-bridge-honey to-white p-5 text-sm text-bridge-ink shadow-sm">
              <p className="font-medium">{t.room.intake.soloHeading}</p>
              <p className="leading-relaxed text-bridge-stone">{t.room.intake.soloBody1}</p>
              <p className="leading-relaxed text-bridge-stone">{t.room.intake.soloBody2}</p>
            </div>
          ) : participants.length < joinCap ? (
            <div className="mb-4 space-y-2 rounded-2xl border border-bridge-sage/20 bg-gradient-to-br from-bridge-honey/80 to-white p-5 text-sm leading-relaxed text-bridge-ink shadow-sm">
              <p className="font-medium">
                {t.room.intake.partialHeading
                  .replace("{n}", String(participants.length))
                  .replace("{cap}", String(joinCap))}
              </p>
              <p className="text-bridge-stone">{t.room.intake.partialBody}</p>
            </div>
          ) : (
            <div className="mb-4 space-y-2 rounded-2xl border border-bridge-mist bg-white p-5 text-sm leading-relaxed text-bridge-stone shadow-sm">
              <p className="font-medium text-bridge-ink">
                {joinCap <= 2 ? t.room.intake.readyHeadingPair : t.room.intake.readyHeadingGroup}
              </p>
              <p>
                {t.room.intake.readyBody1}
                <strong className="font-medium text-bridge-ink">
                  {t.room.intake.readyBodyEmphasis}
                </strong>
                {t.room.intake.readyBody2}
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
          {participants.length < joinCap && (
            <Card className="mb-6 border-bridge-sage/40 bg-gradient-to-br from-white via-bridge-honey/50 to-bridge-peach/20 shadow-sm">
              <CardContent className="space-y-4 p-6">
                <div>
                  <p className="font-display text-lg text-bridge-ink">
                    {t.room.intake.inviteTitle}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-bridge-stone">
                    {t.room.intake.shareNowBody}
                  </p>
                  <p className="mt-1 text-xs font-medium text-bridge-sage">
                    {t.room.intake.noInstallNote}
                  </p>
                </div>
                <ShareInviteLinks
                  inviteCode={room.inviteCode}
                  roomTitle={room.title}
                  maxParticipants={joinCap}
                  variant="full"
                />
                {joinCap > 2 && (
                  <p className="text-xs text-bridge-stone">
                    {t.room.intake.joinedCountSuffix
                      .replace("{n}", String(participants.length))
                      .replace("{cap}", String(joinCap))}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          {data.me?.intakeCompleted ? (
            <Card className="border-bridge-sage/30 bg-gradient-to-br from-bridge-honey/60 to-white">
              <CardContent className="space-y-3 p-6 text-sm leading-relaxed text-bridge-stone">
                <p className="font-display text-lg text-bridge-ink">
                  {t.room.intake.completeHeading}
                </p>
                <p>{t.room.intake.completeBody}</p>
                {(data.others?.some((o) => !o.intakeCompleted) ?? false) && (
                  <p className="rounded-xl bg-bridge-sand/60 p-3 text-bridge-ink">
                    {t.room.intake.completeWaiting}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <IntakeChat
              roomId={rawId}
              participantId={myId}
              initialMessages={data.myIntake ?? []}
              onUpdate={refresh}
            />
          )}
        </div>
      )}

      {room.status === "ready_for_mediation" && (
        <div className="mx-auto max-w-2xl px-4 py-10 space-y-4">
          <Card className="border-bridge-mist bg-white">
            <CardContent className="space-y-3 p-6 text-sm text-bridge-stone">
              <p className="font-display text-lg text-bridge-ink">
                {joinCap <= 2
                  ? t.room.readyForMediation.lineBothSides
                  : t.room.readyForMediation.lineEveryone}
              </p>
              {data.conflictSummary && (
                <p className="rounded-xl bg-bridge-sand/50 p-3 text-bridge-ink">{data.conflictSummary}</p>
              )}
              <Button
                type="button"
                className="rounded-full"
                onClick={() => void beginMediation().catch((e) => alert(e.message))}
              >
                {t.room.readyForMediation.begin}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {(room.status === "active" || room.status === "paused") && (
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
          {data.riskState && <SafetySignalsBanner risk={data.riskState} />}

          {/* Orientation banner: tells people exactly what this page is doing. */}
          <Card className="border-bridge-sage/30 bg-white">
            <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-bridge-sage">
                  {t.room.sharedSession.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-bridge-ink">
                  {t.room.sharedSession.subtitle}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => setShowOptions((v) => !v)}
                  aria-expanded={showOptions}
                >
                  {showOptions
                    ? t.room.sharedSession.lessOptions
                    : t.room.sharedSession.moreOptions}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    void generateSummary().catch((e) => alert(e.message))
                  }
                >
                  {t.room.summaryBtn}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            {/* Main column: thread first, composer below. Classic chat ordering. */}
            <div className="order-1 space-y-4">
              <SharedThread
                roomId={rawId}
                viewerParticipantId={myId}
                messages={data.sharedMessages ?? []}
                participants={participants}
              />
              <PrivateComposer
                roomId={rawId}
                participantId={myId}
                messageBlocked={atMessageLimit}
                onMessageBlocked={() => setPaywallProduct("extend_session")}
                onSent={refresh}
              />
            </div>

            {/* Side column: collapsed by default so the chat isn't cluttered. */}
            {showOptions && (
              <aside className="order-2 space-y-4">
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
                  freeMode={data.freeMode ?? false}
                  onPaywall={(p) => setPaywallProduct(p)}
                  onRefresh={refresh}
                />
                <InsightPanel cards={data.myInsights ?? []} />
              </aside>
            )}
          </div>
        </div>
      )}

      {room.status === "completed" && data.debrief && (
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
          <Card className="border-bridge-mist bg-white">
            <CardContent className="space-y-4 p-6 text-sm text-bridge-stone">
              <h2 className="font-display text-xl text-bridge-ink">{t.room.debrief.title}</h2>
              <div>
                <p className="font-medium text-bridge-ink">{t.room.debrief.whatEachSideNeeds}</p>
                <ul className="mt-2 list-disc pl-5">
                  {data.debrief.whatEachSideNeeds.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-bridge-ink">{t.room.debrief.coreStruggle}</p>
                <p>{data.debrief.coreStruggle}</p>
              </div>
              <div>
                <p className="font-medium text-bridge-ink">{t.room.debrief.misunderstandings}</p>
                <ul className="mt-2 list-disc pl-5">
                  {data.debrief.misunderstandings.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-bridge-ink">{t.room.debrief.bestNextStep}</p>
                <p>{data.debrief.bestNextStep}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="rounded-full" type="button" onClick={() => router.push("/create")}>
                  {t.room.debrief.startNewRoom}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </main>
    </WarmPageFrame>
  );
}
