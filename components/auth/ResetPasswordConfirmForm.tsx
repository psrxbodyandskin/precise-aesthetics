"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  successRedirect: string;
}

// Lands here after the user clicks the password-reset email link.
// Supabase exchanges the token in the URL via the SDK on mount; once a
// session is established, the user can update the password.
export function ResetPasswordConfirmForm({ successRedirect }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = getAuthBrowserClient();
    // The recovery flow puts the user into a session via the URL hash.
    // Once getSession returns a session, the form is ready to submit.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setSessionReady(true);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 12) {
      toast.error("Password must be at least 12 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setSubmitting(true);

    const supabase = getAuthBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message || "Could not update password.");
      setSubmitting(false);
      return;
    }
    toast.success("Password updated.");
    router.push(successRedirect);
    router.refresh();
  }

  if (!sessionReady) {
    return (
      <p className="font-body text-body text-ink-500">
        Verifying reset link&hellip;
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div>
        <Label htmlFor="new-password" className={labelClass}>
          New password
        </Label>
        <Input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={cn(inputClass, "mt-2")}
        />
        <p className="mt-2 text-caption text-ink-500">
          Minimum 12 characters.
        </p>
      </div>

      <div>
        <Label htmlFor="confirm-password" className={labelClass}>
          Confirm new password
        </Label>
        <Input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          {submitting ? "Saving" : "Update password"}
        </Button>
      </div>
    </form>
  );
}
