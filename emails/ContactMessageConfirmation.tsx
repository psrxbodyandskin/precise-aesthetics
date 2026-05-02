import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ContactMessageConfirmationProps {
  fullName: string;
  subject: string;
}

export function ContactMessageConfirmationEmail({
  fullName,
  subject,
}: ContactMessageConfirmationProps) {
  const greeting = fullName?.trim() ? `Hi ${fullName},` : "Hello,";

  return (
    <Html>
      <Head />
      <Preview>
        We&rsquo;ve received your message and will respond as appropriate.
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>PRECISE AESTHETICS</Text>
            <Text style={tagline}>Clinical Technology</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>{greeting}</Text>
            <Text style={paragraph}>
              Thank you for reaching out. Your message has been received.
            </Text>

            <Section style={subjectBlock}>
              <Text style={subjectLabel}>Subject</Text>
              <Text style={subjectValue}>{subject}</Text>
            </Section>

            <Text style={paragraph}>
              We respond to inquiries as time and content allow. If your message
              concerns scheduling a clinical demonstration of The Precise System,
              the demonstration request page provides a more direct path.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>Precise Aesthetics &middot; Chicago</Text>
            <Text style={footerText}>
              Skin of every shade. &middot; Protocol-driven pico laser.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ContactMessageConfirmationEmail;

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

const header: React.CSSProperties = {
  borderBottom: "1px solid #E0D8C9",
  paddingBottom: "20px",
  marginBottom: "28px",
};

const brand: React.CSSProperties = {
  fontSize: "13px",
  letterSpacing: "0.18em",
  fontWeight: 600,
  color: "#0F1419",
  margin: 0,
};

const tagline: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.14em",
  color: "#5A6470",
  textTransform: "uppercase",
  margin: "4px 0 0 0",
};

const content: React.CSSProperties = {
  paddingBottom: "8px",
};

const heading: React.CSSProperties = {
  fontSize: "20px",
  lineHeight: 1.3,
  fontWeight: 500,
  color: "#0F1419",
  margin: "0 0 18px 0",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: 1.65,
  color: "#1F2933",
  margin: "0 0 16px 0",
};

const subjectBlock: React.CSSProperties = {
  borderLeft: "2px solid #E0D8C9",
  paddingLeft: "14px",
  margin: "20px 0",
};

const subjectLabel: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#5A6470",
  margin: "0 0 4px 0",
};

const subjectValue: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: 1.5,
  color: "#0F1419",
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
  fontSize: "12px",
  letterSpacing: "0.04em",
  color: "#5A6470",
  margin: "2px 0",
};
