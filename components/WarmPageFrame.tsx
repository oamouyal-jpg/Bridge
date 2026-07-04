"use client";

import type { ReactNode } from "react";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { cn } from "@/lib/utils";

export function WarmPageFrame({
  children,
  className,
  emphasis,
  /** How much cream sits over the photo — `none` keeps the room visible (use with marketing sheet UI). */
  contentVeil = "medium",
  /** Fill a parent with fixed height (e.g. `/demo?tiktok=1` 9:16 frame) instead of at least one viewport tall. */
  fillParent = false,
}: {
  children: ReactNode;
  className?: string;
  emphasis?: "default" | "soft";
  /** `solid` = opaque cream (best readability over the photo, e.g. room pages). */
  contentVeil?: "light" | "medium" | "none" | "solid";
  fillParent?: boolean;
}) {
  const veil =
    contentVeil === "none"
      ? "bg-transparent"
      : contentVeil === "solid"
        ? "bg-bridge-cream"
        : contentVeil === "light"
          ? "bg-bridge-cream/35"
          : "bg-bridge-cream/52";
  const minH = fillParent ? "min-h-0 h-full" : "min-h-svh";

  return (
    <div className={cn("relative", minH, className)}>
      <AmbientBackdrop emphasis={emphasis} />
      <div className={cn("relative z-10 w-full", minH, veil)}>
        {children}
      </div>
    </div>
  );
}
