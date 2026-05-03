"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { tourCompleteAction } from "@/app/(portal)/portal/setup/actions";

const SLIDES = [
  {
    num: "01",
    title: "Browse the protocol library",
    body:
      "Every protocol applicable to your devices, organized by indication. Search, filter, and pull the parameters you need at the chair.",
  },
  {
    num: "02",
    title: "Log treatments to refine the system",
    body:
      "Lightweight logging, optional photos, and an adverse-event flag. Aggregate signal helps tune the protocols you rely on.",
  },
  {
    num: "03",
    title: "Stay updated when protocols evolve",
    body:
      "Notifications when a protocol you use is revised. No noise — only what's relevant to the devices on file at your practice.",
  },
] as const;

export function TourSlides() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onContinue() {
    startTransition(async () => {
      const result = await tourCompleteAction();
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      if (result.redirectTo) router.push(result.redirectTo);
    });
  }

  return (
    <div className="space-y-10">
      <ul className="space-y-8">
        {SLIDES.map((slide) => (
          <li
            key={slide.num}
            className="border-l border-ink-700/15 pl-5"
          >
            <p
              className="font-body text-overline font-medium uppercase text-ink-500"
              style={{ letterSpacing: "0.18em" }}
            >
              {slide.num}
            </p>
            <p className="mt-3 font-display text-h4 leading-heading text-ink-900">
              {slide.title}
            </p>
            <p
              className="mt-2 max-w-[58ch] font-body text-ink-700"
              style={{ fontSize: "0.9375rem", lineHeight: 1.65 }}
            >
              {slide.body}
            </p>
          </li>
        ))}
      </ul>

      <div className="border-t border-ink-700/10 pt-6">
        <Button
          type="button"
          onClick={onContinue}
          variant="primary"
          size="lg"
          loading={pending}
          className="w-full sm:w-auto"
          suppressHydrationWarning
        >
          {pending ? "Continuing" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
