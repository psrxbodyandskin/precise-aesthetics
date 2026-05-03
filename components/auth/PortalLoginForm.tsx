"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { getAuthBrowserClient } from "@/lib/supabase/client-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "password" | "magic-link";

const labelClass = "text-small font-medium text-ink-900";
const inputClass =
  "h-11 bg-bone-50 border-ink-700/35 text-ink-900 placeholder:text-ink-500";

export function PortalLoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email.");
      return;
    }
    setSubmitting(true);

    const supabase = getAuthBrowserClient();

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(error.message || "Sign-in failed.");
        setSubmitting(false);
        return;
      }
      // Auth callback routes the user to /portal on success.
      router.push("/portal");
      router.refresh();
      return;
    }

    // Magic link
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/portal`,
      },
    });
    if (error) {
      toast.error(error.message || "Could not send sign-in link.");
      setSubmitting(false);
      return;
    }
    setMagicLinkSent(true);
    setSubmitting(false);
  }

  if (magicLinkSent) {
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
          We sent a one-time sign-in link to{" "}
          <span className="text-ink-900">{email}</span>. The link expires in
          fifteen minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div>
        <Label htmlFor="portal-email" className={labelClass}>
          Email
        </Label>
        <Input
          id="portal-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(inputClass, "mt-2")}
          // Password managers inject fdprocessedid attributes after hydration —
          // suppress the warning so the form's submit handler stays attached.
          suppressHydrationWarning
        />
      </div>

      {mode === "password" && (
        <div>
          <Label htmlFor="portal-password" className={labelClass}>
            Password
          </Label>
          <div className="relative mt-2">
            <Input
              id="portal-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(inputClass, "mt-0 pr-11")}
              suppressHydrationWarning
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex h-11 w-11 items-center justify-center text-ink-500 transition-colors duration-[150ms] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
              suppressHydrationWarning
            >
              {showPassword ? (
                <EyeOff className="size-5" strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Eye className="size-5" strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          className="w-full sm:w-auto"
          suppressHydrationWarning
        >
          {submitting
            ? "Signing in"
            : mode === "password"
              ? "Sign in"
              : "Email a sign-in link"}
        </Button>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setMode(mode === "password" ? "magic-link" : "password")}
          className="text-caption text-brand-700 underline-offset-[3px] decoration-1 transition-colors duration-[150ms] hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
        >
          {mode === "password"
            ? "Email me a sign-in link instead"
            : "Use your password instead"}
        </button>
      </div>
    </form>
  );
}
