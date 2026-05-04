"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUGGESTED_ROLE_CHIPS } from "@/lib/schemas/treatment";

interface AddAuthorizedUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: { id: string; full_name: string; role_label: string | null }) => void;
}

export function AddAuthorizedUserModal({
  open,
  onOpenChange,
  onCreated,
}: AddAuthorizedUserModalProps) {
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [roleLabel, setRoleLabel] = useState("");

  function reset() {
    setFullName("");
    setRoleLabel("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fullName.trim().length === 0) {
      toast.error("Add a name.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/portal/practice-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          roleLabel: roleLabel.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.id) {
        toast.error(data.error ?? "Could not add user.");
        return;
      }
      onCreated({
        id: data.id,
        full_name: fullName.trim(),
        role_label: roleLabel.trim().length > 0 ? roleLabel.trim() : null,
      });
      reset();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-bone-50 border-ink-700/35">
        <DialogHeader>
          <DialogTitle className="font-display text-ink-900">
            Add a new user
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <Label htmlFor="auth-user-name" className="text-small font-medium text-ink-900">
              Full name
            </Label>
            <Input
              id="auth-user-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
              className="mt-2 h-11 bg-bone-50 border-ink-700/35"
              suppressHydrationWarning
            />
          </div>
          <div>
            <Label htmlFor="auth-user-role" className="text-small font-medium text-ink-900">
              Role <span className="text-ink-500">(optional)</span>
            </Label>
            <Input
              id="auth-user-role"
              value={roleLabel}
              onChange={(e) => setRoleLabel(e.target.value)}
              placeholder="Practitioner, RN, MA…"
              className="mt-2 h-11 bg-bone-50 border-ink-700/35"
              suppressHydrationWarning
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTED_ROLE_CHIPS.map((chip) => (
                <button
                  type="button"
                  key={chip}
                  onClick={() => setRoleLabel(chip)}
                  className="rounded-sm border border-ink-700/20 bg-bone-50 px-2 py-0.5 text-caption text-ink-700 transition-colors duration-[150ms] hover:border-brand-500/50 hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={pending}
              disabled={pending}
            >
              {pending ? "Adding…" : "Add user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
