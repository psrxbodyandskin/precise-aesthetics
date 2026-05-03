import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";

export const metadata: Metadata = {
  title: "Setup — Precise Aesthetics",
  robots: { index: false, follow: false },
};

// Status gate for the wizard. Three outcomes:
//  • status === 'pending'  → render the wizard
//  • status === 'active'   → redirect to /portal (already set up)
//  • status === 'suspended' or 'archived' → bounce to login (revoked)
//  • no practice row at all (data error) → bounce to login w/ note
export default async function SetupLayout({ children }: { children: ReactNode }) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);

  if (!practice) {
    redirect("/portal/login?error=no_practice");
  }
  if (practice.status === "active") {
    redirect("/portal");
  }
  if (practice.status === "suspended" || practice.status === "archived") {
    redirect("/portal/login?error=account_inactive");
  }

  return <main className="relative min-h-screen bg-bone-100">{children}</main>;
}
