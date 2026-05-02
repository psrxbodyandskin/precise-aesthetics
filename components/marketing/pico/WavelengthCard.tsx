import { cn } from "@/lib/utils";

export interface WavelengthCardProps {
  /** Eyebrow above the wavelength number (e.g., "NEODYMIUM YAG"). */
  eyebrow: string;
  /** Wavelength label (e.g., "1064 nm"). Renders oversized in display face. */
  wavelength: string;
  /** Body description. */
  description: React.ReactNode;
  /** Indication tags — comma-separated rendered as a single line. */
  indications: string[];
  /** Optional className passthrough. */
  className?: string;
}

// Single wavelength card for the Section 3 Four Wavelengths grid.
// Surface: midnight-700 with brand-300/30 hairline border + asymmetric corner
// brackets matching the system Card pattern. Wavelength number is the visual
// hero — oversized brand-300 Fraunces.
export function WavelengthCard({
  eyebrow,
  wavelength,
  description,
  indications,
  className,
}: WavelengthCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col p-8 md:p-10",
        "bg-midnight-700",
        "border border-brand-300/30",
        "rounded-lg",
        "transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-1 hover:border-brand-300/50",
        className,
      )}
    >
      {/* Top hairline accent */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-300/50 to-transparent"
      />

      {/* Asymmetric corner brackets — Fig motif */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-3 w-px bg-brand-300/40"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-px w-3 bg-brand-300/40"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-3 w-px bg-brand-300/40"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-px w-3 bg-brand-300/40"
      />

      {/* Eyebrow */}
      <span className="font-body text-overline tracking-overline uppercase text-cream-300">
        {eyebrow}
      </span>

      {/* Wavelength number — oversized */}
      <p className="mt-6 font-display tracking-heading leading-none text-[clamp(2.25rem,2.5vw+1rem,3.25rem)] text-brand-300">
        {wavelength}
      </p>

      {/* Description */}
      <p className="mt-6 font-body text-body leading-body text-cream-100 max-w-[36ch]">
        {description}
      </p>

      {/* Indications — small caps, comma-separated, no bullets */}
      <p className="mt-8 font-body text-small leading-body text-cream-300">
        <span className="block font-body text-overline tracking-overline uppercase text-brand-300/80 mb-2">
          Indications
        </span>
        {indications.join(", ")}
      </p>
    </article>
  );
}
