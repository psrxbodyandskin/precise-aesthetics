import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { getCertificateData } from "@/lib/portal/training";
import Link from "next/link";

import { CertificateDocument } from "@/components/portal/certificates/CertificateDocument";
import { CertificateDownloadButton } from "@/components/portal/certificates/CertificateDownloadButton";

export const metadata: Metadata = {
  title: "Certificate — Precise Aesthetics",
  robots: { index: false, follow: false },
};

interface CertificatePageProps {
  params: Promise<{ deviceId: string }>;
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) redirect("/portal/login?error=no_practice");
  if (practice.status === "pending") redirect("/portal/setup");
  if (practice.status === "suspended" || practice.status === "archived") {
    redirect("/portal/login?error=account_inactive");
  }

  const { deviceId } = await params;
  const data = await getCertificateData({
    practiceId: practice.id,
    deviceId,
  });
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-bone-100 print:bg-white">
      {/* Top bar — hidden on print */}
      <div className="border-b border-ink-700/10 bg-bone-100 print:hidden">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-6 py-4 md:px-10">
          <Link
            href="/portal/training"
            className="font-body text-caption text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline"
            style={{ letterSpacing: "0.04em" }}
          >
            ← Training
          </Link>
          <CertificateDownloadButton />
        </div>
      </div>

      {/* Certificate — print-targeted */}
      <main className="py-10 print:py-0">
        <CertificateDocument data={data} />
      </main>

      {/* Print stylesheet adjustments — hide everything except the certificate
          on print, ensure proper margins. */}
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0.4in;
          }
          html, body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
