import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/server";
import { getServiceClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { PracticeProvisioningForm } from "@/components/admin/practices/PracticeProvisioningForm";
import type { DeviceOption } from "@/components/admin/practices/DevicePicker";

export const metadata: Metadata = {
  title: "New practice",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default async function NewPracticePage() {
  await requireAdmin();

  // Load the active devices catalog for the picker
  const supabase = getServiceClient();
  const { data: devicesData } = await supabase
    .from("devices")
    .select("id, slug, display_name, short_description")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const devices: DeviceOption[] = (devicesData ?? []).map((d) => ({
    id: d.id,
    slug: d.slug,
    displayName: d.display_name,
    shortDescription: d.short_description,
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Practices", href: "/admin/practices" },
          { label: "New" },
        ]}
      />

      <AdminPageHeader
        eyebrow={"Provision"}
        title={"New practice"}
        lead="Create a practice account, assign devices, and send the setup invite."
      />

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Form column */}
        <div>
          <PracticeProvisioningForm devices={devices} />
        </div>

        {/* Sidebar — provisioning steps + caution note */}
        <aside className="lg:pt-4">
          <div className="rounded-md border border-ink-700/15 bg-bone-50 p-6">
            <p
              className="font-body text-overline font-medium uppercase text-brand-700"
              style={EYEBROW_TRACKING}
            >
              § How provisioning works
            </p>
            <ol className="mt-6 space-y-5">
              {[
                {
                  num: "01",
                  title: "Practice record created",
                  desc:
                    "Saved to the database with status pending.",
                },
                {
                  num: "02",
                  title: "Auth user attached",
                  desc:
                    "Supabase creates the login credentials.",
                },
                {
                  num: "03",
                  title: "Invite email sent",
                  desc:
                    "The primary contact receives a one-time setup link.",
                },
                {
                  num: "04",
                  title: "Status flips to active",
                  desc:
                    "When they complete the setup wizard.",
                },
              ].map((step) => (
                <li
                  key={step.num}
                  className="flex gap-4 border-l border-ink-700/10 pl-4 first:pt-0 last:pb-0"
                >
                  <span
                    className="font-body text-overline font-medium uppercase text-ink-300"
                    style={{ letterSpacing: "0.12em" }}
                  >
                    {step.num}
                  </span>
                  <div>
                    <p className="font-body text-small font-medium text-ink-900">
                      {step.title}
                    </p>
                    <p className="mt-1 font-body text-caption text-ink-500">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 border-t border-ink-700/10 pt-5">
              <p className="font-body text-caption text-ink-500">
                Provisioning sends a real email immediately.
                Double-check the primary contact email before submitting.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
