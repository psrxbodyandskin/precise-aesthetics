import type { CertificateData } from "@/lib/portal/training";

interface CertificateDocumentProps {
  data: CertificateData;
}

const EYEBROW_TRACKING = { letterSpacing: "0.32em" } as const;

// Print-first certificate document. Wraps in `print:bg-white` etc. so
// browser "Save as PDF" produces a clean, chrome-free page. The
// download button (separate component) triggers window.print().
//
// Structure:
//   - Hairline border frame (brand-300)
//   - Letterhead with "Precise Aesthetics" wordmark
//   - "Certificate of Completion" centered
//   - Device name in display italic
//   - Body line: "This certifies that [Practice Name] …"
//   - Practitioner name + role at practice
//   - Certified-on date
//   - Roni Bolton signature line (text-only for v1; graphic optional)
//   - Certificate ID (UUID footer)
export function CertificateDocument({ data }: CertificateDocumentProps) {
  const { certification, practice, device, curriculum, certified_by } = data;

  const certDate = certification.certified_at
    ? new Date(certification.certified_at)
    : null;
  const expiresDate = certification.expires_at
    ? new Date(certification.expires_at)
    : null;

  return (
    <article
      className="mx-auto bg-bone-100 print:bg-white"
      style={{
        // Tuned for US Letter portrait. Adjusted with print stylesheet
        // overrides below for paper output.
        width: "min(100%, 8.5in)",
        aspectRatio: "8.5 / 11",
        padding: "0.75in",
        position: "relative",
      }}
    >
      {/* Outer hairline frame */}
      <div
        className="absolute inset-4 print:inset-3"
        style={{
          border: "1px solid var(--pa-brand-300, #C9A769)",
          borderRadius: "2px",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-7 print:inset-5"
        style={{
          border: "1px solid var(--pa-brand-300, #C9A769)",
          borderRadius: "1px",
          opacity: 0.45,
        }}
        aria-hidden="true"
      />

      <div className="relative h-full flex flex-col text-ink-900">
        {/* Letterhead */}
        <header className="text-center">
          <p
            className="font-body text-[10px] font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Precise Aesthetics
          </p>
          <p
            className="mt-1 font-body text-[9px] text-ink-500"
            style={{ letterSpacing: "0.12em" }}
          >
            Clinical training & device certification
          </p>
        </header>

        {/* Decorative rule */}
        <div
          className="mx-auto my-7 h-px w-24 print:my-6"
          style={{ backgroundColor: "var(--pa-brand-300, #C9A769)" }}
          aria-hidden="true"
        />

        {/* Title */}
        <div className="text-center">
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Certificate of Completion
          </p>
          <h1
            className="mt-3 font-display italic text-ink-900"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              fontWeight: 400,
            }}
          >
            {device.display_name}
          </h1>
          <p
            className="mt-2 font-body text-small text-ink-700"
            style={{ letterSpacing: "0.04em" }}
          >
            {curriculum.title}
          </p>
        </div>

        {/* Body */}
        <div className="mt-10 flex-1 flex flex-col items-center justify-center text-center">
          <p
            className="max-w-md font-body text-ink-700"
            style={{ lineHeight: 1.75 }}
          >
            This certifies that
          </p>
          <p
            className="mt-3 font-display text-ink-900"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              fontWeight: 400,
            }}
          >
            {practice.name}
          </p>
          {(practice.city || practice.state) && (
            <p
              className="mt-1 font-body text-caption text-ink-500"
              style={{ letterSpacing: "0.04em" }}
            >
              {[practice.city, practice.state].filter(Boolean).join(", ")}
            </p>
          )}

          <p
            className="mt-6 max-w-md font-body text-small text-ink-700"
            style={{ lineHeight: 1.75 }}
          >
            has completed the training program for the {device.display_name}
            {certified_by && (
              <>
                {" "}
                under{" "}
                <span className="font-medium text-ink-900">
                  {certified_by.full_name}
                </span>
                {certified_by.role_label ? (
                  <>, {certified_by.role_label}</>
                ) : null}
              </>
            )}
            .
          </p>
        </div>

        {/* Decorative rule */}
        <div
          className="mx-auto my-7 h-px w-24 print:my-5"
          style={{ backgroundColor: "var(--pa-brand-300, #C9A769)" }}
          aria-hidden="true"
        />

        {/* Footer */}
        <footer className="grid grid-cols-2 gap-6 text-left">
          <div>
            <p
              className="font-body text-[9px] font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Certified
            </p>
            <p
              className="mt-1 font-body text-small text-ink-900"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {certDate
                ? certDate.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </p>
            {expiresDate && (
              <p
                className="mt-1 font-body text-caption text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                Valid until {expiresDate.toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <p
              className="font-display italic text-ink-900"
              style={{
                fontSize: "1rem",
                lineHeight: 1.2,
                fontWeight: 400,
              }}
            >
              Roni Bolton
            </p>
            <p
              className="mt-1 font-body text-[10px] uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Clinical Director
            </p>
          </div>
        </footer>

        <p
          className="mt-6 text-center font-mono text-[9px] uppercase text-ink-300"
          style={{ letterSpacing: "0.18em" }}
        >
          Certificate id · {certification.id}
        </p>
      </div>
    </article>
  );
}
