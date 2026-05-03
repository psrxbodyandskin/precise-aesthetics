"use client";

import { useState } from "react";
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

// Admin login: email + password only (no magic link on privileged
// accounts). Generic error messages so we don't leak whether an email
// exists in the system.
export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error(/* [DRAFT] */ "Email and password are required.");
      return;
    }
    setSubmitting(true);

    const supabase = getAuthBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      toast.error(/* [DRAFT] */ "Sign-in failed.");
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
          {/* [DRAFT] */}Email
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
        />
      </div>

      <div>
        <Label htmlFor="admin-password" className={labelClass}>
          {/* [DRAFT] */}Password
        </Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          {submitting ? /* [DRAFT] */ "Signing in" : /* [DRAFT] */ "Sign in"}
        </Button>
      </div>
    </form>
  );
}
