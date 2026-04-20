"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const ROOM_IMAGE =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=65";

type AmbientBackdropProps = {
  className?: string;
  emphasis?: "default" | "soft";
};

/** Room photography is the hero — no white wash; optional edge darkening only for depth. */
export function AmbientBackdrop({ className, emphasis = "default" }: AmbientBackdropProps) {
  const imgOpacity = emphasis === "soft" ? "opacity-100" : "opacity-[0.92]";
  const edge =
    emphasis === "soft"
      ? "from-transparent via-transparent to-black/[0.12]"
      : "from-transparent via-transparent to-black/[0.15]";

  return (
    <div
      className={cn("pointer-events-none fixed inset-0 z-0 overflow-hidden", className)}
      aria-hidden
    >
      <Image
        src={ROOM_IMAGE}
        alt=""
        fill
        priority={false}
        sizes="100vw"
        className={cn("object-cover object-center", imgOpacity)}
      />
      <div className={cn("absolute inset-0 bg-gradient-to-b", edge)} aria-hidden />
    </div>
  );
}
