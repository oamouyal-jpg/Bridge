"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { getDemoKind } from "@/lib/demo/demo-registry";
import { romanticReconnection01 } from "@/lib/demo/screenplay";
import { LegacyDemoPanel } from "./LegacyDemoPanel";
import { ScreenplayDemoPanel } from "./ScreenplayDemoPanel";

/**
 * TikTok / Reels: open `/demo?tiktok=1`, start screen recording, then Replay once
 * so the capture begins at the title card. Export 1080×1920 (9:16) in your editor if needed.
 */
export function DemoExperience() {
  const searchParams = useSearchParams();
  const tiktok =
    searchParams.get("tiktok") === "1" ||
    searchParams.get("record") === "1" ||
    searchParams.get("vertical") === "1";

  const [selectedId, setSelectedId] = useState(romanticReconnection01.id);
  const kind = getDemoKind(selectedId);

  const panel =
    kind === "screenplay" ? (
      <ScreenplayDemoPanel
        key={selectedId}
        selectedId={selectedId}
        onSelectId={setSelectedId}
        fillParent={tiktok}
      />
    ) : (
      <LegacyDemoPanel key={selectedId} selectedId={selectedId} onSelectId={setSelectedId} fillParent={tiktok} />
    );

  if (!tiktok) {
    return panel;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black p-2 sm:p-3">
      <div
        className="overflow-hidden rounded-[1.35rem] border border-white/12 bg-bridge-cream shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
        style={{
          aspectRatio: "9 / 16",
          height: "min(92dvh, 900px)",
          width: "min(100vw - 1rem, calc(min(92dvh, 900px) * 9 / 16))",
        }}
      >
        <div className="h-full w-full overflow-hidden">{panel}</div>
      </div>
    </div>
  );
}
