import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  type ButtonProps,
} from "@react-email/components";
import type { ReactNode, CSSProperties } from "react";

// P10 — Shared notification email shell. All category templates
// inherit this brand register so the chrome stays consistent
// across "Protocol updated", "Adverse event status update",
// inbox alerts, etc. Mirrors LeadWelcome.tsx (Bone-100 bg,
// brand wordmark, Inter body, Fraunces feel via system fallback).
//
// Category templates pass in:
//   preview      — preheader text shown in the inbox preview pane
//   eyebrow      — small uppercase label above the heading
//   title        — the notification title (Inter 500)
//   body         — paragraph(s) — pass a string OR a ReactNode for
//                  multi-paragraph layouts
//   ctaUrl       — full URL the brand button points to
//   ctaLabel     — button text
//   unsubscribeUrl — opens /portal/settings/notifications or the
//                    admin equivalent

interface NotificationShellProps {
  preview?: string;
  eyebrow?: string;
  title: string;
  body: ReactNode;
  ctaUrl: string;
  ctaLabel: string;
  unsubscribeUrl: string;
}

export function NotificationShell({
  preview,
  eyebrow,
  title,
  body,
  ctaUrl,
  ctaLabel,
  unsubscribeUrl,
}: NotificationShellProps) {
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={bodyStyle}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>PRECISE AESTHETICS</Text>
            <Text style={tagline}>Clinical Technology</Text>
          </Section>

          <Section style={content}>
            {eyebrow && <Text style={eyebrowStyle}>{eyebrow}</Text>}
            <Text style={heading}>{title}</Text>
            {typeof body === "string" ? (
              <Text style={paragraph}>{body}</Text>
            ) : (
              body
            )}
            <Section style={ctaSection}>
              <Button href={ctaUrl} style={ctaButton}>
                {ctaLabel}
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>Precise Aesthetics &middot; Chicago</Text>
            <Text style={footerText}>
              Skin of every shade. &middot; Protocol-driven pico laser.
            </Text>
            <Text style={footerSmall}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Manage notification preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Re-export the paragraph style so per-category templates can
// build multi-paragraph bodies that match the shell exactly.
export const notificationParagraphStyle: CSSProperties = {
  fontSize: "15px",
  lineHeight: 1.65,
  color: "#1F2933",
  margin: "0 0 16px 0",
};

const bodyStyle: CSSProperties = {
  backgroundColor: "#F5F0E8",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  color: "#0F1419",
  margin: 0,
  padding: "32px 0",
};

const container: CSSProperties = {
  backgroundColor: "#FAF7F2",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "40px 32px",
  borderRadius: "4px",
};

const header: CSSProperties = {
  borderBottom: "1px solid #E0D8C9",
  paddingBottom: "20px",
  marginBottom: "28px",
};

const brand: CSSProperties = {
  fontSize: "13px",
  letterSpacing: "0.18em",
  fontWeight: 600,
  color: "#0F1419",
  margin: 0,
};

const tagline: CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.14em",
  color: "#5A6470",
  textTransform: "uppercase",
  margin: "4px 0 0 0",
};

const content: CSSProperties = {
  paddingBottom: "8px",
};

const eyebrowStyle: CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.18em",
  fontWeight: 500,
  textTransform: "uppercase",
  color: "#5A6470",
  margin: "0 0 12px 0",
};

const heading: CSSProperties = {
  fontSize: "20px",
  lineHeight: 1.3,
  fontWeight: 500,
  color: "#0F1419",
  margin: "0 0 18px 0",
};

const paragraph = notificationParagraphStyle;

const ctaSection: CSSProperties = {
  margin: "28px 0 8px 0",
};

const ctaButton: ButtonProps["style"] = {
  backgroundColor: "#0F1419",
  color: "#FAF7F2",
  fontSize: "14px",
  letterSpacing: "0.04em",
  fontWeight: 500,
  padding: "12px 22px",
  borderRadius: "2px",
  textDecoration: "none",
  display: "inline-block",
};

const hr: CSSProperties = {
  borderColor: "#E0D8C9",
  margin: "24px 0",
};

const footer: CSSProperties = {
  textAlign: "center",
};

const footerText: CSSProperties = {
  fontSize: "12px",
  letterSpacing: "0.04em",
  color: "#5A6470",
  margin: "2px 0",
};

const footerSmall: CSSProperties = {
  fontSize: "11px",
  color: "#5A6470",
  margin: "12px 0 0 0",
};

const unsubscribeLink: CSSProperties = {
  color: "#5A6470",
  textDecoration: "underline",
};
