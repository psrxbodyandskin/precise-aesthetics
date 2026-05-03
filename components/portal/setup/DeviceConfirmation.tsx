"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { confirmDevicesAction } from "@/app/(portal)/portal/setup/actions";

interface OwnedDevice {
  displayName: string;
  shortDescription: string | null;
  serialNumber: string | null;
  acquiredAt: string | null;
}

interface DeviceConfirmationProps {
  devices: OwnedDevice[];
}

export function DeviceConfirmation({ devices }: DeviceConfirmationProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onContinue() {
    startTransition(async () => {
      const result = await confirmDevicesAction();
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      if (result.redirectTo) router.push(result.redirectTo);
    });
  }

  return (
    <div className="space-y-8">
      {devices.length === 0 ? (
        <div className="rounded-md border border-ink-700/15 bg-bone-50 p-6">
          <p className="font-body text-small text-ink-700" style={{ lineHeight: 1.6 }}>
            No devices are linked to your account yet. The protocol
            library appears once a device is on file. Reach out and we&rsquo;ll
            get this added.
          </p>
        </div>
      ) : (
        <ul className="space-y-5">
          {devices.map((d, idx) => (
            <li
              key={`${d.displayName}-${idx}`}
              className="flex gap-5 border-l border-ink-700/15 pl-5"
            >
              <span
                className="font-body text-overline font-medium uppercase text-ink-500"
                style={{ letterSpacing: "0.18em" }}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-display text-h4 leading-heading text-ink-900">
                  {d.displayName}
                </p>
                {d.shortDescription && (
                  <p
                    className="mt-1 font-body text-caption text-ink-500"
                    style={{ lineHeight: 1.55 }}
                  >
                    {d.shortDescription}
                  </p>
                )}
                {(d.serialNumber || d.acquiredAt) && (
                  <p
                    className="mt-2 font-body text-caption text-ink-700"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {d.serialNumber && <>Serial · {d.serialNumber}</>}
                    {d.serialNumber && d.acquiredAt && <>  ·  </>}
                    {d.acquiredAt && <>Acquired · {d.acquiredAt}</>}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="font-body text-caption text-ink-500" style={{ lineHeight: 1.55 }}>
        Not what you ordered?{" "}
        <Link
          href="/contact"
          className="text-brand-700 underline-offset-[3px] decoration-1 transition-colors duration-[150ms] hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
        >
          Contact us
        </Link>
        {" "}and we&rsquo;ll fix it.
      </p>

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
