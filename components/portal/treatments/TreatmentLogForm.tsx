"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FITZPATRICK_TYPES,
  PATIENT_AGE_RANGES,
  PATIENT_AGE_RANGE_LABELS,
  PATIENT_SEX_LABELS,
  PATIENT_SEX_OPTIONS,
  type FitzpatrickType,
  type PatientSex,
} from "@/lib/schemas/treatment";
import { AddAuthorizedUserModal } from "./AddAuthorizedUserModal";
import { ProtocolSelector } from "./ProtocolSelector";
import { PhotoUploader, type PreparedPhoto } from "./PhotoUploader";
import { cn } from "@/lib/utils";

interface AuthorizedUserOption {
  id: string;
  full_name: string;
  role_label: string | null;
}

interface ProtocolOption {
  id: string;
  title: string;
  current_version: string | null;
  indication_tags: string[] | null;
  indication_category: { id: string; title: string } | null;
}

interface TreatmentLogFormProps {
  authorizedUsers: AuthorizedUserOption[];
  protocols: ProtocolOption[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;
const labelClass = "font-body text-overline font-medium uppercase text-ink-500";
const inputClass =
  "h-11 bg-bone-50 border-ink-700/35 text-ink-900 placeholder:text-ink-500";

const TODAY = new Date().toISOString().slice(0, 10);

// Required fields for the progress indicator (9 unconditional + 2 protocol-version stamping):
// We track 9 base required fields per spec.
const REQUIRED_FIELD_COUNT = 9;

export function TreatmentLogForm({
  authorizedUsers: initialAuthorizedUsers,
  protocols,
}: TreatmentLogFormProps) {
  const router = useRouter();
  const [authorizedUsers, setAuthorizedUsers] = useState(initialAuthorizedUsers);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [enteredByUserId, setEnteredByUserId] = useState<string>("");
  const [treatmentDate, setTreatmentDate] = useState<string>(TODAY);
  const [protocolId, setProtocolId] = useState<string>("");
  const [protocolVersion, setProtocolVersion] = useState<string | null>(null);
  const [protocolDeviation, setProtocolDeviation] = useState(false);
  const [protocolDeviationReason, setProtocolDeviationReason] = useState("");
  const [patientAnonId, setPatientAnonId] = useState("");
  const [patientAgeRange, setPatientAgeRange] = useState<string>("");
  const [patientFitzpatrick, setPatientFitzpatrick] = useState<FitzpatrickType | "">("");
  const [patientSex, setPatientSex] = useState<PatientSex | "">("");
  const [indication, setIndication] = useState<string>("");
  const [treatmentSite, setTreatmentSite] = useState("");
  const [sessionNumber, setSessionNumber] = useState<string>("1");
  const [wavelengthNm, setWavelengthNm] = useState("");
  const [fluenceJPerCm2, setFluenceJPerCm2] = useState("");
  const [pulseDurationPs, setPulseDurationPs] = useState("");
  const [spotSizeMm, setSpotSizeMm] = useState("");
  const [totalPulses, setTotalPulses] = useState("");
  const [treatmentDurationMinutes, setTreatmentDurationMinutes] = useState("");
  const [prepKitUsed, setPrepKitUsed] = useState(false);
  const [recoveryKitDispensed, setRecoveryKitDispensed] = useState(false);
  const [maintenanceKitRecommended, setMaintenanceKitRecommended] = useState(false);
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [consentAffirmed, setConsentAffirmed] = useState(false);
  const [notes, setNotes] = useState("");
  const [adverseReaction, setAdverseReaction] = useState(false);
  const [adverseReactionDescription, setAdverseReactionDescription] = useState("");

  // Derived: indication options from selected protocol
  const selectedProtocol = useMemo(
    () => protocols.find((p) => p.id === protocolId),
    [protocols, protocolId],
  );
  const indicationOptions = useMemo(() => {
    if (!selectedProtocol) return [] as Array<{ value: string; label: string }>;
    const opts: Array<{ value: string; label: string }> = [];
    if (selectedProtocol.indication_category) {
      opts.push({
        value: selectedProtocol.indication_category.title,
        label: selectedProtocol.indication_category.title,
      });
    }
    for (const tag of selectedProtocol.indication_tags ?? []) {
      opts.push({ value: tag, label: tag });
    }
    return opts;
  }, [selectedProtocol]);

  // Auto-select indication if only one option
  const handleProtocolChange = (id: string, version: string | null) => {
    setProtocolId(id);
    setProtocolVersion(version);
    const protocol = protocols.find((p) => p.id === id);
    if (protocol) {
      const cat = protocol.indication_category?.title;
      const tags = protocol.indication_tags ?? [];
      const choices = [cat, ...tags].filter(Boolean) as string[];
      if (choices.length === 1) setIndication(choices[0]!);
      else if (cat) setIndication(cat);
    }
  };

  // Progress: count filled required fields
  const filledCount = useMemo(() => {
    let n = 0;
    if (enteredByUserId) n++;
    if (treatmentDate) n++;
    if (protocolId) n++;
    if (patientAgeRange) n++;
    if (patientFitzpatrick) n++;
    if (indication) n++;
    if (sessionNumber && Number(sessionNumber) > 0) n++;
    if (wavelengthNm) n++;
    if (fluenceJPerCm2) n++;
    return n;
  }, [
    enteredByUserId,
    treatmentDate,
    protocolId,
    patientAgeRange,
    patientFitzpatrick,
    indication,
    sessionNumber,
    wavelengthNm,
    fluenceJPerCm2,
  ]);
  const progress = Math.round((filledCount / REQUIRED_FIELD_COUNT) * 100);

  // Soft warning: fluence outside protocol envelope (not blocking)
  // This requires the parameter envelope from Sanity, which we don't fetch
  // here. Skip for now — admin detail page already shows envelope reference.
  // Practitioner-side warning can be a polish addition later if Sanity
  // content is preloaded into the form.

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    // Client-side hand validation. The full Zod schema runs server-side.
    if (!enteredByUserId) return toast.error("Pick who logged this.");
    if (!protocolId) return toast.error("Pick a protocol.");
    if (!patientAgeRange) return toast.error("Pick an age range.");
    if (!patientFitzpatrick) return toast.error("Pick a Fitzpatrick type.");
    if (!indication) return toast.error("Pick an indication.");
    if (!sessionNumber || Number(sessionNumber) < 1)
      return toast.error("Session number must be at least 1.");
    if (protocolDeviation && protocolDeviationReason.trim().length === 0)
      return toast.error("Reason required when deviation is checked.");
    if (adverseReaction && adverseReactionDescription.trim().length === 0)
      return toast.error("Describe the adverse reaction.");
    if (photos.length > 0 && !consentAffirmed)
      return toast.error("Patient consent required for clinical photos.");

    setSubmitting(true);

    const payload = {
      enteredByUserId,
      treatmentDate,
      protocolId,
      // Server resolves the actual version_id at submit time; these
      // fields are placeholders for the server to overwrite.
      protocolVersionId: "00000000-0000-0000-0000-000000000000",
      protocolVersionLabel: protocolVersion ?? "1.0",
      protocolDeviation,
      protocolDeviationReason: protocolDeviation ? protocolDeviationReason : undefined,
      patientAnonId: patientAnonId || undefined,
      patientAgeRange,
      patientFitzpatrick,
      patientSex: patientSex || undefined,
      indication,
      treatmentSite: treatmentSite || undefined,
      sessionNumber: Number(sessionNumber),
      wavelengthNm: wavelengthNm ? Number(wavelengthNm) : undefined,
      fluenceJPerCm2: fluenceJPerCm2 ? Number(fluenceJPerCm2) : undefined,
      pulseDurationPs: pulseDurationPs ? Number(pulseDurationPs) : undefined,
      spotSizeMm: spotSizeMm ? Number(spotSizeMm) : undefined,
      totalPulses: totalPulses ? Number(totalPulses) : undefined,
      treatmentDurationMinutes: treatmentDurationMinutes
        ? Number(treatmentDurationMinutes)
        : undefined,
      prepKitUsed,
      recoveryKitDispensed,
      maintenanceKitRecommended,
      notes: notes || undefined,
      adverseReaction,
      adverseReactionDescription: adverseReaction
        ? adverseReactionDescription
        : undefined,
      photoMetadata: photos.map((p) => ({
        filename: p.file.name,
        capturePhase: p.capturePhase,
        caption: p.caption,
      })),
      consentAffirmed,
    };

    const fd = new FormData();
    fd.append("payload", JSON.stringify(payload));
    photos.forEach((p, i) => fd.append(`photo_${i}`, p.file));

    try {
      const res = await fetch("/api/portal/treatments", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        treatmentId?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.treatmentId) {
        toast.error(data.error ?? "Could not log treatment.");
        setSubmitting(false);
        return;
      }
      toast.success("Treatment logged.");
      router.push(`/portal/treatments/${data.treatmentId}`);
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {/* Sticky progress hairline */}
      <div
        aria-hidden="true"
        className="sticky top-0 z-10 -mx-6 mb-10 h-px bg-ink-100 md:-mx-0"
      >
        <div
          className="h-full bg-brand-300 transition-[width] duration-[200ms]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-12">
        {/* 1. Entered by */}
        <Section heading="Entered by">
          <div className="space-y-2">
            <Label htmlFor="entered-by" className="sr-only">Entered by</Label>
            <Select
              value={enteredByUserId}
              onValueChange={(v) => {
                if (v === "__add__") {
                  setAddUserOpen(true);
                  return;
                }
                setEnteredByUserId(v);
              }}
            >
              <SelectTrigger id="entered-by" className={inputClass} suppressHydrationWarning>
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {authorizedUsers.length === 0 && (
                  <SelectItem value="__none__" disabled>
                    No users yet — add one
                  </SelectItem>
                )}
                {authorizedUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name}
                    {u.role_label ? ` — ${u.role_label}` : ""}
                  </SelectItem>
                ))}
                <SelectItem value="__add__">+ Add a new user</SelectItem>
              </SelectContent>
            </Select>
            <p className="font-body text-caption text-ink-500" style={{ lineHeight: 1.55 }}>
              The list is managed by your practice. Add new users as needed.
            </p>
          </div>
        </Section>

