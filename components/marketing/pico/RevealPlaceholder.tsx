import { cn } from "@/lib/utils";

interface RevealPlaceholderProps {
  /** Aspect ratio token. "4/3" hero, "16/9" full-width crescendo, "1/1" square. */
  aspectRatio?: "4/3" | "16/9" | "1/1";
  /** Surface tone. Default midnight. Bone variant exists for light-section
   *  placements but the primary use is midnight. */
  tone?: "midnight" | "bone";
  /** Optional caption override; defaults vary by tone. */
  caption?: string;
  /** Optional figure number (e.g., "01"). Renders top-right. */
  fig?: string;
  /** Optional className passthrough. */
  className?: string;
  /** Mobile aspect-ratio override. Defaults: 16/9 falls back to 4/3 below md
   *  to keep dramatic weight on small screens. */
  mobileAspectRatio?: "4/3" | "16/9" | "1/1";
}

// Pre-launch reveal — drape / curtain treatment. Pure CSS gradients layered
// to read as folded fabric: vertical stripe pattern with five irregular fold
// valleys, top-down lighting falloff, brand-blue behind-glow breathing 12s,
// champagne raking stage light, top gathering band, bottom hem shadow,
// champagne hairline rod across the top. Brand palette only. Reduced-motion
// honored.
export function RevealPlaceholder({
  aspectRatio = "4/3",
  tone = "midnight",
  caption,
  fig = "01",
  className,
  mobileAspectRatio,
}: RevealPlaceholderProps) {
  const isDark = tone === "midnight";
  const captionText =
    caption ?? (isDark ? "Reveal · August 8, 2026" : "Pre-launch reveal");

  const responsiveAspectClass = (() => {
    const mobile = mobileAspectRatio ?? (aspectRatio === "16/9" ? "4/3" : aspectRatio);
    if (mobile === aspectRatio) {
      if (aspectRatio === "1/1") return "aspect-square";
      if (aspectRatio === "4/3") return "aspect-[4/3]";
      return "aspect-[16/9]";
    }
    if (mobile === "4/3" && aspectRatio === "16/9") return "aspect-[4/3] md:aspect-[16/9]";
    if (mobile === "1/1" && aspectRatio === "16/9") return "aspect-square md:aspect-[16/9]";
    if (mobile === "4/3" && aspectRatio === "1/1") return "aspect-[4/3] md:aspect-square";
    if (aspectRatio === "1/1") return "aspect-square";
    if (aspectRatio === "4/3") return "aspect-[4/3]";
    return "aspect-[16/9]";
  })();

  const bracketColor = isDark
    ? "rgba(168, 200, 232, 0.4)"
    : "rgba(31, 47, 79, 0.35)";
  const captionColor = isDark
    ? "rgba(168, 200, 232, 0.7)"
    : "rgba(31, 47, 79, 0.7)";

  // Background depth radial — sets atmosphere behind the drape
  const baseDepth = isDark
    ? "radial-gradient(ellipse 70% 80% at 50% 45%, #1F2F4F 0%, #0C1426 75%)"
    : "radial-gradient(ellipse 70% 80% at 50% 45%, #FDFCF9 0%, #F2EDE3 75%)";

  // Behind-glow — brand-blue (or warm cream on bone) radiating from behind the drape
  const behindGlow = isDark
    ? "radial-gradient(ellipse 45% 55% at 50% 50%, rgba(168,200,232,0.28) 0%, rgba(168,200,232,0.10) 40%, rgba(168,200,232,0) 70%)"
    : "radial-gradient(ellipse 45% 55% at 50% 50%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0) 70%)";

  // The drape itself — vertical stripe pattern of cream highlights and shadow
  // valleys at irregular intervals to read as folded fabric. Five primary
  // valleys with soft 6-8% transitions for a flowy (not stiff) feel.
  const foldGradient = isDark
    ? "linear-gradient(to right, " +
        "rgba(168,200,232,0.04) 0%, " +
        "rgba(168,200,232,0.08) 8%, " +
        "rgba(0,0,0,0.10) 16%, " +
        "rgba(0,0,0,0.28) 22%, " +
        "rgba(0,0,0,0.10) 30%, " +
        "rgba(168,200,232,0.07) 36%, " +
        "rgba(0,0,0,0.08) 44%, " +
        "rgba(0,0,0,0.24) 49%, " +
        "rgba(0,0,0,0.08) 55%, " +
        "rgba(168,200,232,0.08) 61%, " +
        "rgba(0,0,0,0.10) 68%, " +
        "rgba(0,0,0,0.30) 74%, " +
        "rgba(0,0,0,0.10) 82%, " +
        "rgba(168,200,232,0.06) 88%, " +
        "rgba(0,0,0,0.18) 96%, " +
        "rgba(0,0,0,0.10) 100%)"
    : "linear-gradient(to right, " +
        "rgba(255,255,255,0.10) 0%, " +
        "rgba(255,255,255,0.18) 8%, " +
        "rgba(31,47,79,0.06) 16%, " +
        "rgba(31,47,79,0.16) 22%, " +
        "rgba(31,47,79,0.06) 30%, " +
        "rgba(255,255,255,0.16) 36%, " +
        "rgba(31,47,79,0.05) 44%, " +
        "rgba(31,47,79,0.14) 49%, " +
        "rgba(31,47,79,0.05) 55%, " +
        "rgba(255,255,255,0.18) 61%, " +
        "rgba(31,47,79,0.06) 68%, " +
        "rgba(31,47,79,0.18) 74%, " +
        "rgba(31,47,79,0.06) 82%, " +
        "rgba(255,255,255,0.14) 88%, " +
        "rgba(31,47,79,0.10) 96%, " +
        "rgba(31,47,79,0.06) 100%)";

  // Vertical lighting falloff — top is lit (brand-blue ambient), bottom drops
  // into shadow. Layered over the folds.
  const verticalLightingFalloff = isDark
    ? "linear-gradient(to bottom, rgba(168,200,232,0.10) 0%, rgba(168,200,232,0.04) 25%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.08) 75%, rgba(0,0,0,0.18) 100%)"
    : "linear-gradient(to bottom, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 25%, transparent 50%, rgba(31,47,79,0.04) 75%, rgba(31,47,79,0.10) 100%)";

  // Top gathering band — slight darkening at the very top edge where the
  // fabric is gathered against the rod
  const topGather = isDark
    ? "linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.16) 5%, rgba(0,0,0,0) 12%)"
    : "linear-gradient(to bottom, rgba(31,47,79,0.18) 0%, rgba(31,47,79,0.08) 5%, rgba(31,47,79,0) 12%)";

  // Bottom hem shadow — darkens the bottom 12% to anchor weight
  const hemShadow = isDark
    ? "linear-gradient(to top, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.18) 6%, rgba(0,0,0,0) 14%)"
    : "linear-gradient(to top, rgba(31,47,79,0.20) 0%, rgba(31,47,79,0.10) 6%, rgba(31,47,79,0) 14%)";

  // Champagne raking stage light — soft warm highlight from upper-left,
  // breathing on a 12s cycle offset from the behind-glow
  const champagneRake = isDark
    ? "radial-gradient(ellipse 60% 40% at 30% 25%, rgba(232,220,196,0.18) 0%, rgba(232,220,196,0.06) 40%, rgba(232,220,196,0) 70%)"
    : "radial-gradient(ellipse 60% 40% at 30% 25%, rgba(232,220,196,0.30) 0%, rgba(232,220,196,0.10) 40%, rgba(232,220,196,0) 70%)";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes pico-glow-breathe {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 0.85; }
}
@keyframes pico-light-breathe {
  0%, 100% { opacity: 0.80; }
  50%      { opacity: 1.00; }
}
@media (prefers-reduced-motion: reduce) {
  .pico-glow, .pico-light { animation: none !important; }
}
          `.trim(),
        }}
      />

      <figure
        className={cn(
          "relative w-full overflow-hidden",
          responsiveAspectClass,
          className,
        )}
        role="img"
        aria-label={
          isDark
            ? "Pre-launch reveal placeholder — Precise Pico will be unveiled at the launch event."
            : "Pre-launch reveal placeholder."
        }
      >
        {/* Base depth — atmospheric background */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: baseDepth }}
        />

        {/* Behind-glow — brand-blue radiating from behind the drape, breathing */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 pico-glow"
          style={{
            backgroundImage: behindGlow,
            animation: "pico-glow-breathe 12s ease-in-out infinite",
          }}
        />

        {/* The drape — vertical fold pattern */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: foldGradient }}
        />

        {/* Vertical lighting falloff — top lit, bottom shadowed */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: verticalLightingFalloff }}
        />

        {/* Top gathering band */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: topGather }}
        />

        {/* Champagne raking stage light, breathing offset from behind-glow */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 pico-light"
          style={{
            backgroundImage: champagneRake,
            animation: "pico-light-breathe 12s ease-in-out infinite",
            animationDelay: "-6s",
          }}
        />

        {/* Bottom hem shadow */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: hemShadow }}
        />

        {/* Top edge champagne hairline rod */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 right-0"
          style={{
            height: "1px",
            backgroundImage: isDark
              ? "linear-gradient(to right, rgba(232,220,196,0) 0%, rgba(232,220,196,0.55) 20%, rgba(232,220,196,0.55) 80%, rgba(232,220,196,0) 100%)"
              : "linear-gradient(to right, rgba(184,150,90,0) 0%, rgba(184,150,90,0.55) 20%, rgba(184,150,90,0.55) 80%, rgba(184,150,90,0) 100%)",
          }}
        />

        {/* Corner brackets — Fig motif */}
        {[
          { top: "12px", left: "12px" },
          { top: "12px", right: "12px" },
          { bottom: "12px", left: "12px" },
          { bottom: "12px", right: "12px" },
        ].map((pos, i) => (
          <span key={i} aria-hidden="true">
            <span
              className="pointer-events-none absolute"
              style={{ ...pos, width: "1px", height: "12px", backgroundColor: bracketColor }}
            />
            <span
              className="pointer-events-none absolute"
              style={{ ...pos, width: "12px", height: "1px", backgroundColor: bracketColor }}
            />
          </span>
        ))}

        {/* Fig annotation — top-right */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-3 right-5 font-body text-[10px] tracking-[0.24em] uppercase"
          style={{ color: captionColor }}
        >
          Fig. {fig}
        </span>

        {/* Caption — bottom edge */}
        <figcaption className="pointer-events-none absolute bottom-3 left-5 right-5 flex items-center justify-between">
          <span
            className="font-body text-[10px] tracking-[0.24em] uppercase"
            style={{ color: captionColor }}
          >
            {captionText}
          </span>
          <span
            className="font-body text-[10px] italic tracking-normal"
            style={{ color: captionColor, opacity: 0.7 }}
          >
            Precise Pico™
          </span>
        </figcaption>
      </figure>
    </>
  );
}
