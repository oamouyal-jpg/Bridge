"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AdvancedInsightReport,
  PaymentProductType,
  PrepareConversationKind,
  ResolutionGeneration,
  ResolutionGenerationType,
  RoomCredits,
  RoomEntitlements,
} from "@/lib/types";

export function MonetizationPanel({
  roomId,
  participantId,
  sharedCount,
  riskLevel,
  credits,
  entitlements,
  isBusiness,
  messagesRemaining,
  resolutionOutputs,
  latestInsightReport,
  onPaywall,
  onRefresh,
}: {
  roomId: string;
  participantId: string;
  sharedCount: number;
  riskLevel?: "low" | "medium" | "high";
  credits: RoomCredits;
  entitlements: RoomEntitlements;
  isBusiness: boolean;
  messagesRemaining: number | null;
  resolutionOutputs: ResolutionGeneration[];
  latestInsightReport?: AdvancedInsightReport;
  onPaywall: (p: PaymentProductType) => void;
  onRefresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function postJson<T>(url: string, body: object): Promise<{ res: Response; data: T }> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, ...body }),
    });
    const data = (await res.json()) as T;
    return { res, data };
  }

  async function resolution(type: ResolutionGenerationType) {
    setBusy(`resolution-${type}`);
    setErr(null);
    try {
      const { res, data } = await postJson<{ error?: string; code?: string; resolution?: ResolutionGeneration }>(
        `/api/rooms/${encodeURIComponent(roomId)}/generate-resolution`,
        { type }
      );
      if (res.status === 402) {
        onPaywall("resolution");
        return;
      }
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed");
      await onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function insightReport() {
    setBusy("insight");
    setErr(null);
    try {
      const { res, data } = await postJson<{ error?: string }>(
        `/api/rooms/${encodeURIComponent(roomId)}/insight-report`,
        {}
      );
      if (res.status === 402) {
        onPaywall("insight");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function prepare(kind: PrepareConversationKind) {
    setBusy(`prepare-${kind}`);
    setErr(null);
    try {
      const { res, data } = await postJson<{ error?: string }>(
        `/api/rooms/${encodeURIComponent(roomId)}/prepare-conversation`,
        { kind }
      );
      if (res.status === 402) {
        onPaywall("prepare");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  const showResolutionPrompt =
    sharedCount >= 5 && sharedCount <= 12 && credits.resolution === 0;
  const showEscalationPrompt = riskLevel === "high" || riskLevel === "medium";
  const showStallPrompt = sharedCount >= 14 && sharedCount <= 20;

  return (
    <div className="space-y-4">
      {(showResolutionPrompt || showEscalationPrompt || showStallPrompt) && (
        <Card className="border-bridge-mist bg-white">
          <CardContent className="space-y-2 p-4 text-sm text-bridge-stone">
            {showResolutionPrompt && (
              <p>
                <span className="font-medium text-bridge-ink">Want help resolving this properly?</span>{" "}
                Structured outcomes are available when you&apos;re ready.
              </p>
            )}
            {showEscalationPrompt && (
              <p>
                <span className="font-medium text-bridge-ink">Need help de-escalating safely?</span>{" "}
                A calmer script or boundary can reduce heat without cutting honesty.
              </p>
            )}
            {showStallPrompt && (
              <p>
                <span className="font-medium text-bridge-ink">Want a structured way forward?</span>{" "}
                Turn traction into a plan you can actually use.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-bridge-mist bg-white">
        <CardHeader>
          <CardTitle className="font-display text-lg">Outcomes & clarity</CardTitle>
          <p className="text-sm text-bridge-stone">
            Free tier covers communication. Paid adds resolution tools, deeper insight, and longer
            sessions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {messagesRemaining !== null && messagesRemaining <= 5 && messagesRemaining > 0 && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-950">
              {messagesRemaining} free mediated messages left in this room.
            </p>
          )}
          {err && <p className="text-red-700">{err}</p>}

          <div>
            <p className="font-medium text-bridge-ink">Want help turning this into a real resolution?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                disabled={!!busy}
                onClick={() => void resolution("repair")}
              >
                {busy === "resolution-repair" ? "…" : "Repair conversation"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                disabled={!!busy}
                onClick={() => void resolution("boundary")}
              >
                Boundary message
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                disabled={!!busy}
                onClick={() => void resolution("closure")}
              >
                Closure conversation
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                disabled={!!busy}
                onClick={() => void resolution("prepare_meeting")}
              >
                Prepare for in-person discussion
              </Button>
            </div>
            <p className="mt-1 text-xs text-bridge-stone">Credits: {credits.resolution}</p>
          </div>

          <div className="border-t border-bridge-mist pt-3">
            <p className="font-medium text-bridge-ink">Understand what&apos;s really happening here</p>
            <Button
              size="sm"
              className="mt-2 rounded-full"
              disabled={!!busy}
              onClick={() => void insightReport()}
            >
              {busy === "insight" ? "…" : "Advanced insight report"}
            </Button>
            <p className="mt-1 text-xs text-bridge-stone">Credits: {credits.insightReport}</p>
          </div>

          <div className="border-t border-bridge-mist pt-3">
            <p className="font-medium text-bridge-ink">Prepare for a real conversation</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={!!busy}
                onClick={() => void prepare("in_person")}
              >
                In-person
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={!!busy}
                onClick={() => void prepare("phone")}
              >
                Phone call
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={!!busy}
                onClick={() => void prepare("final_message")}
              >
                Final message
              </Button>
            </div>
            <p className="mt-1 text-xs text-bridge-stone">Credits: {credits.prepareConversation}</p>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-bridge-mist pt-3">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full"
              onClick={() => onPaywall("extend_session")}
            >
              +30 messages
            </Button>
            <Button size="sm" variant="secondary" className="rounded-full" onClick={() => onPaywall("subscription")}>
              Unlimited (monthly)
            </Button>
            {(isBusiness || entitlements.businessMode) && (
              <p className="w-full text-xs text-bridge-sage">
                Business mode {entitlements.businessMode ? "active" : "available after purchase"} —
                neutral tone and optional HR summary.
              </p>
            )}
            {isBusiness && !entitlements.businessMode && (
              <Button size="sm" className="rounded-full" onClick={() => onPaywall("business")}>
                Unlock team pack
              </Button>
            )}
          </div>

          {resolutionOutputs.length > 0 && (
            <div className="rounded-xl border border-bridge-mist bg-bridge-cream/40 p-3 text-xs">
              <p className="font-medium text-bridge-ink">Recent resolution outputs</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-bridge-stone">
                {resolutionOutputs.slice(-3).map((r) => (
                  <li key={r.createdAt + r.type}>
                    <span className="font-medium">{r.type}</span>: {r.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {latestInsightReport && (
            <div className="rounded-xl border border-bridge-mist bg-bridge-cream/40 p-3 text-xs text-bridge-stone">
              <p className="font-medium text-bridge-ink">Latest insight report</p>
              <p className="mt-2">{latestInsightReport.summary}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