        <SectionDivider />

        {/* 2. Treatment date */}
        <Section heading="Treatment date">
          <Input
            type="date"
            value={treatmentDate}
            onChange={(e) => setTreatmentDate(e.target.value)}
            max={TODAY}
            className={cn(inputClass, "max-w-[240px]")}
            suppressHydrationWarning
          />
        </Section>

        <SectionDivider />

        {/* 3. Protocol */}
        <Section heading="Protocol">
          <ProtocolSelector
            protocols={protocols}
            value={protocolId || null}
            onChange={handleProtocolChange}
          />
          <div className="mt-4">
            <Label className="flex cursor-pointer items-start gap-3 font-body text-small text-ink-700">
              <input
                type="checkbox"
                checked={protocolDeviation}
                onChange={(e) => setProtocolDeviation(e.target.checked)}
                className="mt-0.5 size-4 rounded-sm border-ink-700/35 text-brand-500 focus-visible:[box-shadow:var(--pa-focus-ring)]"
              />
              I deviated from this protocol
            </Label>
            {protocolDeviation && (
              <Textarea
                value={protocolDeviationReason}
                onChange={(e) => setProtocolDeviationReason(e.target.value)}
                placeholder="Reason for deviation"
                rows={3}
                className="mt-3 bg-bone-50 border-ink-700/35"
              />
            )}
          </div>
        </Section>

