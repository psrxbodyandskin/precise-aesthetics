"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Variants are chosen by the caller, not auto-flipped from the parent Section's
 * tone. Use `primary` / `secondary` / `ghost` on bone or champagne sections;
 * use `primary-on-dark` / `secondary-on-dark` / `ghost-on-dark` on midnight or
 * midnight-deep. There is no `tone="auto"` because Section is an RSC and
 * runtime tone-detection would require client context — the explicit choice is
 * the cost of keeping primitives server-rendered.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-md font-body font-medium tracking-[-0.005em] whitespace-nowrap",
    "transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
    "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-midnight-800 text-cream-50 hover:bg-midnight-700",
        "primary-on-dark": "bg-cream-50 text-midnight-800 hover:bg-cream-100",
        secondary:
          "bg-transparent border-[1.5px] border-midnight-500 text-midnight-800 hover:bg-midnight-50",
        "secondary-on-dark":
          "bg-transparent border-[1.5px] border-cream-100 text-cream-50 hover:bg-midnight-700",
        champagne: "bg-champagne-200 text-midnight-800 hover:bg-champagne-300",
        ghost: "text-midnight-700 hover:bg-midnight-50",
        "ghost-on-dark": "text-cream-100 hover:bg-midnight-700",
      },
      size: {
        sm: "h-9 px-4 text-small",
        md: "h-11 px-6 text-body",
        lg: "h-13 px-8 text-lead",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
