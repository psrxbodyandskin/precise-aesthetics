"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpStatProps {
  /** Target numeric value (e.g., 95 for "~95%", 4 for "4×"). */
  target: number;
  /** Animation duration in milliseconds. */
  durationMs?: number;
  /** Prefix string (e.g., "~"). */
  prefix?: string;
  /** Suffix string (e.g., "%" or "×"). */
  suffix?: string;
  /** Decimal places to show during animation. Default 0. */
  decimals?: number;
  /** Screen reader label (read instead of the animating number). */
  srLabel: string;
  /** Wrapper className. */
  className?: string;
}

// Animates a metric value from 0 → target when scrolled into viewport.
// Fires once per page load. Respects prefers-reduced-motion (shows final
// value with no animation). Uses IntersectionObserver, no scroll listeners.
export function CountUpStat({
  target,
  durationMs = 1400,
  prefix = "",
  suffix = "",
  decimals = 0,
  srLabel,
  className,
}: CountUpStatProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      setDone(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    let rafId = 0;
    let startedAt: number | null = null;

    const animate = (now: number) => {
      if (startedAt === null) startedAt = now;
      const elapsed = now - startedAt;
      const t = Math.min(1, elapsed / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        setDone(true);
      }
    };

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            rafId = requestAnimationFrame(animate);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(node);

    return () => {
      cancelAnimationFrame(rafId);
      obs.disconnect();
    };
  }, [target, durationMs]);

  const display = done
    ? target.toFixed(decimals)
    : value.toFixed(decimals);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">
        {prefix}
        {display}
        {suffix}
      </span>
      <span className="sr-only">{srLabel}</span>
    </span>
  );
}
