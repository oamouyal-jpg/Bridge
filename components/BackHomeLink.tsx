"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";
import { isRtlLocale } from "@/lib/i18n/types";

type Props = {
  href?: string;
  /** Pass `t.common.backHome` — any leading arrow in the string is stripped (icon replaces it). */
  label: string;
};

export function BackHomeLink({ href = "/", label }: Props) {
  const { locale } = useBridgeLocale();
  const isRtl = isRtlLocale(locale);
  const text = label.replace(/^[←→]\s*/, "").trim();

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border-2 border-bridge-mist bg-white px-3 py-2 text-sm font-semibold text-bridge-ink shadow-sm transition-colors",
        "hover:border-bridge-sage hover:bg-bridge-sand",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bridge-sage"
      )}
    >
      <ArrowLeft
        className={cn("h-4 w-4 shrink-0 text-bridge-sage", isRtl && "rotate-180")}
        aria-hidden
      />
      <span>{text}</span>
    </Link>
  );
}
