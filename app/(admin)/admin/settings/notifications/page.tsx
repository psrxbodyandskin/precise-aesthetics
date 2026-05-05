import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/server";
import { getPreferencesForAdmin } from "@/lib/notifications/queries";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { NotificationPreferencesForm } from "@/components/portal/notifications/NotificationPreferencesForm";

export const metadata: Metadata = {
  title: "Notification preferences — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminNotificationSettingsPage() {
  const admin = await requireAdmin();
  const prefs = await getPreferencesForAdmin(admin.id);

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Settings" },
          { label: "Notifications" },
        ]}
      />
      <AdminPageHeader
        eyebrow="Settings"
        title="Notification preferences."
        lead="Choose which admin notifications you receive and how. Clinical-safety alerts are always on."
      />

      <div className="mt-12">
        <NotificationPreferencesForm
          variant="admin"
          initialPreferences={prefs?.preferences ?? {}}
          initialQuietHoursStart={prefs?.quiet_hours_start ?? null}
          initialQuietHoursEnd={prefs?.quiet_hours_end ?? null}
          initialQuietHoursTimezone={prefs?.quiet_hours_timezone ?? null}
        />
      </div>
    </div>
  );
}
