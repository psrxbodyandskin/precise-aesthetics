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

interface PracticeRecoveryEmailProps {
  practiceName: string;
  recoveryLink: string;
}

// Sent when admin clicks "Force password reset" on the practice
// detail page. Brand-register identical to PracticeInvite.tsx; copy
// adapted for a recovery context.
export function PracticeRecoveryEmail({
  practiceName,
  recoveryLink,
}: PracticeRecoveryEmailProps) {
  const greeting = practiceName?.trim()
    ? `Hi ${practiceName} team,`
    : "Hello,";

  return (
    <Html>
      <Head />
      <Preview>Set a new password for your Precise Aesthetics account.</Preview>
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
            <Text style={heading}>{greeting}</Text>
            <Text style={paragraph}>
              A password reset has been initiated for your
              practitioner portal account. Click the button below to set a
              new password.
            </Text>

            <Section style={ctaWrap}>
              <Button href={recoveryLink} style={ctaButton}>
                Set a new password
              </Button>
            </Section>

            <Text style={paragraphSmall}>
              This link is valid for one hour. If you
              didn&rsquo;t request this, please contact us.
            </Text>
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

export default PracticeRecoveryEmail;

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
  margin: "0 0 16px 0",
};

const paragraphSmall: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: 1.55,
  color: "#5A6470",
  margin: "0 0 24px 0",
};

const ctaWrap: React.CSSProperties = { margin: "24px 0" };

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
