"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type { TrainingModuleRow } from "@/lib/admin/training";
import { TrainingStatusChip } from "./TrainingStatusChip";

interface ModulesTableProps {
  modules: TrainingModuleRow[];
}

const HEADER_TRACKING = { letterSpacing: "0.18em" } as const;

export function ModulesTable({ modules }: ModulesTableProps) {
  const router = useRouter();
  if (modules.length === 0) {
    return (
      <div className="rounded-md border border-ink-700/15 bg-bone-50 px-6 py-10 text-center">
        <p className="font-body text-ink-700">No modules yet.</p>
        <p className="mt-2 font-body text-caption text-ink-500">
          Create your first training module to attach to a curriculum.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50">
      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-ink-700/10 text-left">
              <Th>Title</Th>
              <Th>Status</Th>
              <Th>Duration</Th>
              <Th>Required %</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr
                key={m.id}
                onClick={() => router.push(`/admin/training/modules/${m.id}/preview`)}
                className="cursor-pointer border-b border-ink-700/5 last:border-b-0 transition-colors duration-[150ms] hover:bg-bone-100"
              >
                <Td>
                  <Link
                    href={`/admin/training/modules/${m.id}/preview`}
                    className="block hover:text-brand-700"
                  >
                    <span className="block font-body text-small font-medium text-ink-900">
                      {m.title}
                    </span>
                    <span className="block font-body text-caption text-ink-500">
                      /{m.slug}
                    </span>
                  </Link>
                </Td>
                <Td>
                  <TrainingStatusChip status={m.status} />
                </Td>
                <Td mono>
                  {m.video_duration_seconds
                    ? formatDuration(m.video_duration_seconds)
                    : "—"}
                </Td>
                <Td mono>{m.required_watch_percentage}%</Td>
                <Td mono>{new Date(m.updated_at).toLocaleDateString()}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-ink-700/10 md:hidden">
        {modules.map((m) => (
          <li key={m.id}>
            <Link
              href={`/admin/training/modules/${m.id}/preview`}
              className="block px-4 py-4 transition-colors duration-[150ms] hover:bg-bone-100"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="font-body text-small font-medium text-ink-900">
                  {m.title}
                </span>
                <TrainingStatusChip status={m.status} />
              </div>
              <p className="font-body text-caption text-ink-500">/{m.slug}</p>
              <p
                className="mt-1 font-body text-caption text-ink-700"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {m.video_duration_seconds
                  ? formatDuration(m.video_duration_seconds)
                  : "No video"}
                {" · "}
                Required {m.required_watch_percentage}%
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-4 py-3 font-body text-overline font-medium uppercase text-ink-500"
      style={HEADER_TRACKING}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  mono,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <td
      className="px-4 py-3 align-top font-body text-small text-ink-900"
      style={mono ? { fontVariantNumeric: "tabular-nums" } : undefined}
    >
      {children}
    </td>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}
