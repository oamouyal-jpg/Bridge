import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InsightCard } from "@/lib/types";

export function InsightPanel({ cards }: { cards: InsightCard[] }) {
  if (!cards.length) {
    return (
      <aside className="rounded-2xl border border-dashed border-bridge-mist bg-white p-4 text-sm text-bridge-stone">
        Private guidance will appear here as you write — tuned to you only.
      </aside>
    );
  }

  return (
    <aside className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-bridge-sageMuted">
        Private guidance
      </p>
      {cards.map((c) => (
        <Card key={c.id} className="border-bridge-mist bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-bridge-ink">{c.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-bridge-stone">{c.body}</CardContent>
        </Card>
      ))}
    </aside>
  );
}
