// Soft brand-color radial blooms for bone-toned sections — atmospheric light
// fall-off in brand-300 (soft blue) and champagne-200 (warm gold) at low
// opacity. Reads as ambient light bouncing off the surface, not as AI gradient
// cliché. Each variant places blooms asymmetrically so consecutive bone
// sections don't repeat.
//
// Drop as the FIRST child of any `<Section tone="bone">`. Section needs
// `relative isolate overflow-hidden` for proper layering.

type Variant = "thesis" | "outcomes" | "demo" | "lead" | "practitioner";

interface BloomConfig {
  // Position (CSS values).
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  // Size of the bloom (px, full diameter).
  size: number;
  // Color hex.
  color: string;
  // Opacity 0..1 (applied to the bloom container).
  opacity: number;
}

interface LineConfig {
  // "h" = horizontal hairline, "v" = vertical hairline.
  orient: "h" | "v";
  // Position from edges (CSS values — supply two of top/bottom and one of
  // left/right for horizontal, vice versa for vertical).
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  // Length of the line (CSS value).
  length: string;
  // Opacity 0..1 (defaults to 0.22).
  opacity?: number;
  // Thickness in pixels (defaults to 1).
  thickness?: number;
}

// Sparse hand-composed asymmetric line sets per section. Bauhaus / De Stijl
// register — thin dark hairlines placed deliberately, not on a regular grid.
// Kept sparse (4–5 lines per section) so they read as architectural framing,
// not as decoration noise.
const LINES: Record<Variant, LineConfig[]> = {
  thesis: [
    // Long vertical anchor, left side, descending from top
    { orient: "v", left: "6%", top: "8%", length: "62%", opacity: 0.22 },
    // Short horizontal at upper-right, hard right anchor
    // Pulled up from top:22% to top:8% — at 22%, mobile section is tall enough
    // that the line landed on top of "We changed the inputs..." body copy.
    { orient: "h", right: "0%", top: "8%", length: "28%", opacity: 0.2 },
    // Medium horizontal — moved to below the right-column lead paragraph
    // (was hitting the body text at bottom: 32%, then bottom: 8%)
    { orient: "h", right: "12%", bottom: "3%", length: "38%", opacity: 0.18 },
    // Short vertical accent on the right margin (past the right column lead
    // paragraph to avoid crossing text)
    { orient: "v", right: "2%", bottom: "12%", length: "22%", opacity: 0.2 },
  ],
  outcomes: [
    // Long vertical anchor, right side
    { orient: "v", right: "5%", top: "12%", length: "55%", opacity: 0.22 },
    // Short horizontal at upper-left — moved up from top:32% (was landing on
    // body copy mid-section on tall mobile single-column layouts)
    { orient: "h", left: "0%", top: "3%", length: "26%", opacity: 0.2 },
    // Medium horizontal lower-left — moved down from bottom:20% (same reason)
    { orient: "h", left: "8%", bottom: "1%", length: "34%", opacity: 0.18 },
    // Short vertical accent upper-mid
    { orient: "v", left: "55%", top: "0%", length: "18%", opacity: 0.2 },
  ],
  // Demo CTA — section is centered single-column. Lines hug the outer margins
  // so none cross the centered heading / lead / paragraph.
  demo: [
    // Top-left horizontal accent — sits above all content
    { orient: "h", left: "0%", top: "10%", length: "22%", opacity: 0.2 },
    // Long vertical anchor on the right margin (was crossing centered content
    // when placed at left:58% — that was the 2-up gap, no longer needed)
    { orient: "v", right: "5%", top: "10%", length: "70%", opacity: 0.18 },
    // Bottom-right horizontal — below all content
    // Pushed down from bottom:10% to bottom:3% — at 10%, mobile section was
    // tall enough that the line landed on top of the "A demonstration covers..."
    // body copy. 3% sits below the CTA in section bottom-padding.
    { orient: "h", right: "0%", bottom: "3%", length: "28%", opacity: 0.2 },
    // Short vertical accent on the bottom-left, in the left margin
    { orient: "v", left: "5%", bottom: "5%", length: "12%", opacity: 0.22 },
  ],
  // Lead capture — very minimal, two lines only.
  // Horizontal moved up from top:30% (was landing on body copy on tall
  // mobile single-column sections).
  lead: [
    { orient: "h", left: "0%", top: "8%", length: "20%", opacity: 0.18 },
    { orient: "v", right: "10%", top: "0%", length: "55%", opacity: 0.2 },
  ],
  // Practitioner application form — no lines (form is content-dense and
  // long-scrolling, lines would inevitably cross inputs/labels). Bloom only.
  practitioner: [],
};

