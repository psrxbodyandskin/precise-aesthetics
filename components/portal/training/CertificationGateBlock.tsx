import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";

interface CertificationGateBlockProps {
  /** When provided, names the device(s) the practice still needs to certify for. */
  uncertifiedDeviceNames?: string[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Used at /portal/treatments/new when the practice has zero certified
// devices. Replaces the form entirely with a clear "complete training"
// CTA. (The partial-certification case is handled by the protocol
// selector itself filtering to certified-device protocols.)
export function CertificationGateBlock({
  uncertifiedDeviceNames,
}: CertificationGateBlockProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-md border border-ink-700/15 bg-bone-50 p-10 text-center">
      <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-brand-300/15 text-brand-700">
        <GraduationCap
          className="size-6"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
      <p
        className="mt-5 font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        Training required
      </p>
      <h2
        className="mt-3 font-display text-ink-900"
        style={{
          fontSize: "clamp(1.5rem, 1.5vw + 1rem, 2rem)",
          lineHeight: 1.1,
          letterSpacing: "-0.015em",
          fontWeight: 400,
        }}
      >
        Complete training before logging treatments.
      </h2>
      <p
        className="mx-auto mt-3 max-w-md font-body text-ink-700"
        style={{ lineHeight: 1.65 }}
      >
        Treatment logging is unlocked once your practice has completed
        certification for at least one of your devices.
        {uncertifiedDeviceNames && uncertifiedDeviceNames.length > 0 && (
          <> Outstanding: {uncertifiedDeviceNames.join(", ")}.</>
        )}
      </p>
      <div className="mt-6">
        <Link
          href="/portal/training"
          className="inline-flex h-11 items-center gap-1.5 rounded-sm bg-midnight-800 px-5 font-body text-small font-medium text-cream-50 transition-colors duration-[150ms] hover:bg-midnight-700 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
        >
          Continue training
          <ArrowRight
            className="size-3.5"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </Link>
      </div>
    </div>
  );
}
