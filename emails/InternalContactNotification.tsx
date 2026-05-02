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
import type { ContactMessageValues } from "@/lib/schemas/contact-message";
import { SITE } from "@/lib/constants";

interface InternalContactNotificationProps {
  values: ContactMessageValues;
  submittedAt?: string;
}

export function InternalContactNotificationEmail({
  values,
  submittedAt,
}: InternalContactNotificationProps) {
  const utmText = values.utm
    ? [values.utm.source, values.utm.medium, values.utm.campaign]
        .filter(Boolean)
        .join(" / ") || "—"
    : "—";
  const when = submittedAt ?? new Date().toISOString();
  const organization =
    values.organization && values.organization.length > 0
      ? values.organization
      : "—";

  return (
    <Html>
      <Head />
      <Preview>
        New contact message: {values.fullName} — {values.subject}
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
            <Text style={kicker}>New contact message</Text>
            <Text style={heading}>{values.fullName}</Text>
            <Text style={subheading}>{values.subject}</Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Row label="Email" value={values.email} />
            <Row label="Organization" value={organization} />
            <Row label="Subject" value={values.subject} />
            <Row label="UTM" value={utmText} />
            <Row label="Submitted" value={when} />
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={messageLabel}>Message</Text>
            <Text style={messageBody}>{values.message}</Text>
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

export default InternalContactNotificationEmail;

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
  wordBreak: "break-word",
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

const messageLabel: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#5A6470",
  margin: "0 0 8px 0",
};

const messageBody: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#0F1419",
  margin: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};
