import { requirePractice } from "@/lib/auth/server";
import {
  getPracticeForAuthUser,
  listAuthorizedUsers,
} from "@/lib/portal/setup";
import { WizardShell } from "@/components/portal/setup/WizardShell";
import { AuthorizedUsersEditor } from "@/components/portal/setup/AuthorizedUsersEditor";

export default async function SetupUsersPage() {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);

  const initial: Array<{ fullName: string; roleLabel: string | null }> = [];
  if (practice) {
    const { data: rows } = await listAuthorizedUsers(practice.id);
    if (rows) {
      for (const r of rows) {
        initial.push({ fullName: r.full_name, roleLabel: r.role_label });
      }
    }
  }

  return (
    <WizardShell
      step="users"
      title="Who at your practice will enter treatment data?"
      lead="Names and roles populate the &lsquo;Entered by&rsquo; dropdown on every treatment log. Add or remove users any time from settings."
    >
      <AuthorizedUsersEditor initial={initial} />
    </WizardShell>
  );
}
