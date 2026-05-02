import { cn } from "@/lib/utils";

interface DropCapParagraphProps {
  children: React.ReactNode;
  /** "light" → ink-900 cap on bone surfaces (default). "dark" → cream-50 on midnight. */
  tone?: "light" | "dark";
  className?: string;
}

// Drop-cap paragraph — Fraunces italic first letter, body Inter prose.
// Tuned to match the homepage Thesis treatment so /system pages stay
// consistent with the homepage editorial register.
export function DropCapParagraph({
  children,
  tone = "light",
  className,
}: DropCapParagraphProps) {
  return (
    <p
      className={cn(
        "font-body text-body leading-body max-w-[58ch]",
        "first-letter:font-display first-letter:italic first-letter:text-[3.5em]",
        "first-letter:font-medium first-letter:float-left first-letter:mr-2",
        "first-letter:mt-1 first-letter:leading-[0.8]",
        tone === "light"
          ? "text-ink-700 first-letter:text-ink-900"
          : "text-cream-100 first-letter:text-cream-50",
        className,
      )}
    >
      {children}
    </p>
  );
}
