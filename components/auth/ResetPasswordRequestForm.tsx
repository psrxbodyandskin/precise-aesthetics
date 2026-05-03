"use client";

import { useState } from "react";
import { toast } from "sonner";

import { getAuthBrowserClient } from "@/lib/supabase/client-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const labelClass = "text-small font-medium text-ink-900";
const inputClass =
  "h-11 bg-bone-50 border-ink-700/35 text-ink-900 placeholder:text-ink-500";

interface Props {
  surface: "portal" | "admin";
  redirectPath: string;
}

// Sends a Supabase password-reset email. We deliberately confirm
// receipt for ANY entered email (not just real ones) so the form
// doesn't act as an email-existence oracle.
export function ResetPasswordRequestForm({ redirectPath }: Props) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email.");
      return;
    }
    setSubmitting(true);

    const supabase = getAuthBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${redirectPath}`,
    });

    // Show the same success state regardless — don't leak whether the
    // email exists in our system.
    if (error) {
      // Log but don't surface to user (don't act as an email-existence oracle).
      console.error("[reset-password] supabase error", error.message);
    }
    setSent(true);
    setSubmitting(false);
  }

  if (sent) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-md border border-ink-700/35 bg-bone-50 p-8 text-center"
      >
        <p className="font-body text-overline font-medium uppercase text-ink-500" style={{ letterSpacing: "0.18em" }}>
          Sent
        </p>
        <p className="mt-3 font-display text-h3 leading-heading text-ink-900">
          Check your inbox.
        </p>
        <p className="mt-3 font-body text-body leading-body text-ink-700 max-w-[36ch] mx-auto">
          If an account exists for{" "}
          <span className="text-ink-900">{email}</span>, a reset link is on
          its way.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div>
        <Label htmlFor="reset-email" className={labelClass}>
          Email
        </Label>
        <Input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(inputClass, "mt-2")}
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          className="w-full sm:w-auto"
        >
          {submitting ? "Sending" : "Send reset link"}
        </Button>
      </div>
    </form>
  );
}
