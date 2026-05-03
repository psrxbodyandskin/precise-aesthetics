import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { WizardShell } from "@/components/portal/setup/WizardShell";
import { ProfileForm } from "@/components/portal/setup/ProfileForm";

export default async function SetupProfilePage() {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);

  return (
    <WizardShell
      step="profile"
      title="Confirm your practice profile."
      lead="We've pre-filled what we have on file. Edit anything that's off, or add what's missing."
    >
      <ProfileForm
        initial={{
          phone: practice?.phone ?? null,
          addressLine1: practice?.address_line1 ?? null,
          addressLine2: practice?.address_line2 ?? null,
          city: practice?.city ?? null,
          state: practice?.state ?? null,
          postalCode: practice?.postal_code ?? null,
        }}
      />
    </WizardShell>
  );
}
