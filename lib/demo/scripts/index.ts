import type { DemoScript } from "../types";
import { defaultCoupleScript } from "./defaultCouple";
import { friendsRepairScript } from "./friendsRepair";

export const DEMO_SCRIPTS: DemoScript[] = [defaultCoupleScript, friendsRepairScript];

export function getScriptById(id: string): DemoScript | undefined {
  return DEMO_SCRIPTS.find((s) => s.id === id);
}

export { defaultCoupleScript, friendsRepairScript };
