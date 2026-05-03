import Link from "next/link";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { Button } from "@/components/ui/button";
import { WizardShell } from "@/components/portal/setup/WizardShell";

// Step 1 — Welcome. No DB write; just sets the tone and routes to
// password set. The status gate runs in the layout, so by the time
// we render here the practice is confirmed pending.
export default async function SetupWelcomePage() {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  const practiceName = practice?.name ?? "your practice";

  return (
    <WizardShell
      step="welcome"
      title={`Welcome, ${practiceName}.`}
      lead="Three minutes to set up your account. We've already added the basics — you'll confirm a few things and then you're in."
    >
      <div className="space-y-6">
        <ul className="space-y-3 border-l border-ink-700/15 pl-5">
          <li className="font-body text-small text-ink-700" style={{ lineHeight: 1.6 }}>
            Set a password.
          </li>
          <li className="font-body text-small text-ink-700" style={{ lineHeight: 1.6 }}>
            Confirm your practice profile.
          </li>
          <li className="font-body text-small text-ink-700" style={{ lineHeight: 1.6 }}>
            Add the people who will enter treatment data.
          </li>
          <li className="font-body text-small text-ink-700" style={{ lineHeight: 1.6 }}>
            A brief tour of the portal.
          </li>
        </ul>

        <div className="border-t border-ink-700/10 pt-6">
          <Button asChild variant="primary" size="lg">
            <Link href="/portal/setup/password">Begin</Link>
          </Button>
        </div>
      </div>
    </WizardShell>
  );
}
