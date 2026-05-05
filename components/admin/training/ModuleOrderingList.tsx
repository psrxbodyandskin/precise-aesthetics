"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { CurriculumModuleRow, TrainingModuleRow } from "@/lib/admin/training";

interface ModuleOrderingListProps {
  curriculumId: string;
  modules: Array<CurriculumModuleRow & { module: TrainingModuleRow }>;
}

export function ModuleOrderingList({
  curriculumId,
  modules,
}: ModuleOrderingListProps) {
  const router = useRouter();
  const [items, setItems] = useState(modules);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.module.id === active.id);
    const newIndex = items.findIndex((i) => i.module.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    startTransition(async () => {
      const res = await fetch(
        `/api/admin/training/curricula/${curriculumId}/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleIds: next.map((i) => i.module.id) }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not reorder.");
        // revert
        setItems(items);
        return;
      }
      router.refresh();
    });
  }

  async function removeModule(moduleId: string) {
    if (!confirm("Remove this module from the curriculum?")) return;
    const prev = items;
    setItems(items.filter((i) => i.module.id !== moduleId));
    const res = await fetch(
      `/api/admin/training/curricula/${curriculumId}/modules/${moduleId}`,
      { method: "DELETE" },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Could not remove.");
      setItems(prev);
      return;
    }
    toast.success("Module removed.");
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="font-body text-caption text-ink-500">
        No modules attached. Add modules below to build the curriculum.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.module.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <SortableRow
              key={item.module.id}
              id={item.module.id}
              index={idx}
              module={item.module}
              isRequired={item.is_required}
              disabled={pending}
              onRemove={() => removeModule(item.module.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  index,
  module,
  isRequired,
  disabled,
  onRemove,
}: {
  id: string;
  index: number;
  module: TrainingModuleRow;
  isRequired: boolean;
  disabled: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-md border border-ink-700/15 bg-bone-50 px-3 py-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded-sm p-1 text-ink-500 hover:text-ink-900 active:cursor-grabbing"
        aria-label="Drag to reorder"
        disabled={disabled}
      >
        <GripVertical className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
      <span
        className="w-7 font-body text-caption text-ink-500"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <Link
        href={`/admin/training/modules/${module.id}/preview`}
        className="flex-1 min-w-0 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
      >
        <p className="font-body text-small font-medium text-ink-900 truncate hover:text-brand-700">
          {module.title}
        </p>
        <p className="font-body text-caption text-ink-500 truncate">
          /{module.slug}
          {isRequired ? " · Required" : " · Optional"}
        </p>
      </Link>
      <Link
        href={`/admin/training/modules/${module.id}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-ink-700/15 bg-bone-50 px-3 font-body text-caption text-ink-700 transition-colors duration-[150ms] hover:border-ink-700/35 hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
        aria-label={`Edit ${module.title}`}
      >
        <Pencil className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
        Edit
      </Link>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onRemove}
        disabled={disabled}
      >
        <Trash2 className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
      </Button>
    </li>
  );
}
