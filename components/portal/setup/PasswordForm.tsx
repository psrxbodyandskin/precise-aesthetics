"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { setPasswordAction } from "@/app/(portal)/portal/setup/actions";

const labelClass = "text-small font-medium text-ink-900";
const inputClass =
  "h-11 bg-bone-50 border-ink-700/35 text-ink-900 placeholder:text-ink-500";

interface PasswordFormProps {
  email: string;
}

export function PasswordForm({ email }: PasswordFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [show, setShow] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await setPasswordAction(fd);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      if (result.redirectTo) router.push(result.redirectTo);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div>
        <Label htmlFor="setup-email" className={labelClass}>
          Email
        </Label>
        <Input
          id="setup-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          readOnly
          aria-readonly="true"
          className={cn(inputClass, "mt-2 cursor-default")}
          suppressHydrationWarning
        />
      </div>

      <div>
        <Label htmlFor="setup-password" className={labelClass}>
          Password
        </Label>
        <div className="relative mt-2">
          <Input
            id="setup-password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={10}
            className={cn(inputClass, "pr-11")}
            suppressHydrationWarning
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute inset-y-0 right-0 flex h-11 w-11 items-center justify-center text-ink-500 transition-colors duration-[150ms] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
            suppressHydrationWarning
          >
            {show ? (
              <EyeOff className="size-5" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Eye className="size-5" strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>
        </div>
        <p className="mt-2 text-caption text-ink-500">
          Use at least ten characters. A mix of words is fine.
        </p>
      </div>

      <div>
        <Label htmlFor="setup-confirm" className={labelClass}>
          Confirm password
        </Label>
        <Input
          id="setup-confirm"
          name="confirmPassword"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={10}
          className={cn(inputClass, "mt-2")}
          suppressHydrationWarning
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={pending}
          className="w-full sm:w-auto"
          suppressHydrationWarning
        >
          {pending ? "Saving" : "Save and continue"}
        </Button>
      </div>
    </form>
  );
}
