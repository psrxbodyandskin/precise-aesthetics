import "server-only";

// Implementations land in later sessions when forms are wired.
// Stubs only — keep the surface area stable.

export async function sendDemoConfirmation(_args: { to: string }): Promise<void> {
  void _args;
}

export async function sendRSVPConfirmation(_args: { to: string }): Promise<void> {
  void _args;
}

export async function sendLeadWelcome(_args: { to: string }): Promise<void> {
  void _args;
}

export async function sendInternalDemoNotification(_args: {
  payload: Record<string, unknown>;
}): Promise<void> {
  void _args;
}
