import { ShieldAlert } from "lucide-react";

// P13 — persistent security banner on stack reference detail.
// Always renders (not dismissable). Reinforces the never-store-
// secrets discipline at every operator interaction.
export function StackSecurityBanner() {
  return (
    <div
      role="note"
      aria-label="Security notice"
      className="rounded-md border border-[#B8862B]/35 bg-[#FBF4E3]/60 px-4 py-3"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert
          className="mt-0.5 size-4 shrink-0 text-[#8B6A1F]"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <p
          className="font-body text-small text-ink-900"
          style={{ lineHeight: 1.55 }}
        >
          <strong className="font-medium">Never paste actual secret values here.</strong>{" "}
          Only env var <em>names</em> and where the value is stored. The schema
          enforces this and the API rejects any payload with a value field.
        </p>
      </div>
    </div>
  );
}
