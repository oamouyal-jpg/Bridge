import { cn } from "@/lib/utils";
import type { RoomRiskState } from "@/lib/types";

const levelStyles: Record<
  RoomRiskState["level"],
  { bar: string; border: string; bg: string; dot: string }
> = {
  low: {
    bar: "bg-amber-300",
    border: "border-amber-200",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
  },
  medium: {
    bar: "bg-orange-400",
    border: "border-orange-200",
    bg: "bg-orange-50",
    dot: "bg-orange-500",
  },
  high: {
    bar: "bg-red-500",
    border: "border-red-200",
    bg: "bg-red-50",
    dot: "bg-red-600",
  },
};

export function SafetySignalsBanner({ risk }: { risk: RoomRiskState }) {
  const st = levelStyles[risk.level];
  const showPrivateGuidance = risk.level === "medium" || risk.level === "high";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        st.border,
        st.bg
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn("h-3 w-3 shrink-0 rounded-full", st.dot)}
          title="Safety signal level"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-bridge-ink/80">
            Safety signals
          </p>
          <p className="mt-1 text-sm font-medium leading-snug text-bridge-ink">{risk.message}</p>
          <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white">
            <div
              className={cn("h-full rounded-full transition-all", st.bar)}
              style={{ width: `${risk.score}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-bridge-stone">
            Score {risk.score}/100 · Updated {new Date(risk.lastUpdated).toLocaleString()}
          </p>
        </div>
      </div>

      {risk.signals.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-relaxed text-bridge-stone">
          {risk.signals.map((s, i) => (
            <li key={`${i}-${s.slice(0, 32)}`}>{s}</li>
          ))}
        </ul>
      )}

      {showPrivateGuidance && (
        <div className="mt-4 rounded-xl border border-white/80 bg-white p-3 text-xs leading-relaxed text-bridge-ink">
          <p className="font-medium">Private guidance</p>
          <p className="mt-1 text-bridge-stone">
            Consider slowing the pace, naming boundaries clearly, and avoiding escalation — including
            postponing in-person contact if you don&apos;t feel safe. If you fear harm, pause and reach
            human support you trust.
          </p>
        </div>
      )}
    </div>
  );
}
