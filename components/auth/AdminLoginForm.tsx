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

const labelClass = "text-small font-medium text-ink-900";
const inputClass =
  "h-11 bg-bone-50 border-ink-700/35 text-ink-900 placeholder:text-ink-500";

// Admin login: email + password only (no magic link on privileged
// accounts). Generic error messages so we don't leak whether an email
// exists in the system.
export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Email and password are required.");
      return;
    }
    setSubmitting(true);

    const supabase = getAuthBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      toast.error("Sign-in failed.");
      setSubmitting(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div>
        <Label htmlFor="admin-email" className={labelClass}>
          Email
        </Label>
        <Input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(inputClass, "mt-2")}
          // Password managers (1Password, Bitwarden, LastPass) inject
          // fdprocessedid onto inputs after hydration, breaking React's
          // event-handler attachment. Suppress the warning so the form
          // hydrates and submit works.
          suppressHydrationWarning
        />
      </div>

      <div>
        <Label htmlFor="admin-password" className={labelClass}>
          Password
        </Label>
        <div className="relative mt-2">
          <Input
            id="admin-password"
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

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          className="w-full sm:w-auto"
          suppressHydrationWarning
        >
          {submitting ? "Signing in" : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
