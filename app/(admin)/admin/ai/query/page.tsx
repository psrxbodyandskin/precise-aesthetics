import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/server";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { QueryAssistantInterface } from "@/components/admin/ai/QueryAssistantInterface";

export const metadata: Metadata = {
  title: "Query assistant — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminAiQueryPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "AI" },
          { label: "Query assistant" },
        ]}
      />
      <AdminPageHeader
        eyebrow="AI · Query assistant"
        title="Ask a question."
        lead="Type a question about treatment data, protocol performance, or practice activity. The assistant translates it to SQL, runs it, and explains the answer."
      />

      <div className="mt-12">
        <QueryAssistantInterface />
      </div>
    </div>
  );
}
