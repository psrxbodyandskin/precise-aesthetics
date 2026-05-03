"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { US_STATES } from "@/lib/schemas/practice";
import { setProfileAction } from "@/app/(portal)/portal/setup/actions";

const labelClass = "text-small font-medium text-ink-900";
const inputClass =
  "h-11 bg-bone-50 border-ink-700/35 text-ink-900 placeholder:text-ink-500";

interface ProfileFormProps {
  initial: {
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
  };
}

export function ProfileForm({ initial }: ProfileFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await setProfileAction(fd);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      if (result.redirectTo) router.push(result.redirectTo);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div>
        <Label htmlFor="setup-phone" className={labelClass}>
          Phone
        </Label>
        <Input
          id="setup-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={initial.phone ?? ""}
          className={cn(inputClass, "mt-2")}
          suppressHydrationWarning
        />
      </div>

      <div>
        <Label htmlFor="setup-line1" className={labelClass}>
          Address line 1
        </Label>
        <Input
          id="setup-line1"
          name="addressLine1"
          autoComplete="address-line1"
          defaultValue={initial.addressLine1 ?? ""}
          className={cn(inputClass, "mt-2")}
          suppressHydrationWarning
        />
      </div>

      <div>
        <Label htmlFor="setup-line2" className={labelClass}>
          Address line 2 <span className="text-ink-500">(optional)</span>
        </Label>
        <Input
          id="setup-line2"
          name="addressLine2"
          autoComplete="address-line2"
          defaultValue={initial.addressLine2 ?? ""}
          className={cn(inputClass, "mt-2")}
          suppressHydrationWarning
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_120px_140px]">
        <div>
          <Label htmlFor="setup-city" className={labelClass}>
            City
          </Label>
          <Input
            id="setup-city"
            name="city"
            autoComplete="address-level2"
            defaultValue={initial.city ?? ""}
            className={cn(inputClass, "mt-2")}
            suppressHydrationWarning
          />
        </div>

        <div>
          <Label htmlFor="setup-state" className={labelClass}>
            State
          </Label>
          <Select name="state" defaultValue={initial.state ?? ""}>
            <SelectTrigger
              id="setup-state"
              className={cn(inputClass, "mt-2 w-full")}
              suppressHydrationWarning
            >
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="setup-postal" className={labelClass}>
            ZIP
          </Label>
          <Input
            id="setup-postal"
            name="postalCode"
            autoComplete="postal-code"
            inputMode="numeric"
            defaultValue={initial.postalCode ?? ""}
            className={cn(inputClass, "mt-2")}
            suppressHydrationWarning
          />
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={pending}
          className="w-full sm:w-auto"
          suppressHydrationWarning
        >
          {pending ? "Saving" : "Save and continue"}
        </Button>
      </div>
    </form>
  );
}
