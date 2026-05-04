import {
  Body,
  Button,
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

interface AdverseEventNotificationEmailProps {
  adverseEventId: string;
  practiceName: string;
  treatmentDate: string;
  protocolTitle: string;
  protocolVersionLabel: string;
  indication: string;
  patientFitzpatrick: string;
  enteredByName: string;
  description: string;
}

// Internal admin notification — sent the moment a practitioner flags
// an adverse reaction on a treatment log. Voice is system-first,
// information-dense, no marketing register.
export function AdverseEventNotificationEmail({
  adverseEventId,
  practiceName,
  treatmentDate,
  protocolTitle,
  protocolVersionLabel,
  indication,
  patientFitzpatrick,
  enteredByName,
  description,
}: AdverseEventNotificationEmailProps) {
  const reviewUrl = `${SITE.url}/admin/adverse-events/${adverseEventId}`;

  return (
    <Html>
      <Head />
      <Preview>
        A new adverse event has been logged for clinical review.
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

          <Section style={content}>
            <Text style={heading}>Adverse event reported.</Text>
            <Text style={paragraph}>
              A new adverse event has been logged for clinical review.
            </Text>

            <Section style={metaTable}>
              <MetaRow label="Practice" value={practiceName} />
              <MetaRow label="Date" value={treatmentDate} />
              <MetaRow
                label="Protocol"
                value={`${protocolTitle} (v${protocolVersionLabel})`}
              />
              <MetaRow label="Indication" value={indication} />
              <MetaRow
                label="Patient Fitzpatrick"
                value={`Type ${patientFitzpatrick}`}
              />
              <MetaRow label="Entered by" value={enteredByName} />
            </Section>

            <Text style={subhead}>Description</Text>
            <Text style={descriptionBlock}>{description}</Text>

            <Section style={ctaWrap}>
              <Button href={reviewUrl} style={ctaButton}>
                Review in admin panel
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Precise Aesthetics&trade; &middot; PS Medical Aesthetics, LLC
            </Text>
            <Text style={footerText}>System notification — Adverse event triage</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Section style={metaRow}>
      <Text style={metaLabel}>{label}</Text>
      <Text style={metaValue}>{value}</Text>
    </Section>
  );
}

export default AdverseEventNotificationEmail;

// ----- Styles (matches the existing internal-notification register) -----

const body: React.CSSProperties = {
  backgroundColor: "#F5F0E8",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  color: "#0F1419",
  margin: 0,
  padding: "32px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#FAF7F2",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "40px 32px",
  borderRadius: "4px",
};

const brandWrap: React.CSSProperties = { marginBottom: "8px" };

const logo: React.CSSProperties = {
  display: "block",
  width: "200px",
  height: "auto",
};

const content: React.CSSProperties = { paddingBottom: "8px" };

const heading: React.CSSProperties = {
  fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif",
  fontSize: "24px",
  lineHeight: 1.2,
  fontWeight: 400,
  letterSpacing: "-0.005em",
  color: "#0F1419",
  margin: "0 0 18px 0",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: 1.65,
  color: "#1F2933",
  margin: "0 0 24px 0",
};

const subhead: React.CSSProperties = {
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: "#5A6470",
  margin: "16px 0 8px 0",
};

const descriptionBlock: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.65,
  color: "#0F1419",
  margin: "0 0 24px 0",
  padding: "16px",
  backgroundColor: "#F5F0E8",
  borderLeft: "2px solid #C9B68F",
};

const metaTable: React.CSSProperties = {
  margin: "0 0 24px 0",
  borderTop: "1px solid #E0D8C9",
};

const metaRow: React.CSSProperties = {
  borderBottom: "1px solid #E0D8C9",
  padding: "10px 0",
  display: "block",
};

const metaLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: "#5A6470",
  margin: "0 0 2px 0",
};

const metaValue: React.CSSProperties = {
  fontSize: "14px",
  color: "#0F1419",
  margin: 0,
};

const ctaWrap: React.CSSProperties = { margin: "16px 0" };

const ctaButton: React.CSSProperties = {
  backgroundColor: "#0C1426",
  color: "#FDFCF9",
  fontSize: "15px",
  fontWeight: 500,
  letterSpacing: "-0.005em",
  padding: "14px 28px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};

const hr: React.CSSProperties = {
  borderColor: "#E0D8C9",
  margin: "24px 0",
};

const footer: React.CSSProperties = { textAlign: "center" };

const footerText: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.04em",
  color: "#5A6470",
  margin: "0 0 4px 0",
};
