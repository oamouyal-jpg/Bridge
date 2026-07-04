"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const ROOM_IMAGE =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=65";

type AmbientBackdropProps = {
  className?: string;
  emphasis?: "default" | "soft";
};

/**
 * Room photography is the hero — no white wash; optional edge darkening only for depth.
 *
 * Mobile Safari: `fixed` + classic `100vh` tracks the *dynamic* viewport, so the URL bar
 * show/hide keeps resizing the layer and the photo “twitches”. We pin to the *small*
 * viewport (`svh` / Tailwind `*-svh`) so size stays stable, and slightly scale the image
 * so soft edges never flash at the crop.
 */
export function AmbientBackdrop({ className, emphasis = "default" }: AmbientBackdropProps) {
  const imgOpacity = emphasis === "soft" ? "opacity-100" : "opacity-[0.92]";
  const edge =
    emphasis === "soft"
      ? "from-transparent via-transparent to-black/[0.12]"
      : "from-transparent via-transparent to-black/[0.15]";

  return (
    <div
      className={cn(
        "pointer-events-none fixed left-0 top-0 z-0 w-full overflow-hidden",
        /* `svh` = small viewport — does not resize when iOS toolbars animate */
        "h-svh min-h-svh max-h-svh",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0">
        <Image
          src={ROOM_IMAGE}
          alt=""
          fill
          priority={false}
          sizes="100vw"
          className={cn(
            "object-cover object-center [transform:translateZ(0)] [backface-visibility:hidden]",
            "scale-[1.04] motion-reduce:scale-100 sm:scale-100",
            imgOpacity,
          )}
          draggable={false}
        />
      </div>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-b", edge)} aria-hidden />
    </div>
  );
}
