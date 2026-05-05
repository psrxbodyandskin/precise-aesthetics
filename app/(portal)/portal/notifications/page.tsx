import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { listForPractice } from "@/lib/notifications/queries";
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
} from "@/lib/schemas/notifications";
import { PortalShell } from "@/components/portal/PortalShell";
import { NotificationsList } from "@/components/portal/notifications/NotificationsList";
import { NotificationsFilterBar } from "@/components/portal/notifications/NotificationsFilterBar";

export const metadata: Metadata = {
  title: "Notifications — Precise Aesthetics",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PortalNotificationsPage({
  searchParams,
}: PageProps) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) redirect("/portal/login?error=no_practice");
  if (practice.status === "pending") redirect("/portal/setup");
  if (practice.status === "suspended" || practice.status === "archived")
    redirect("/portal/login?error=account_inactive");

  const sp = await searchParams;
  const unreadOnly = sp.unread === "1";
  const rawCats = Array.isArray(sp.category)
    ? sp.category
    : sp.category
      ? [sp.category]
      : [];
  const categories = rawCats.filter((c): c is NotificationCategory =>
    (NOTIFICATION_CATEGORIES as readonly string[]).includes(c),
  );

  const result = await listForPractice(practice.id, {
    unreadOnly,
    categories,
    pageSize: 50,
  });

  const filtered = unreadOnly || categories.length > 0;

  return (
    <PortalShell practiceName={practice.name}>
      <article className="mx-auto max-w-[900px] px-6 pt-12 pb-24 md:px-12 md:pt-16 md:pb-32">
        <div aria-hidden="true" className="mb-8 flex">
          <span className="block h-px w-[60px] bg-brand-500/50" />
        </div>

        <header>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Notifications
          </p>
          <h1
            className="mt-4 font-display text-ink-900"
            style={{
              fontSize: "clamp(2rem, 2.5vw + 1rem, 3rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            Notifications.
          </h1>
          <p
            className="mt-4 max-w-[58ch] font-body text-ink-700"
            style={{ fontSize: "1rem", lineHeight: 1.65 }}
          >
            Updates relevant to your practice — protocol changes, adverse
            event reviews, training availability.
          </p>
        </header>

        <div className="mt-10">
          <NotificationsFilterBar
            basePath="/portal/notifications"
            surface="portal"
          />
        </div>

        <div className="mt-6">
          <NotificationsList
            items={result.items.map((it) => ({
              id: it.id,
              category: it.category,
              title: it.title,
              body: it.body,
              link_path: it.link_path,
              created_at: it.created_at,
              read_at: it.read_at,
            }))}
            surface="portal"
            filtered={filtered}
          />
        </div>
      </article>
    </PortalShell>
  );
}
