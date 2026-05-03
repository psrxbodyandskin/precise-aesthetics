import { requirePractice } from "@/lib/auth/server";
import { WizardShell } from "@/components/portal/setup/WizardShell";
import { TourSlides } from "@/components/portal/setup/TourSlides";

export default async function SetupTourPage() {
  await requirePractice();

  return (
    <WizardShell
      step="tour"
      title="A brief tour."
      lead="Three things the portal does. The first is the centerpiece — the rest exist so the first keeps getting better."
    >
      <TourSlides />
    </WizardShell>
  );
}
