import { requirePractice } from "@/lib/auth/server";
import { WizardShell } from "@/components/portal/setup/WizardShell";
import { PasswordForm } from "@/components/portal/setup/PasswordForm";

export default async function SetupPasswordPage() {
  const user = await requirePractice();

  return (
    <WizardShell
      step="password"
      title="Set a password."
      lead="Use at least ten characters. You can sign in with email and password, or request a one-time link."
    >
      <PasswordForm email={user.email ?? ""} />
    </WizardShell>
  );
}
