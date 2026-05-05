import { Bell } from "lucide-react";

interface EmptyNotificationsStateProps {
  variant?: "panel" | "page";
  message?: string;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Two visual variants — compact panel (inside the dropdown) +
// full page (dedicated /portal/notifications and /admin/notifications).
export function EmptyNotificationsState({
  variant = "panel",
  message = "No notifications yet.",
}: EmptyNotificationsStateProps) {
  if (variant === "panel") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <Bell
          className="mb-3 size-5 text-ink-300"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <p className="font-body text-caption text-ink-500">{message}</p>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 px-6 py-12 text-center">
      <Bell
        className="mx-auto mb-4 size-6 text-ink-300"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <p
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        Empty
      </p>
      <p className="mt-2 font-body text-ink-700">{message}</p>
    </div>
  );
}
