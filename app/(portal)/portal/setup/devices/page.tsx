import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser, listOwnedDevices } from "@/lib/portal/setup";
import { WizardShell } from "@/components/portal/setup/WizardShell";
import { DeviceConfirmation } from "@/components/portal/setup/DeviceConfirmation";

interface DeviceJoin {
  serial_number: string | null;
  acquired_at: string | null;
  devices: {
    slug: string;
    display_name: string;
    short_description: string | null;
  } | null;
}

export default async function SetupDevicesPage() {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);

  const owned: Array<{
    displayName: string;
    shortDescription: string | null;
    serialNumber: string | null;
    acquiredAt: string | null;
  }> = [];

  if (practice) {
    const { data } = await listOwnedDevices(practice.id);
    if (data) {
      for (const row of data as unknown as DeviceJoin[]) {
        if (!row.devices) continue;
        owned.push({
          displayName: row.devices.display_name,
          shortDescription: row.devices.short_description,
          serialNumber: row.serial_number,
          acquiredAt: row.acquired_at,
        });
      }
    }
  }

  return (
    <WizardShell
      step="devices"
      title="Your devices."
      lead="Protocols visible in your library are matched to the devices on file. This list is managed by us — let us know if anything is off."
    >
      <DeviceConfirmation devices={owned} />
    </WizardShell>
  );
}
