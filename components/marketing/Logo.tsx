import Image from "next/image";
import Link from "next/link";

type LogoVariant = "horizontal" | "monogram-circle" | "monogram";
type LogoTone = "auto" | "cream" | "navy" | "black" | "white";

interface LogoProps {
  variant?: LogoVariant;
  tone?: LogoTone;
  width?: number;
  href?: string | null;
  className?: string;
  priority?: boolean;
}

const LOGO_DIR = "/brand/precise-aesthetics-brand-identity/assets/logos";

const fileMap: Record<LogoVariant, Partial<Record<LogoTone, string>>> = {
  horizontal: {
    cream: `${LOGO_DIR}/precise-aesthetics-horizontal-cream.svg`,
    navy: `${LOGO_DIR}/precise-aesthetics-horizontal-navy.svg`,
    black: `${LOGO_DIR}/precise-aesthetics-horizontal-black.svg`,
    white: `${LOGO_DIR}/precise-aesthetics-horizontal-white.svg`,
  },
  "monogram-circle": {
    cream: `${LOGO_DIR}/precise-aesthetics-monogram-circle-dark.svg`,
    navy: `${LOGO_DIR}/precise-aesthetics-monogram-circle-light.svg`,
  },
  monogram: {
    cream: `${LOGO_DIR}/precise-aesthetics-monogram-cream.svg`,
    navy: `${LOGO_DIR}/precise-aesthetics-monogram-navy.svg`,
  },
};

const defaultWidth: Record<LogoVariant, number> = {
  horizontal: 200,
  "monogram-circle": 48,
  monogram: 56,
};

const aspectRatio: Record<LogoVariant, number> = {
  horizontal: 800 / 200,
  "monogram-circle": 1,
  monogram: 1,
};

function resolveTone(tone: LogoTone): Exclude<LogoTone, "auto"> {
  return tone === "auto" ? "navy" : tone;
}

export function Logo({
  variant = "horizontal",
  tone = "auto",
  width,
  href = "/",
  className,
  priority = false,
}: LogoProps) {
  const resolved = resolveTone(tone);
  const src = fileMap[variant][resolved] ?? fileMap[variant].navy!;
  const w = width ?? defaultWidth[variant];
  const h = Math.round(w / aspectRatio[variant]);

  const img = (
    <Image
      src={src}
      alt="Precise Aesthetics"
      width={w}
      height={h}
      priority={priority}
      className={className}
    />
  );

  if (href === null) return img;
  return (
    <Link href={href ?? "/"} aria-label="Precise Aesthetics — home" className="inline-block">
      {img}
    </Link>
  );
}
