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
import type { LeadInterest, LeadRole } from "@/lib/schemas/lead-form";
import { SITE } from "@/lib/constants";

interface InternalLeadNotificationProps {
  firstName: string;
  lastName: string;
  email: string;
  practiceName: string;
  role: LeadRole;
  interest: LeadInterest[];
  source: string;
  status: "created" | "updated";
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
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

const INTEREST_LABEL: Record<LeadInterest, string> = {
  demo: "Demo",
  launch_event: "Launch event",
  press: "Press",
};

export function InternalLeadNotificationEmail({
  firstName,
  lastName,
  email,
  practiceName,
  role,
  interest,
  source,
  status,
  utm,
  submittedAt,
}: InternalLeadNotificationProps) {
  const fullName = `${firstName} ${lastName}`.trim();
  const interestText = interest.map((i) => INTEREST_LABEL[i]).join(", ") || "—";
  const utmText = utm
    ? [utm.source, utm.medium, utm.campaign].filter(Boolean).join(" / ") || "—"
    : "—";
  const when = submittedAt ?? new Date().toISOString();

  return (
    <Html>
      <Head />
      <Preview>
        New {status === "updated" ? "returning" : ""} lead: {fullName} ({practiceName})
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
            <Text style={kicker}>
              {status === "updated" ? "Returning lead" : "New lead"} &middot; {source}
            </Text>
            <Text style={heading}>{fullName}</Text>
            <Text style={subheading}>
              {ROLE_LABEL[role]} &middot; {practiceName}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Row label="Email" value={email} />
            <Row label="Interest" value={interestText} />
            <Row label="Role" value={ROLE_LABEL[role]} />
            <Row label="Practice" value={practiceName} />
            <Row label="Source" value={source} />
            <Row label="UTM" value={utmText} />
            <Row label="Status" value={status === "updated" ? "Updated existing record" : "Created new record"} />
            <Row label="Submitted" value={when} />
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Precise Aesthetics&trade; &middot; PS Medical Aesthetics, LLC
            </Text>
            <Text style={footerText}>
              Skin of every shade.&trade; &middot; Protocol-driven pico laser.
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

export default InternalLeadNotificationEmail;

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
  borderRadius: "4px",
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
