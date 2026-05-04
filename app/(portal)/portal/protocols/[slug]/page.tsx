import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { getProtocolBySlugForPractice } from "@/lib/portal/protocols";
import { PortalShell } from "@/components/portal/PortalShell";
import { ProtocolReadingView } from "@/components/portal/protocols/ProtocolReadingView";

export const metadata: Metadata = {
  title: "Protocol — Precise Aesthetics",
  robots: { index: false, follow: false },
};

interface ProtocolDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProtocolDetailPage({
  params,
}: ProtocolDetailPageProps) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);

  if (!practice) {
    redirect("/portal/login?error=no_practice");
  }
  if (practice.status === "pending") {
    redirect("/portal/setup");
  }
  if (practice.status === "suspended" || practice.status === "archived") {
    redirect("/portal/login?error=account_inactive");
  }

  const { slug } = await params;
  const result = await getProtocolBySlugForPractice(slug);

  if (!result) {
    // RLS hides protocols the practice can't see — 404 is the correct
    // user-facing response (don't disclose existence).
    notFound();
  }

  const { protocol, sanityDoc } = result;

  return (
    <PortalShell practiceName={practice.name}>
      <ProtocolReadingView
        protocol={{
          title: protocol.title,
          slug: protocol.slug,
          short_description: protocol.short_description,
          current_version: protocol.current_version,
          last_published_at: protocol.last_published_at,
          indication_category: protocol.indication_category,
          fitzpatrick_types: protocol.fitzpatrick_types ?? [],
          indication_tags: protocol.indication_tags ?? [],
        }}
        sanityDoc={sanityDoc}
      />
    </PortalShell>
  );
}
