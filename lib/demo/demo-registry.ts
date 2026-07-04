import { DEMO_SCRIPTS } from "./scripts";
import { SCREENPLAY_MANIFESTS } from "./screenplay";

export type DemoKind = "legacy" | "screenplay";

export type DemoOption = { id: string; label: string; kind: DemoKind };

export const DEMO_OPTIONS: DemoOption[] = [
  ...SCREENPLAY_MANIFESTS.map((m) => ({
    id: m.id,
    label: m.title,
    kind: "screenplay" as const,
  })),
  ...DEMO_SCRIPTS.map((s) => ({
    id: s.id,
    label: s.label,
    kind: "legacy" as const,
  })),
];

export function getDemoKind(id: string): DemoKind {
  return SCREENPLAY_MANIFESTS.some((m) => m.id === id) ? "screenplay" : "legacy";
}
