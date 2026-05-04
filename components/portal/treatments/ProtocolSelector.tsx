"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface ProtocolOption {
  id: string;
  title: string;
  current_version: string | null;
  indication_category: { id: string; title: string } | null;
}

interface ProtocolSelectorProps {
  protocols: ProtocolOption[];
  value: string | null;
  onChange: (id: string, version: string | null) => void;
}

// Searchable + grouped protocol picker. Grouped by indication_category
// (e.g. "Pigmentary Disorders"). Each item shows title + version chip.
// On selection: locks the version (caller stamps protocol_version_id at
// submit time via API resolveCurrentVersionId; this component captures
// the *display* version for the chip).
export function ProtocolSelector({
  protocols,
  value,
  onChange,
}: ProtocolSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = protocols.find((p) => p.id === value);

  // Group by indication category title
  const grouped = new Map<string, ProtocolOption[]>();
  for (const p of protocols) {
    const key = p.indication_category?.title ?? "Uncategorized";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              "flex h-11 w-full items-center justify-between rounded-md border border-ink-700/35 bg-bone-50 px-3 text-left font-body text-small text-ink-900 transition-colors duration-[150ms] hover:border-ink-700/50 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
              !selected && "text-ink-500",
            )}
            suppressHydrationWarning
          >
            <span className="truncate">
              {selected ? selected.title : "Search protocols…"}
            </span>
            <ChevronDown
              className="ml-2 size-4 shrink-0 text-ink-500"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search protocols…" />
            <CommandList>
              <CommandEmpty>No protocols found.</CommandEmpty>
              {Array.from(grouped.entries()).map(([category, items]) => (
                <CommandGroup key={category} heading={category}>
                  {items.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={`${category} ${p.title} ${p.current_version ?? ""}`}
                      onSelect={() => {
                        onChange(p.id, p.current_version);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          value === p.id ? "opacity-100" : "opacity-0",
                        )}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{p.title}</span>
                      {p.current_version && (
                        <span
                          className="ml-2 rounded-sm border border-ink-700/15 bg-bone-100 px-1.5 py-0.5 font-body text-caption text-ink-700"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          v{p.current_version}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected && (
        <p
          className="font-body text-caption text-ink-500"
          style={{ lineHeight: 1.55 }}
        >
          Selected: {selected.title}
          {selected.current_version && (
            <>
              {" · "}
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                v{selected.current_version}
              </span>
              {" "}(locked at log time)
            </>
          )}
        </p>
      )}
    </div>
  );
}
