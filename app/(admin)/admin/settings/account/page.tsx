import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/server";
import { getServiceClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin/audit";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { SettingsNav } from "@/components/admin/settings/SettingsNav";
import { AccountForm } from "@/components/admin/settings/AccountForm";

export const metadata: Metadata = {
  title: "Account settings — Admin",
  robots: { index: false, follow: false },
};

// P13.5 — admin account self-service.
//
// On load, we use the service-role client to introspect auth.users:
//   - email — current confirmed email
//   - new_email — Supabase's "pending change" field; populated between
//     updateUser({ email }) and the operator clicking the confirmation
//     link. We surface this so they remember a change is in flight.
//
// Confirmation detection (admin.email_change_confirmed audit verb):
//   When admin lands on this page with email !== last initiated change
//   AND the audit log has admin.email_changed but not _confirmed, we
//   write the confirmed verb here. Reactive — depends on the operator
//   visiting the page after confirmation, but covers the common case.
//   A Supabase Auth Hook would be more reliable; deferred to P14 if
//   the audit gap matters in practice.

export default async function AdminAccountSettingsPage() {
  const admin = await requireAdmin();

  const service = getServiceClient();
  const { data: userData } = await service.auth.admin.getUserById(admin.id);

  const currentEmail = userData?.user?.email ?? admin.email ?? null;
  // Supabase exposes `new_email` while a change is pending confirmation.
  // The type isn't in the public types but it's on the User shape.
  const pendingNewEmail =
    (userData?.user as { new_email?: string | null } | null | undefined)
      ?.new_email ?? null;

  // Reactive confirmation detection.
  if (!pendingNewEmail && currentEmail) {
    // Look for the most recent admin.email_changed entry without a
    // matching admin.email_change_confirmed for this admin user.
    const { data: pending } = await service
      .from("audit_log")
      .select("id, metadata, created_at")
      .eq("actor_id", admin.id)
      .eq("action", "admin.email_changed")
      .order("created_at", { ascending: false })
      .limit(1);

    const lastInitiated = pending?.[0];
    if (lastInitiated) {
      const initiatedTo =
        (lastInitiated.metadata as { to_email_initiated?: string } | null)
          ?.to_email_initiated ?? null;

      // If the current email matches the most recently initiated change,
      // the operator confirmed it. Check we haven't already logged the
      // confirmation for this initiation event.
      if (initiatedTo && initiatedTo === currentEmail.toLowerCase()) {
        const { data: alreadyConfirmed } = await service
          .from("audit_log")
          .select("id")
          .eq("actor_id", admin.id)
          .eq("action", "admin.email_change_confirmed")
          .gte("created_at", lastInitiated.created_at)
          .limit(1);

        if (!alreadyConfirmed || alreadyConfirmed.length === 0) {
          await logAudit({
            actorId: admin.id,
            actorRole: "admin",
            action: "admin.email_change_confirmed",
            targetType: "auth_user",
            targetId: admin.id,
            metadata: {
              confirmed_email: currentEmail,
              initiated_audit_id: lastInitiated.id,
            },
          });
        }
      }
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[{ label: "Settings" }, { label: "Account" }]}
      />
      <AdminPageHeader
        eyebrow="Settings · Account"
        title="Account."
        lead="Sign-in email and password for your admin account."
      />

      <div className="mt-8">
        <SettingsNav />
      </div>

      <div className="mt-10">
        <AccountForm
          currentEmail={currentEmail}
          pendingNewEmail={pendingNewEmail}
        />
      </div>
    </div>
  );
}
