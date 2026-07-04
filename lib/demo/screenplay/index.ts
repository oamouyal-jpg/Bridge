import type { ScreenplayManifest } from "./types";
import { romanticReconnection01 } from "./romanticReconnection01";

export const SCREENPLAY_MANIFESTS: ScreenplayManifest[] = [romanticReconnection01];

export function getScreenplayById(id: string): ScreenplayManifest | undefined {
  return SCREENPLAY_MANIFESTS.find((m) => m.id === id);
}

export { romanticReconnection01 };
export type { ScreenplayManifest, ScreenplayStep } from "./types";
export { useScreenplayPlayback } from "./useScreenplayPlayback";
export type { ScreenplayPlayback } from "./useScreenplayPlayback";
