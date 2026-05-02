import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { SITE } from "@/lib/constants";
import type {
  DemoRequestValues,
  DemoTimeline,
  PracticeType,
  TreatmentCondition,
  TreatmentVolume,
} from "@/lib/schemas/demo-request";
import type { LeadRole } from "@/lib/schemas/lead-form";

interface InternalDemoNotificationProps {
  values: DemoRequestValues;
  submittedAt?: string;
}

const ROLE_LABEL: Record<LeadRole, string> = {
  physician: "Physician",
  aprn: "APRN",
  pa: "PA",
  rn: "RN",
  owner: "Practice owner",
  other: "Other",
};

const PRACTICE_TYPE_LABEL: Record<PracticeType, string> = {
  dermatology: "Dermatology",
  plastic_surgery: "Plastic surgery",
  medspa: "Medspa",
  aesthetic_clinic: "Aesthetic clinic",
  other: "Other",
};

const VOLUME_LABEL: Record<TreatmentVolume, string> = {
  "0-10": "0–10 / month",
  "11-50": "11–50 / month",
  "51-150": "51–150 / month",
  "151-300": "151–300 / month",
  "300+": "300+ / month",
};

const CONDITION_LABEL: Record<TreatmentCondition, string> = {
  pigment: "Pigment",
  melasma: "Melasma",
  acne: "Acne",
  acne_scarring: "Acne scarring",
  tattoo_removal: "Tattoo removal",
  hair_removal: "Hair removal",
  other: "Other",
};

const TIMELINE_LABEL: Record<DemoTimeline, string> = {
  now: "Ready now",
  "30_days": "Within 30 days",
  "60_90_days": "60–90 days",
  exploring: "Exploring",
};

export function InternalDemoNotificationEmail({
  values,
  submittedAt,
}: InternalDemoNotificationProps) {
  const fullName = `${values.firstName} ${values.lastName}`.trim();
  const conditionsText =
    values.treatmentConditions && values.treatmentConditions.length > 0
      ? values.treatmentConditions.map((i) => CONDITION_LABEL[i]).join(", ")
      : "—";
  const utmText = values.utm
    ? [values.utm.source, values.utm.medium, values.utm.campaign]
        .filter(Boolean)
        .join(" / ") || "—"
    : "—";
  const when = submittedAt ?? new Date().toISOString();

  return (
    <Html>
      <Head />
      <Preview>
        Demo request: {fullName} ({values.practiceName})
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandWrap}>
            <Img
              src={`${SITE.url}/brand/precise-aesthetics-brand-identity/assets/logos/precise-aesthetics-horizontal-navy@2x.png`}
              width="200"
              height="50"
              alt="Precise Aesthetics"
              style={logo}
            />
          </Section>

          <Hr style={hr} />

          <Section style={header}>
            <Text style={kicker}>Demonstration request</Text>
            <Text style={heading}>{fullName}</Text>
            <Text style={subheading}>
              {ROLE_LABEL[values.role]} &middot; {values.practiceName}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Row label="Email" value={values.email} />
            {values.phone && <Row label="Phone" value={values.phone} />}
            <Row label="Practice" value={values.practiceName} />
            <Row label="Role" value={ROLE_LABEL[values.role]} />
            {values.practiceType && (
              <Row
                label="Practice type"
                value={PRACTICE_TYPE_LABEL[values.practiceType]}
              />
            )}
            {values.state && <Row label="State" value={values.state} />}
            {values.currentDevices && (
              <Row label="Current devices" value={values.currentDevices} />
            )}
            {values.monthlyTreatmentVolume && (
              <Row
                label="Monthly volume"
                value={VOLUME_LABEL[values.monthlyTreatmentVolume]}
              />
            )}
            <Row label="Conditions treated" value={conditionsText} />
            {values.timeline && (
              <Row label="Timeline" value={TIMELINE_LABEL[values.timeline]} />
            )}
            {values.notes && <Row label="Notes" value={values.notes} />}
            <Row label="UTM" value={utmText} />
            <Row label="Submitted" value={when} />
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Precise Aesthetics&trade; &middot; PS Medical Aesthetics, LLC
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Section style={row}>
      <Text style={rowLabel}>{label}</Text>
      <Text style={rowValue}>{value}</Text>
    </Section>
  );
}

export default InternalDemoNotificationEmail;

const body: React.CSSProperties = {
  backgroundColor: "#FAF7F2",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  color: "#0F1419",
  margin: 0,
  padding: "24px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#FAF7F2",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px 28px",
};

const brandWrap: React.CSSProperties = {
  marginBottom: "8px",
};

const logo: React.CSSProperties = {
  display: "block",
  width: "200px",
  height: "auto",
};

const header: React.CSSProperties = {
  marginBottom: "12px",
};

const kicker: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#5A6470",
  margin: "0 0 8px 0",
};

const heading: React.CSSProperties = {
  fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif",
  fontSize: "24px",
  lineHeight: 1.2,
  fontWeight: 400,
  letterSpacing: "-0.005em",
  color: "#0F1419",
  margin: "0 0 4px 0",
};

const subheading: React.CSSProperties = {
  fontSize: "14px",
  color: "#5A6470",
  margin: 0,
};

const hr: React.CSSProperties = {
  borderColor: "#E0D8C9",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.04em",
  color: "#5A6470",
  margin: "0 0 4px 0",
};

const row: React.CSSProperties = {
  marginBottom: "10px",
};

const rowLabel: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#5A6470",
  margin: "0 0 2px 0",
};

const rowValue: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.5,
  color: "#0F1419",
  margin: 0,
  wordBreak: "break-word",
};
