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

interface DemoRequestConfirmationProps {
  firstName: string;
}

export function DemoRequestConfirmationEmail({
  firstName,
}: DemoRequestConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your demonstration request has been received.
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

          <Section>
            <Text style={kicker}>Demonstration request received</Text>
            <Text style={heading}>Thank you, {firstName}.</Text>
            <Text style={paragraph}>
              We have your request and a member of the Precise Aesthetics team
              will be in touch within one business day to schedule your
              clinical demonstration.
            </Text>
            <Text style={paragraph}>
              Demonstrations begin at launch &mdash; August 8, 2026 &mdash; at
              the Civic Opera Building, Chicago. Practitioners requesting
              demonstrations now are first in queue for post-launch scheduling.
            </Text>
            <Text style={paragraph}>
              In the meantime, no action is required.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Precise Aesthetics&trade; &middot; PS Medical Aesthetics, LLC
            </Text>
            <Text style={footerText}>
              Skin of every shade.&trade;
            </Text>
            <Text style={footerSmall}>
              You received this email because you submitted a demonstration
              request at preciseaesthetics.com.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default DemoRequestConfirmationEmail;

const body: React.CSSProperties = {
  backgroundColor: "#FAF7F2",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  color: "#0A0F1C",
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

const kicker: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#4A5568",
  margin: "0 0 12px 0",
};

const heading: React.CSSProperties = {
  fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif",
  fontSize: "26px",
  lineHeight: 1.2,
  fontWeight: 400,
  letterSpacing: "-0.005em",
  color: "#0A0F1C",
  margin: "0 0 20px 0",
};

const paragraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.55,
  color: "#1F2A3D",
  margin: "0 0 16px 0",
};

const hr: React.CSSProperties = {
  borderColor: "#E5DDCC",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.04em",
  color: "#4A5568",
  margin: "0 0 4px 0",
};

const footerSmall: React.CSSProperties = {
  fontSize: "11px",
  color: "#8B95A7",
  margin: "12px 0 0 0",
};
