"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AccountFormProps {
  /** The admin's CURRENT confirmed email — read-only display + no-op guard. */
  currentEmail: string | null;
  /** Optional pending change to display (Supabase exposes new_email until confirmed). */
  pendingNewEmail: string | null;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function AccountForm({
  currentEmail,
  pendingNewEmail,
}: AccountFormProps) {
  return (
    <div className="space-y-12">
      <EmailSection
        currentEmail={currentEmail}
        pendingNewEmail={pendingNewEmail}
      />
      <PasswordSection />
    </div>
  );
}

// ----------------------------------------------------------------
// Email section
// ----------------------------------------------------------------

function EmailSection({
  currentEmail,
  pendingNewEmail,
}: {
  currentEmail: string | null;
  pendingNewEmail: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newEmail, setNewEmail] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  function submit() {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (currentEmail && trimmed === currentEmail.toLowerCase()) {
      toast.error("That's already your email.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/settings/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        confirmationSentTo?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not initiate email change.");
        return;
      }
      setSubmitted(data.confirmationSentTo ?? trimmed);
      setNewEmail("");
      toast.success("Confirmation email sent.");
      router.refresh();
    });
  }

  return (
    <section>
      <p
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        Email
      </p>
      <h2
        className="mt-2 font-display text-ink-900"
        style={{
          fontSize: "1.375rem",
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          fontWeight: 400,
        }}
      >
        Sign-in email
      </h2>
      <p
        className="mt-2 font-body text-small text-ink-700"
        style={{ lineHeight: 1.55 }}
      >
        Changing your email sends a confirmation link to the NEW address. The
        change only takes effect once you click that link. Until then, your
        current email keeps working.
      </p>

      <div className="mt-6 rounded-md border border-ink-700/15 bg-bone-50 p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt
              className="font-body text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Current
            </dt>
            <dd className="mt-1 font-body text-ink-900">
              {currentEmail ?? "—"}
            </dd>
          </div>
          {pendingNewEmail && pendingNewEmail !== currentEmail && (
            <div>
              <dt
                className="font-body text-overline font-medium uppercase text-ink-500"
                style={EYEBROW_TRACKING}
              >
                Pending
              </dt>
              <dd className="mt-1 font-body text-ink-900">
                {pendingNewEmail}
                <span className="ml-2 inline-flex items-center rounded-full bg-bone-200 px-2 py-0.5 font-body text-[10px] font-medium uppercase text-ink-700 ring-1 ring-inset ring-ink-700/15"
                  style={{ letterSpacing: "0.08em" }}>
                  Awaiting confirmation
                </span>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {submitted && (
        <div
          role="status"
          className="mt-4 rounded-md border border-brand-700/25 bg-brand-300/10 p-4"
        >
          <p className="font-body text-small text-ink-900">
            <strong className="font-medium">Confirmation email sent</strong> to{" "}
            <span className="font-mono text-caption">{submitted}</span>. Click
            the link in that email to finalize the change.
          </p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mt-6 space-y-4"
      >
        <div>
          <Label htmlFor="new-email" className="mb-2 block">
            New email
          </Label>
          <Input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            maxLength={200}
            required
          />
        </div>
        <Button type="submit" disabled={pending || newEmail.trim().length === 0}>
          {pending ? "Sending…" : "Send confirmation"}
        </Button>
      </form>
    </section>
  );
}

// ----------------------------------------------------------------
// Password section
// ----------------------------------------------------------------

function PasswordSection() {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const tooShort = next.length > 0 && next.length < 12;
  const mismatch = confirm.length > 0 && next !== confirm;
  const valid =
    current.length > 0 &&
    next.length >= 12 &&
    confirm === next &&
    next !== current;

  function submit() {
    if (!valid) return;
    startTransition(async () => {
      const res = await fetch("/api/admin/settings/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: next,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        otherSessionsRevoked?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not change password.");
        return;
      }
      const sessionsNote = data.otherSessionsRevoked
        ? " Other sessions signed out."
        : "";
      toast.success(`Password changed.${sessionsNote}`);
      setCurrent("");
      setNext("");
      setConfirm("");
    });
  }

  return (
    <section>
      <p
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        Password
      </p>
      <h2
        className="mt-2 font-display text-ink-900"
        style={{
          fontSize: "1.375rem",
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          fontWeight: 400,
        }}
      >
        Change password
      </h2>
      <p
        className="mt-2 font-body text-small text-ink-700"
        style={{ lineHeight: 1.55 }}
      >
        Minimum 12 characters. We re-verify your current password before
        making the change. After updating, any other devices signed in to this
        account are signed out automatically.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mt-6 space-y-4"
      >
        <PasswordField
          id="current-password"
          label="Current password"
          value={current}
          onChange={setCurrent}
          show={showCurrent}
          onToggleShow={() => setShowCurrent((v) => !v)}
          autoComplete="current-password"
        />
        <PasswordField
          id="new-password"
          label="New password"
          value={next}
          onChange={setNext}
          show={showNext}
          onToggleShow={() => setShowNext((v) => !v)}
          autoComplete="new-password"
          helper={
            tooShort
              ? "At least 12 characters."
              : next.length >= 12
                ? "Looks good."
                : "Use 12+ characters. Length matters more than complexity."
          }
          helperKind={tooShort ? "error" : next.length >= 12 ? "ok" : "muted"}
        />
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          show={showNext}
          onToggleShow={() => setShowNext((v) => !v)}
          autoComplete="new-password"
          helper={mismatch ? "Doesn't match." : undefined}
          helperKind="error"
        />
        <Button type="submit" disabled={pending || !valid}>
          {pending ? "Updating…" : "Change password"}
        </Button>
      </form>
    </section>
  );
}

// ----------------------------------------------------------------
// Shared password field (label + show/hide + helper)
// ----------------------------------------------------------------

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  helper,
  helperKind = "muted",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  autoComplete?: string;
  helper?: string;
  helperKind?: "muted" | "ok" | "error";
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2 block">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          maxLength={200}
          required
          className="pr-11"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-ink-500 transition-colors hover:bg-bone-100 hover:text-ink-700 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
        >
          {show ? (
            <EyeOff className="size-4" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Eye className="size-4" strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>
      </div>
      {helper && (
        <p
          className={cn(
            "mt-1 font-body text-caption",
            helperKind === "error" && "text-[#8A2C2C]",
            helperKind === "ok" && "text-brand-700",
            helperKind === "muted" && "text-ink-500",
          )}
          style={{ lineHeight: 1.5 }}
        >
          {helper}
        </p>
      )}
    </div>
  );
}
