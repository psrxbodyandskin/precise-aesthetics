import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/server";
import {
  getAuditTrailFor,
  getContactMessageById,
  getDemoRequestById,
  getLeadById,
  isInboxItemType,
} from "@/lib/admin/inbox";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { LeadDetailView } from "@/components/admin/inbox/LeadDetailView";
import { DemoRequestDetailView } from "@/components/admin/inbox/DemoRequestDetailView";
import { ContactMessageDetailView } from "@/components/admin/inbox/ContactMessageDetailView";
import { INBOX_TYPE_LABELS } from "@/lib/schemas/inbox";

export const metadata: Metadata = {
  title: "Inbox item — Admin",
  robots: { index: false, follow: false },
};

interface InboxDetailPageProps {
  params: Promise<{ type: string; id: string }>;
}

export default async function AdminInboxDetailPage({
  params,
}: InboxDetailPageProps) {
  await requireAdmin();
  const { type: rawType, id } = await params;

  if (!isInboxItemType(rawType)) {
    notFound();
  }

  const audit = await getAuditTrailFor(rawType, id);

  if (rawType === "lead") {
    const lead = await getLeadById(id);
    if (!lead) notFound();
    return (
      <Wrapper crumbLabel={`${INBOX_TYPE_LABELS.lead} · ${lead.email}`}>
        <LeadDetailView lead={lead} audit={audit} />
      </Wrapper>
    );
  }

  if (rawType === "demo") {
    const demo = await getDemoRequestById(id);
    if (!demo) notFound();
    return (
      <Wrapper
        crumbLabel={`${INBOX_TYPE_LABELS.demo} · ${demo.practice_name}`}
      >
        <DemoRequestDetailView demo={demo} audit={audit} />
      </Wrapper>
    );
  }

  // contact
  const message = await getContactMessageById(id);
  if (!message) notFound();
  return (
    <Wrapper
      crumbLabel={`${INBOX_TYPE_LABELS.contact} · ${message.subject}`}
    >
      <ContactMessageDetailView message={message} audit={audit} />
    </Wrapper>
  );
}

function Wrapper({
  crumbLabel,
  children,
}: {
  crumbLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[960px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Inbox", href: "/admin/inbox" },
          { label: crumbLabel },
        ]}
      />
      {children}
    </div>
  );
}
