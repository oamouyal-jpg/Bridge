import type { Metadata } from "next";
import { Suspense } from "react";
import { DemoExperience } from "@/components/demo/DemoExperience";

export const metadata: Metadata = {
  title: "Demo mode",
  description:
    "Autoplay walkthrough: private reflection, invitation, and a mediated shared exchange — using the real Bridge UI. Add ?tiktok=1 for a 9:16 frame while screen recording.",
};

export default function DemoPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bridge-cream p-8 text-center text-sm text-bridge-stone">Loading demo…</div>}>
      <DemoExperience />
    </Suspense>
  );
}