const VARIANTS: Record<Variant, BloomConfig[]> = {
  // Thesis — brand-blue bloom upper-left, champagne bloom lower-right.
  thesis: [
    {
      left: "-12%",
      top: "-25%",
      size: 900,
      color: "#A8C8E8", // brand-300
      opacity: 0.78,
    },
    {
      right: "-8%",
      bottom: "-30%",
      size: 720,
      color: "#E8DCC4", // champagne-200
      opacity: 0.72,
    },
  ],
  // Outcomes — champagne upper-right, brand-blue lower-left (mirror).
  outcomes: [
    {
      right: "-10%",
      top: "-20%",
      size: 800,
      color: "#E8DCC4", // champagne-200
      opacity: 0.68,
    },
    {
      left: "-12%",
      bottom: "-30%",
      size: 800,
      color: "#A8C8E8", // brand-300
      opacity: 0.72,
    },
  ],
  // Demo CTA — single brand-blue bloom centered upper, no champagne.
  demo: [
    {
      left: "20%",
      top: "-35%",
      size: 880,
      color: "#A8C8E8",
      opacity: 0.78,
    },
  ],
  // Lead capture — single small brand-blue bloom.
  lead: [
    {
      right: "-18%",
      top: "-40%",
      size: 600,
      color: "#A8C8E8",
      opacity: 0.62,
    },
  ],
  // Practitioner application form — single subtle brand-blue bloom in the
  // upper-right corner. Uses pixel offsets (not percentages) because the form
  // section can be very tall (3000+px) and percentage positioning would put
  // the bloom far above the visible area. Lower opacity than marketing
  // sections so it doesn't compete with form readability.
  practitioner: [
    {
      right: "-160px",
      top: "-160px",
      size: 700,
      color: "#A8C8E8",
      opacity: 0.5,
    },
  ],
};

export function BoneBlooms({ variant }: { variant: Variant }) {
  const blooms = VARIANTS[variant];
  const lines = LINES[variant];
  return (
    <>
      {/* Sparse asymmetric architectural hairlines — Bauhaus / De Stijl
          register. Hand-composed line set per variant. */}
      {lines.map((line, i) => {
        const thickness = line.thickness ?? 1;
        const isHorizontal = line.orient === "h";
        return (
          <span
            key={`line-${i}`}
            aria-hidden="true"
            className="pointer-events-none absolute -z-10 bg-ink-700"
            style={{
              top: line.top,
              bottom: line.bottom,
              left: line.left,
              right: line.right,
              width: isHorizontal ? line.length : `${thickness}px`,
              height: isHorizontal ? `${thickness}px` : line.length,
              opacity: line.opacity ?? 0.22,
            }}
          />
        );
      })}

      {blooms.map((b, i) => {
        const halfSize = b.size / 2;
        // Build the gradient: solid color at center → transparent at edge.
        // Two-stop with soft middle for a smooth bloom.
        const background = `radial-gradient(circle at center, ${b.color} 0%, ${b.color}80 30%, ${b.color}00 70%)`;
        return (
          <div
            key={i}
            aria-hidden="true"
            className="pointer-events-none absolute -z-10"
            style={{
              left: b.left,
              right: b.right,
              top: b.top,
              bottom: b.bottom,
              width: `${b.size}px`,
              height: `${b.size}px`,
              marginLeft: b.left ? undefined : undefined,
              opacity: b.opacity,
              background,
              filter: `blur(${Math.round(halfSize / 8)}px)`,
            }}
          />
        );
      })}
    </>
  );
}
