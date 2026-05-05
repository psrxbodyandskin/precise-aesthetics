import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import {
  listAuthorizedUsersForPractice,
  listVisibleProtocolsForPractice,
} from "@/lib/portal/treatments";
import {
  anyCertifiedDeviceIdsForPractice,
  certifiedDeviceIdsByUserForPractice,
} from "@/lib/portal/training";
import { getServiceClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/PortalShell";
import { TreatmentLogForm } from "@/components/portal/treatments/TreatmentLogForm";
import { CertificationGateBlock } from "@/components/portal/training/CertificationGateBlock";

export const metadata: Metadata = {
  title: "Log a treatment — Precise Aesthetics",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default async function NewTreatmentPage() {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);

  if (!practice) redirect("/portal/login?error=no_practice");
  if (practice.status === "pending") redirect("/portal/setup");
  if (practice.status === "suspended" || practice.status === "archived")
    redirect("/portal/login?error=account_inactive");

  const [authorizedUsers, protocolsRaw, anyPracticeCertedIds, certedByUser] =
    await Promise.all([
      listAuthorizedUsersForPractice(),
      listVisibleProtocolsForPractice(),
      anyCertifiedDeviceIdsForPractice(practice.id),
      certifiedDeviceIdsByUserForPractice(practice.id),
    ]);

  // P9.1 — gate: if NO user on the practice is certified for any
  // device, render the blocked state. (Per-user gating still applies
  // on the form via entered_by filtering — this page-level gate just
  // spares the form when no one can log.)
  if (anyPracticeCertedIds.length === 0) {
    const supabase = getServiceClient();
    const { data: deviceRows } = await supabase
      .from("practice_devices")
      .select("device:devices(display_name)")
      .eq("practice_id", practice.id);
    const deviceNames = (deviceRows ?? [])
      .map((r) => {
        const d = Array.isArray(r.device) ? r.device[0] : r.device;
        return d?.display_name;
      })
      .filter(Boolean) as string[];
    return (
      <PortalShell practiceName={practice.name}>
        <article className="mx-auto max-w-[900px] px-6 pt-12 pb-24 md:px-12 md:pt-16 md:pb-32">
          <CertificationGateBlock uncertifiedDeviceNames={deviceNames} />
        </article>
      </PortalShell>
    );
  }

  // Filter protocols to those with at least one device that ANY user
  // on the practice is certified for. (Per-user filtering on the
  // entered_by dropdown happens in the form when a protocol is picked.)
  const supabase = getServiceClient();
  const protocolIds = protocolsRaw.map((p) => p.id);
  const { data: protoDeviceRows } = protocolIds.length
    ? await supabase
        .from("protocol_devices")
        .select("protocol_id, device_id")
        .in("protocol_id", protocolIds)
    : { data: [] };
  const anyCertifiedSet = new Set(anyPracticeCertedIds);
  const allowedProtocolIds = new Set<string>();
  // Build protocol_id → device_ids map for the form to use too.
  const protocolDeviceMap: Record<string, string[]> = {};
  for (const r of protoDeviceRows ?? []) {
    if (!protocolDeviceMap[r.protocol_id]) protocolDeviceMap[r.protocol_id] = [];
    protocolDeviceMap[r.protocol_id]!.push(r.device_id);
    if (anyCertifiedSet.has(r.device_id)) allowedProtocolIds.add(r.protocol_id);
  }

  // Normalize protocol shape (PostgREST relational join can be array)
  const protocols = protocolsRaw
    .filter((p) => allowedProtocolIds.has(p.id))
    .map((p) => {
      const ic = (p as { indication_category: unknown }).indication_category;
      const indication = Array.isArray(ic)
        ? ((ic[0] ?? null) as { id: string; title: string } | null)
        : ((ic ?? null) as { id: string; title: string } | null);
      return {
        id: p.id,
        title: p.title,
        current_version: p.current_version,
        indication_tags: p.indication_tags ?? null,
        indication_category: indication,
      };
    });

  // user_id → array of certified device_ids (serializable for the
  // client form). Only includes users with at least one cert.
  const userCertifiedDeviceIds: Record<string, string[]> = {};
  for (const [userId, deviceSet] of certedByUser.entries()) {
    userCertifiedDeviceIds[userId] = Array.from(deviceSet);
  }

  return (
    <PortalShell practiceName={practice.name}>
      <article className="mx-auto max-w-[720px] px-6 pt-12 pb-24 md:px-12 md:pt-16 md:pb-32">
        <div className="mb-6">
          <Link
            href="/portal/treatments"
            className="font-body text-caption text-ink-500 transition-colors duration-[150ms] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
          >
            ← Back to treatments
          </Link>
        </div>

        <div aria-hidden="true" className="mb-8 flex">
          <span className="block h-px w-[60px] bg-brand-500/50" />
        </div>

        <header>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            New treatment
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
            Log a treatment.
          </h1>
          <p
            className="mt-4 max-w-[58ch] font-body text-ink-700"
            style={{ fontSize: "1rem", lineHeight: 1.65 }}
          >
            Capture the session details. Estimated time: 60–90 seconds.
          </p>
        </header>

        <div className="mt-10">
          <TreatmentLogForm
            authorizedUsers={authorizedUsers.map((u) => ({
              id: u.id,
              full_name: u.full_name,
              role_label: u.role_label,
            }))}
            protocols={protocols}
            protocolDeviceIds={protocolDeviceMap}
            userCertifiedDeviceIds={userCertifiedDeviceIds}
          />
        </div>
      </article>
    </PortalShell>
  );
}
