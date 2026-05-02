import { cn } from "@/lib/utils";

interface PivotLineProps {
  /** The italicized pivot text. */
  children: React.ReactNode;
  /** "light" for bone surfaces (ink-900), "dark" for midnight surfaces (cream-50). */
  tone?: "light" | "dark";
  /** Size variant. "body" (default) reads as paragraph emphasis; "lg" promotes to display-adjacent. */
  size?: "body" | "lg";
  /** Optional centered alignment for sections that center their prose. */
  align?: "left" | "center";
  className?: string;
}

// Italicized pivot lines act as document punctuation across the manifesto and
// pillar pages. Manifesto rule: italic Fraunces at body size — they read as
// paragraph emphasis, NOT as section breaks. The "lg" size is reserved for
// the manifesto's most weighted lines (e.g., Section 5's closing).
export function PivotLine({
  children,
  tone = "light",
  size = "body",
  align = "left",
  className,
}: PivotLineProps) {
  return (
    <p
      className={cn(
        "font-display italic leading-tight tracking-display",
        size === "body"
          ? "text-[1.5rem] md:text-[1.75rem]"
          : "text-[clamp(2rem,3vw+1rem,3.25rem)]",
        tone === "light" ? "text-ink-900" : "text-cream-50",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </p>
  );
}
