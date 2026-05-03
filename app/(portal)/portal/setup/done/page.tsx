import { requirePractice } from "@/lib/auth/server";
import { Button } from "@/components/ui/button";
import { WizardShell } from "@/components/portal/setup/WizardShell";
import { finalizeSetupAction } from "@/app/(portal)/portal/setup/actions";

// Step 7 — Done. Form-based submit so the action runs server-side
// and the redirect to /portal flips status server-side without a
// client round-trip. Status flip is idempotent (only changes
// 'pending' rows) so refreshing this page is safe.
export default async function SetupDonePage() {
  await requirePractice();

  return (
    <WizardShell
      step="done"
      title="You&rsquo;re set up."
      lead="The protocol library and treatment logging are inside. Welcome to Precise."
    >
      <form action={finalizeSetupAction}>
        <div className="border-t border-ink-700/10 pt-6">
          <Button type="submit" variant="primary" size="lg">
            Enter portal
          </Button>
        </div>
      </form>
    </WizardShell>
  );
}
