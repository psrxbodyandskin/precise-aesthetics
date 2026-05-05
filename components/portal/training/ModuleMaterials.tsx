import { Download, FileText } from "lucide-react";

interface ModuleMaterial {
  id: string;
  title: string;
  filename: string;
  byte_size: number;
  signedUrl: string | null;
}

interface ModuleMaterialsProps {
  materials: ModuleMaterial[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function ModuleMaterials({ materials }: ModuleMaterialsProps) {
  if (materials.length === 0) return null;

  return (
    <section>
      <h2
        className="mb-4 font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        Materials
      </h2>
      <ul className="space-y-2">
        {materials.map((m) => (
          <li key={m.id}>
            <a
              href={m.signedUrl ?? "#"}
              download={m.filename}
              className="flex items-center gap-3 rounded-md border border-ink-700/15 bg-bone-50 px-3 py-2.5 transition-colors duration-[150ms] hover:border-ink-700/35 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
              target="_blank"
              rel="noreferrer"
            >
              <FileText
                className="size-4 shrink-0 text-ink-700"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="font-body text-small font-medium text-ink-900 truncate">
                  {m.title}
                </p>
                <p className="font-body text-caption text-ink-500 truncate">
                  {m.filename} · {(m.byte_size / 1024).toFixed(0)} KB
                </p>
              </div>
              <Download
                className="size-4 shrink-0 text-ink-500"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
