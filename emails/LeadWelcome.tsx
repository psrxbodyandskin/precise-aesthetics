import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { LeadInterest } from "@/lib/schemas/lead-form";

interface LeadWelcomeEmailProps {
  firstName: string;
  interest: LeadInterest[];
  siteUrl?: string;
}

const INTEREST_COPY: Record<LeadInterest, string> = {
  demo: "A clinical demonstration of the Precise Pico system.",
  launch_event: "An invitation to the August 8, 2026 launch at the Civic Opera Building, Chicago.",
  press: "Press materials and interview availability ahead of launch.",
};

export function LeadWelcomeEmail({
  firstName,
  interest,
  siteUrl = "https://preciseaesthetics.com",
}: LeadWelcomeEmailProps) {
  const greeting = firstName?.trim() ? `Hello ${firstName},` : "Hello,";
  const items = interest.length ? interest : (["demo"] as LeadInterest[]);

  return (
    <Html>
      <Head />
      <Preview>You are on the Precise Aesthetics list.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>PRECISE AESTHETICS</Text>
            <Text style={tagline}>Clinical Technology</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>{greeting}</Text>
            <Text style={paragraph}>
              Thank you for your interest in Precise Aesthetics. We are building a
              protocol-driven pico laser system designed for predictable outcomes
              across every skin type.
            </Text>
            <Text style={paragraph}>Based on what you selected, we will follow up with:</Text>

            <Section style={list}>
              {items.map((key) => (
                <Text key={key} style={listItem}>
                  &mdash; {INTEREST_COPY[key]}
                </Text>
              ))}
            </Section>

            <Text style={paragraph}>
              The system launches August 8, 2026 at the Civic Opera Building in
              Chicago. Substantive updates will reach you in the weeks ahead.
            </Text>

            <Text style={paragraph}>
              In the meantime, you can read more at{" "}
              <Link href={siteUrl} style={link}>
                {siteUrl.replace(/^https?:\/\//, "")}
              </Link>
              .
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

export default LeadWelcomeEmail;

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

const list: React.CSSProperties = {
  margin: "8px 0 20px 0",
};

const listItem: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: 1.6,
  color: "#1F2933",
  margin: "0 0 6px 0",
};

const link: React.CSSProperties = {
  color: "#0F1419",
  textDecoration: "underline",
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
