"use client";

import { Bell } from "lucide-react";
import type { Participant, RoomStatus } from "@/lib/types";

type OtherLite = { displayName: string; intakeCompleted: boolean };

/**
 * Lets each person see when others are still in private background intake — no content leaked.
 */
export function IntakePartnerStatusBanner({
  roomStatus,
  me,
  others,
}: {
  roomStatus: RoomStatus;
  me?: Participant;
  others?: OtherLite[];
}) {
  if (roomStatus !== "intake_in_progress") return null;
  if (!others?.length) return null;

  const meDone = Boolean(me?.intakeCompleted);
  const incomplete = others.filter((o) => !o.intakeCompleted);
  const allOthersDone = incomplete.length === 0;

  if (meDone && allOthersDone) return null;

  const listNames = (arr: OtherLite[], max = 4) => {
    const labels = arr.slice(0, max).map((o) => o.displayName);
    const extra = arr.length > max ? ` +${arr.length - max} more` : "";
    return labels.join(", ") + extra;
  };

  if (!meDone && allOthersDone) {
    return (
      <div
        className="mb-4 flex gap-3 rounded-2xl border border-bridge-sage/35 bg-bridge-sage/[0.12] p-4 text-sm text-bridge-ink shadow-sm"
        role="status"
        aria-live="polite"
      >
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-bridge-sage" aria-hidden />
        <div>
          <p className="font-semibold">Update for you</p>
          <p className="mt-1 leading-relaxed text-bridge-stone">
            Everyone else has finished their private background. Take your time with yours — when
            you&apos;re done too, you&apos;ll unlock the next step <strong>together</strong>.
          </p>
        </div>
      </div>
    );
  }

  if (!meDone && incomplete.length > 0) {
    return (
      <div
        className="mb-4 flex gap-3 rounded-2xl border border-sky-200/90 bg-sky-50/90 p-4 text-sm text-sky-950 shadow-sm"
        role="status"
        aria-live="polite"
      >
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" aria-hidden />
        <div>
          <p className="font-semibold text-sky-950">Update for you</p>
          <p className="mt-1 leading-relaxed text-sky-900/90">
            <span className="font-medium">{listNames(incomplete)}</span>
            {incomplete.length === 1 ? " is " : " are "}
            still in their <strong>private background</strong> session with Bridge. Nothing they say
            here is visible to you yet. You&apos;ll move to the next stage when{" "}
            <strong>this step is done for each of you</strong>.
          </p>
        </div>
      </div>
    );
  }

  if (meDone && incomplete.length > 0) {
    return (
      <div
        className="mb-4 flex gap-3 rounded-2xl border border-bridge-sage/35 bg-bridge-sage/[0.12] p-4 text-sm text-bridge-ink shadow-sm"
        role="status"
        aria-live="polite"
      >
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-bridge-sage" aria-hidden />
        <div>
          <p className="font-semibold">Update for you</p>
          <p className="mt-1 leading-relaxed text-bridge-stone">
            You&apos;re done with your private intake.{" "}
            <span className="font-medium text-bridge-ink">{listNames(incomplete)}</span>{" "}
            {incomplete.length === 1 ? "is" : "are"} still finishing theirs — the shared step unlocks
            when everyone is ready.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
