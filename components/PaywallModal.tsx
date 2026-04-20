"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRICING_USD } from "@/lib/pricing";
import type { PaymentProductType } from "@/lib/types";

const TITLES: Record<PaymentProductType, string> = {
  resolution: "Unlock this feature",
  insight: "Unlock advanced insight report",
  extend_session: "Continue your session",
  subscription: "Unlimited mediated messages",
  business: "Bridge for teams",
  prepare: "Prepare for a real conversation",
};

const BLURBS: Record<PaymentProductType, string> = {
  resolution:
    "Turn what you’ve built here into repair language, boundaries, closure, or a plan for an in-person talk — structured, not improvised.",
  insight:
    "Deeper read on emotional patterns, the dynamic between you, triggers, and a practical communication strategy.",
  extend_session:
    "Add 30 more mediated messages to this room when you need more runway before deciding next steps.",
  subscription:
    "Remove the per-room message cap for ongoing mediation work this month.",
  business:
    "Structured workplace tone, optional HR-ready summary, and neutral framing for team conflict.",
  prepare:
    "Concrete scripts and guardrails for an in-person talk, phone call, or final message.",
};

const PRICES: Record<PaymentProductType, number> = {
  resolution: PRICING_USD.resolution,
  insight: PRICING_USD.insight,
  extend_session: PRICING_USD.extendSession,
  subscription: PRICING_USD.unlimitedMonthly,
  business: PRICING_USD.businessRoom,
  prepare: PRICING_USD.prepareConversation,
};

export function PaywallModal({
  open,
  product,
  roomId,
  participantId,
  onClose,
}: {
  open: boolean;
  product: PaymentProductType | null;
  roomId: string;
  participantId: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function startCheckout() {
    if (!product) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: product, roomId, participantId }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout.");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bridge-ink/40 p-4 backdrop-blur-sm">
      <Card className="relative max-w-md border-bridge-mist shadow-xl">
        <CardHeader>
          <CardTitle className="font-display text-xl">{TITLES[product]}</CardTitle>
          <p className="text-sm leading-relaxed text-bridge-stone">{BLURBS[product]}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-medium text-bridge-ink">
            Unlock for <span className="font-display">${PRICES[product]}</span>
            {product === "subscription" ? "/month" : ""}
          </p>
          {err && <p className="text-sm text-red-700">{err}</p>}
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-full" disabled={busy} onClick={() => void startCheckout()}>
              {busy ? "Redirecting…" : "Continue to checkout"}
            </Button>
            <Button variant="secondary" className="rounded-full" type="button" onClick={onClose}>
              Not now
            </Button>
          </div>
          <p className="text-xs text-bridge-stone">
            Core communication stays free. Paid features add resolution, clarity, and scale — not a
            barrier to speaking safely.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
