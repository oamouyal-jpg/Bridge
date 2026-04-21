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
}: {
  children: ReactNode;
  className?: string;
  emphasis?: "default" | "soft";
  /** `solid` = opaque cream (best readability over the photo, e.g. room pages). */
  contentVeil?: "light" | "medium" | "none" | "solid";
}) {
  const veil =
    contentVeil === "none"
      ? "bg-transparent"
      : contentVeil === "solid"
        ? "bg-bridge-cream"
        : contentVeil === "light"
          ? "bg-bridge-cream/35"
          : "bg-bridge-cream/52";
  return (
    <div className={cn("relative min-h-screen", className)}>
      <AmbientBackdrop emphasis={emphasis} />
      <div className={cn("relative z-10 min-h-screen w-full", veil)}>
        {children}
      </div>
    </div>
  );
}