        <SectionDivider />

        {/* 4. Patient context */}
        <Section heading="Patient context">
          <div className="space-y-5">
            <div>
              <Label htmlFor="patient-anon" className={cn(labelClass, "block")} style={EYEBROW_TRACKING}>
                Anonymous patient ID <span className="text-ink-500 normal-case tracking-normal">(optional)</span>
              </Label>
              <Input
                id="patient-anon"
                value={patientAnonId}
                onChange={(e) => setPatientAnonId(e.target.value)}
                placeholder="your-internal-code"
                maxLength={40}
                className={cn(inputClass, "mt-2")}
              />
              <p className="mt-2 font-body text-caption text-ink-500" style={{ lineHeight: 1.55 }}>
                Optional. Used for series tracking on your end. Not stored as patient identification.
              </p>
            </div>

            <div>
              <Label htmlFor="age-range" className={cn(labelClass, "block")} style={EYEBROW_TRACKING}>
                Age range
              </Label>
              <Select value={patientAgeRange} onValueChange={setPatientAgeRange}>
                <SelectTrigger id="age-range" className={cn(inputClass, "mt-2 max-w-[280px]")} suppressHydrationWarning>
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {PATIENT_AGE_RANGES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {PATIENT_AGE_RANGE_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className={cn(labelClass)} style={EYEBROW_TRACKING}>
                Fitzpatrick type
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {FITZPATRICK_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPatientFitzpatrick(t)}
                    aria-pressed={patientFitzpatrick === t}
                    className={cn(
                      "inline-flex h-10 min-w-[2.75rem] items-center justify-center rounded-sm border font-body text-small font-medium outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] transition-colors duration-[150ms]",
                      patientFitzpatrick === t
                        ? "border-brand-500 bg-brand-300/30 text-ink-900"
                        : "border-ink-700/25 bg-bone-50 text-ink-700 hover:border-ink-700/45",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={cn(labelClass)} style={EYEBROW_TRACKING}>
                Sex <span className="text-ink-500 normal-case tracking-normal">(optional)</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PATIENT_SEX_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPatientSex(patientSex === s ? "" : s)}
                    aria-pressed={patientSex === s}
                    className={cn(
                      "inline-flex h-10 items-center justify-center rounded-sm border px-4 font-body text-small font-medium outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] transition-colors duration-[150ms]",
                      patientSex === s
                        ? "border-brand-500 bg-brand-300/30 text-ink-900"
                        : "border-ink-700/25 bg-bone-50 text-ink-700 hover:border-ink-700/45",
                    )}
                  >
                    {PATIENT_SEX_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <SectionDivider />

        {/* 5. Treatment context */}
        <Section heading="Treatment context">
          <div className="space-y-5">
            <div>
              <Label htmlFor="indication" className={cn(labelClass, "block")} style={EYEBROW_TRACKING}>
                Indication
              </Label>
              <Select
                value={indication}
                onValueChange={setIndication}
                disabled={!selectedProtocol}
              >
                <SelectTrigger id="indication" className={cn(inputClass, "mt-2")} suppressHydrationWarning>
                  <SelectValue placeholder={selectedProtocol ? "Choose…" : "Select a protocol first"} />
                </SelectTrigger>
                <SelectContent>
                  {indicationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="site" className={cn(labelClass, "block")} style={EYEBROW_TRACKING}>
                Treatment site <span className="text-ink-500 normal-case tracking-normal">(optional)</span>
              </Label>
              <Input
                id="site"
                value={treatmentSite}
                onChange={(e) => setTreatmentSite(e.target.value)}
                placeholder="Cheeks and forehead"
                className={cn(inputClass, "mt-2")}
              />
            </div>

            <div>
              <Label htmlFor="session-num" className={cn(labelClass, "block")} style={EYEBROW_TRACKING}>
                Session number
              </Label>
              <Input
                id="session-num"
                type="number"
                inputMode="numeric"
                min={1}
                value={sessionNumber}
                onChange={(e) => setSessionNumber(e.target.value)}
                className={cn(inputClass, "mt-2 max-w-[140px]")}
              />
            </div>
          </div>
        </Section>

        <SectionDivider />

        {/* 6. Parameters */}
        <Section heading="Parameters delivered">
          <p className="mb-5 font-body text-caption text-ink-500" style={{ lineHeight: 1.55 }}>
            Capture the actual parameters used. Wavelength + fluence required.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <FieldNumber
              id="wavelength"
              label="Wavelength (nm)"
              value={wavelengthNm}
              onChange={setWavelengthNm}
              placeholder="1064"
              required
            />
            <FieldNumber
              id="fluence"
              label="Fluence (J/cm²)"
              value={fluenceJPerCm2}
              onChange={setFluenceJPerCm2}
              placeholder="2.0"
              step="0.1"
              required
            />
            <FieldNumber
              id="pulse"
              label="Pulse duration (ps)"
              value={pulseDurationPs}
              onChange={setPulseDurationPs}
              placeholder="450"
            />
            <FieldNumber
              id="spot"
              label="Spot size (mm)"
              value={spotSizeMm}
              onChange={setSpotSizeMm}
              placeholder="5"
              step="0.1"
            />
            <FieldNumber
              id="pulses"
              label="Total pulses"
              value={totalPulses}
              onChange={setTotalPulses}
              placeholder="450"
            />
            <FieldNumber
              id="duration"
              label="Treatment duration (min)"
              value={treatmentDurationMinutes}
              onChange={setTreatmentDurationMinutes}
              placeholder="12"
            />
          </div>
        </Section>

        <SectionDivider />

        {/* 7. Biologic control */}
        <Section heading="Biologic control">
          <ul className="space-y-3">
            <CheckboxRow
              label="Prep kit used"
              checked={prepKitUsed}
              onChange={setPrepKitUsed}
            />
            <CheckboxRow
              label="Recovery kit dispensed"
              checked={recoveryKitDispensed}
              onChange={setRecoveryKitDispensed}
            />
            <CheckboxRow
              label="Maintenance kit recommended"
              checked={maintenanceKitRecommended}
              onChange={setMaintenanceKitRecommended}
            />
          </ul>
        </Section>

        <SectionDivider />

        {/* 8. Photos */}
        <Section heading="Photos (optional)">
          <PhotoUploader
            value={photos}
            onChange={setPhotos}
            consentAffirmed={consentAffirmed}
            onConsentChange={setConsentAffirmed}
          />
        </Section>

        <SectionDivider />

        {/* 9. Notes */}
        <Section heading="Notes (optional)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Patient tolerated well. Recommended 6-week spacing for next session."
            className="bg-bone-50 border-ink-700/35"
          />
        </Section>

        <SectionDivider />

        {/* 10. Adverse reaction */}
        <Section heading="Adverse reaction">
          <p className="mb-3 font-body text-small text-ink-700">
            Did this treatment cause an adverse reaction?
          </p>
          <div className="flex gap-3">
            {[false, true].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setAdverseReaction(v)}
                aria-pressed={adverseReaction === v}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-sm border px-5 font-body text-small font-medium outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] transition-colors duration-[150ms]",
                  adverseReaction === v
                    ? "border-brand-500 bg-brand-300/30 text-ink-900"
                    : "border-ink-700/25 bg-bone-50 text-ink-700 hover:border-ink-700/45",
                )}
              >
                {v ? "Yes" : "No"}
              </button>
            ))}
          </div>
          {adverseReaction && (
            <Textarea
              value={adverseReactionDescription}
              onChange={(e) => setAdverseReactionDescription(e.target.value)}
              placeholder="Describe what happened, when it resolved, and any treatment given."
              rows={4}
              className="mt-4 bg-bone-50 border-ink-700/35"
            />
          )}
        </Section>

        <SectionDivider />

        {/* Submit */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={submitting}
            suppressHydrationWarning
          >
            {submitting ? "Logging…" : "Log treatment"}
          </Button>
          <p className="mt-3 font-body text-caption text-ink-500" style={{ lineHeight: 1.55 }}>
            Treatment will be saved to your practice&rsquo;s record and contribute to system-wide pattern recognition.
          </p>
        </div>
      </div>

      <AddAuthorizedUserModal
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onCreated={(created) => {
          setAuthorizedUsers((prev) => [...prev, created]);
          setEnteredByUserId(created.id);
        }}
      />
    </form>
  );
}

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p
        className="font-body text-overline font-medium uppercase text-ink-500 mb-4"
        style={EYEBROW_TRACKING}
      >
        {heading}
      </p>
      {children}
    </section>
  );
}

function SectionDivider() {
  return (
    <div aria-hidden="true" className="flex justify-center py-2">
      <span className="block h-px w-[60px] bg-brand-500/30" />
    </div>
  );
}

function FieldNumber({
  id,
  label,
  value,
  onChange,
  placeholder,
  step,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} className={cn(labelClass, "block")} style={EYEBROW_TRACKING}>
        {label}
        {required && <span className="ml-1 text-brand-700 normal-case tracking-normal">*</span>}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputClass, "mt-2")}
      />
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-ink-700/15 bg-bone-50 p-4 transition-colors duration-[150ms] hover:border-ink-700/30">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 rounded-sm border-ink-700/35 text-brand-500 focus-visible:[box-shadow:var(--pa-focus-ring)]"
        />
        <span className="font-body text-small text-ink-900">{label}</span>
      </label>
    </li>
  );
}
