import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";

// /privacy is rendered in the same document register as /about and /terms:
// bone-100 single-surface, oversized Fraunces display, 0.18em literal eyebrow
// tracking (intentional document-register override of --tracking-overline).
//
// Legal-copy divergences from MASTER.md (intentional, do not "fix"):
// 1. Trademark ™ symbols are preserved verbatim from the source draft. /about
//    omits ™ because it's editorial prose; legal documents require the marks.
// 2. Section numbering uses Arabic ("1.", "2.") not Roman ("I.", "II.") —
//    section numbers are part of the legal text people cite.
//
// Placeholder + review-flag handling:
// - `[INSERT ...]` cues from the draft are rendered visibly via <Placeholder>
//   so the user knows what to fill in before publication.
// - `[LEGAL REVIEW REQUIRED ...]` flags from the draft are preserved as JSX
//   comments only — visible in source for future devs, hidden from the public
//   page so it doesn't read as a self-disclaimer.

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Privacy Policy — Precise Aesthetics",
  description:
    "How Precise Aesthetics collects, uses, and protects personal information.",
  alternates: { canonical: `${SITE.url}/privacy` },
  openGraph: {
    title: "Privacy Policy — Precise Aesthetics",
    description:
      "How Precise Aesthetics collects, uses, and protects personal information.",
    url: `${SITE.url}/privacy`,
    siteName: SITE.name,
    type: "article",
  },
  robots: { index: true, follow: true },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default function PrivacyPage() {
  return (
    <div className="bg-bone-100 pt-24 md:pt-28">
      <article className="relative mx-auto max-w-[680px] px-6 py-20 md:px-12 md:py-32">
        {/* Top page hairline */}
        <div
          aria-hidden="true"
          className="mb-16 flex justify-center md:mb-24"
        >
          <span className="block h-px w-[60px] bg-brand-500/50" />
        </div>

        {/* Page title block */}
        <header>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            § Privacy Policy
          </p>
          <h1
            className="mt-10 font-display text-ink-900"
            style={{
              fontSize: "clamp(3rem, 5vw + 1rem, 6rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            Privacy Policy
          </h1>

          {/* Effective Date / Last Updated — small two-line block under title */}
          <dl className="mt-12 space-y-2 font-body text-small text-ink-700">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <dt
                className="font-medium uppercase text-ink-500"
                style={{ ...EYEBROW_TRACKING, fontSize: "0.75rem" }}
              >
                Effective Date
              </dt>
              <dd>
                <Placeholder note="INSERT EFFECTIVE DATE" />
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <dt
                className="font-medium uppercase text-ink-500"
                style={{ ...EYEBROW_TRACKING, fontSize: "0.75rem" }}
              >
                Last Updated
              </dt>
              <dd>
                <Placeholder note="INSERT DATE" />
              </dd>
            </div>
          </dl>
        </header>

        <SectionDivider />

        {/* Section 1 */}
        <DocumentSection numeral="1." title="Introduction">
          <Paragraph>
            PS Medical Aesthetics, LLC (&ldquo;Precise Aesthetics,&rdquo;
            &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects
            your privacy. This Privacy Policy explains how we collect, use,
            disclose, and protect personal information when you visit
            preciseaesthetics.com (the &ldquo;Site&rdquo;) or interact with
            our Services.
          </Paragraph>
          <Paragraph>This Policy applies to information we collect:</Paragraph>
          <BulletList
            items={[
              "On the Site",
              "Through email and other electronic communications between you and the Company",
              "When you submit forms, including demonstration requests, contact inquiries, and email subscriptions",
              "Through cookies and similar tracking technologies described below",
            ]}
          />
          <Paragraph>
            This Policy does not apply to information collected by us offline
            or through any other means, including any third-party websites
            that may link to or be linked from the Site.
          </Paragraph>
        </DocumentSection>

        <SectionDivider />

        {/* Section 2 */}
        <DocumentSection numeral="2." title="Information We Collect">
          <Paragraph>
            We collect several categories of personal information:
          </Paragraph>

          <SubHeading>Information you provide directly:</SubHeading>
          <BulletList
            items={[
              "Contact information: name, email address, phone number, organization or practice name",
              "Professional information: role, practice type, state of practice, current devices used",
              "Inquiry content: subject lines, messages, demonstration requests, comments",
              "Account credentials (when practitioner portal launches): username, password, professional credentials",
              "Marketing preferences: interest categories, opt-in/opt-out selections",
            ]}
          />

          <SubHeading>Information collected automatically:</SubHeading>
          <BulletList
            items={[
              "Device and browser information: IP address, browser type, operating system, device identifiers",
              "Usage information: pages visited, time spent, links clicked, referring URLs",
              "Geolocation: approximate location based on IP address (city/region level)",
              "UTM parameters: campaign source, medium, campaign name (for marketing attribution)",
            ]}
          />

          <SubHeading>Information from third parties:</SubHeading>
          <BulletList
            items={[
              "Email engagement data from our email service provider (Resend)",
              "Analytics data from PostHog",
              "Authentication data from any future identity provider integrations",
            ]}
          />
        </DocumentSection>

        <SectionDivider />

        {/* Section 3 */}
        <DocumentSection numeral="3." title="How We Use Information">
          <Paragraph>
            We use personal information for the following purposes:
          </Paragraph>
          <BulletList
            items={[
              "To respond to inquiries and provide requested information",
              "To schedule and conduct demonstrations of our products and services",
              "To communicate updates about The Precise System, launch events, and product availability",
              "To administer accounts and provide access to the practitioner portal (when launched)",
              "To improve the Site, our products, and our marketing",
              "To comply with legal obligations and enforce our Terms of Service",
              "To prevent fraud, abuse, and unauthorized access",
              "To analyze usage patterns and aggregate metrics",
            ]}
          />
          {/* LEGAL REVIEW REQUIRED — purpose specificity required under GDPR Article 5; CCPA requires disclosure of "business purpose" for each category */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 4 */}
        <DocumentSection
          numeral="4."
          title="Cookies and Tracking Technologies"
        >
          <Paragraph>
            We use cookies, web beacons, pixel tags, and similar technologies
            to:
          </Paragraph>
          <BulletList
            items={[
              "Maintain your session and preferences",
              "Analyze how the Site is used (via PostHog)",
              "Measure marketing effectiveness",
              "Detect and prevent abuse",
            ]}
          />
          <Paragraph>
            Most browsers allow you to refuse cookies or to alert you when
            cookies are being sent. If you choose to disable cookies, some
            features of the Site may not function properly.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — implement cookie consent banner per GDPR/CCPA/CPRA; document specific cookies in a separate cookie disclosure if EU traffic is significant */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 5 */}
        <DocumentSection numeral="5." title="How We Share Information">
          <Paragraph>
            We do not sell your personal information. We may share personal
            information with:
          </Paragraph>

          <SubHeading>Service providers:</SubHeading>
          <Paragraph>
            Third-party vendors who perform services on our behalf, including:
          </Paragraph>
          <BulletList
            items={[
              "Resend (email delivery)",
              "Supabase (database hosting)",
              "Vercel (web hosting)",
              "PostHog (product analytics)",
              "Cal.com (demonstration scheduling, when integrated)",
            ]}
          />
          <Paragraph>
            These service providers are bound by contractual obligations to
            protect your information and use it only for the purposes for
            which it was disclosed.
          </Paragraph>

          <SubHeading>Legal compliance:</SubHeading>
          <Paragraph>
            When required by law, regulation, legal process, or governmental
            request, including in response to subpoenas, court orders, or law
            enforcement requests.
          </Paragraph>

          <SubHeading>Business transfers:</SubHeading>
          <Paragraph>
            In the event of a merger, acquisition, sale of assets, or similar
            transaction, your information may be transferred to the acquiring
            entity, subject to applicable law.
          </Paragraph>

          <SubHeading>With your consent:</SubHeading>
          <Paragraph>
            Any other purpose disclosed at the time of collection or with your
            express permission.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — confirm data processing agreements (DPAs) are in place with each subprocessor; CCPA-compliant "do not sell" language */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 6 */}
        <DocumentSection numeral="6." title="Data Retention">
          <Paragraph>
            We retain personal information for as long as necessary to fulfill
            the purposes outlined in this Policy, unless a longer retention
            period is required or permitted by law. Specifically:
          </Paragraph>
          <BulletList
            items={[
              "Demonstration request data: retained for the duration of the practitioner relationship plus 7 years",
              "Contact form submissions: retained for 3 years",
              "Marketing email lists: retained until unsubscribed plus 1 year",
              "Account information: retained while account is active plus 7 years following account closure",
              "Usage and analytics data: retained for 24 months in identifiable form",
            ]}
          />
          {/* LEGAL REVIEW REQUIRED — retention periods should align with statute of limitations for medical device liability in Illinois and other applicable jurisdictions */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 7 */}
        <DocumentSection numeral="7." title="Your Rights and Choices">
          <Paragraph>
            Depending on your jurisdiction, you may have certain rights
            regarding your personal information:
          </Paragraph>

          <SubHeading>For all users:</SubHeading>
          <BulletList
            items={[
              "Right to know what personal information we collect",
              "Right to access your personal information",
              "Right to correct inaccurate information",
              "Right to delete your information (subject to retention obligations)",
              "Right to opt out of marketing communications",
            ]}
          />

          <SubHeading>For California residents (CCPA/CPRA):</SubHeading>
          <BulletList
            items={[
              "Right to know categories of personal information collected, sold, or disclosed",
              "Right to deletion (subject to exceptions)",
              "Right to correct inaccurate personal information",
              "Right to opt out of “sale” or “sharing” of personal information (we do not sell)",
              "Right to limit use of sensitive personal information",
              "Right to non-discrimination for exercising your rights",
            ]}
          />

          <SubHeading>
            For European Economic Area, UK, and Switzerland residents
            (GDPR/UK GDPR):
          </SubHeading>
          <BulletList
            items={[
              "Right of access",
              "Right to rectification",
              "Right to erasure (“right to be forgotten”)",
              "Right to restriction of processing",
              "Right to data portability",
              "Right to object",
              "Right not to be subject to automated decision-making",
              "Right to lodge a complaint with a supervisory authority",
            ]}
          />

          <SubHeading>For Illinois residents:</SubHeading>
          <BulletList
            items={[
              "Rights under the Illinois Personal Information Protection Act (PIPA)",
              "Rights under the Illinois Biometric Information Privacy Act (BIPA), if applicable",
            ]}
          />

          <Paragraph>
            To exercise any of these rights, contact us using the information
            in the Contact section below. We will respond within the
            timeframes required by applicable law (typically 30&ndash;45 days).
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — implement DSAR (Data Subject Access Request) workflow; verify response timeframes against each applicable law; consider Verifiable Consumer Request process for CCPA */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 8 */}
        <DocumentSection
          numeral="8."
          title="Illinois Biometric Information Privacy Act (BIPA)"
        >
          <Paragraph>
            We do not currently collect biometric identifiers or biometric
            information as defined under the Illinois Biometric Information
            Privacy Act, 740 ILCS 14 (&ldquo;BIPA&rdquo;). This includes:
          </Paragraph>
          <BulletList
            items={[
              "Retina or iris scans",
              "Fingerprints",
              "Voiceprints",
              "Scans of hand or face geometry",
            ]}
          />
          <Paragraph>
            If we begin to collect such information in the future (for
            example, in connection with practitioner identity verification or
            patient outcome tracking), we will:
          </Paragraph>
          <BulletList
            items={[
              "Provide written notice to data subjects",
              "Obtain written consent before collection",
              "Disclose the purpose and duration of collection, storage, and use",
              "Maintain a publicly available retention and destruction schedule",
              "Implement reasonable safeguards",
            ]}
          />
          {/* LEGAL REVIEW REQUIRED — BIPA is one of the most strictly enforced privacy statutes in the U.S. with statutory damages of $1,000-$5,000 per violation. If any biometric data is collected (including potentially through future portal features, treatment outcome tracking with photographs, or device authentication), full BIPA compliance is required and a separate written BIPA notice and consent flow must be implemented. */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 9 */}
        <DocumentSection
          numeral="9."
          title="Health Information and HIPAA"
        >
          <Paragraph>
            The Site itself is not a covered entity or business associate
            under the Health Insurance Portability and Accountability Act
            (HIPAA). The Site collects business contact information from
            practitioners, not protected health information (PHI) of patients.
          </Paragraph>
          <Paragraph>
            However, when practitioners use The Precise System and the
            practitioner portal in clinical settings:
          </Paragraph>
          <BulletList
            items={[
              "Patient data logged through the practitioner portal is treated as Protected Health Information (PHI)",
              "All such data is de-identified at the point of capture before flowing into the Data Intelligence Layer",
              "The Company implements administrative, physical, and technical safeguards consistent with HIPAA Security Rule standards",
              "Practitioner-facing portal terms include a Business Associate Agreement (BAA) where applicable",
            ]}
          />
          {/* LEGAL REVIEW REQUIRED — when practitioner portal launches with patient data logging, full HIPAA assessment required: Privacy Rule, Security Rule, Breach Notification Rule. Determine BAA status with each subprocessor handling PHI. Most consumer marketing site activity does not trigger HIPAA, but the portal will. */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 10 */}
        <DocumentSection numeral="10." title="Children's Privacy">
          <Paragraph>
            The Site is not directed to children under 13, and we do not
            knowingly collect personal information from children under 13. If
            we learn we have collected information from a child under 13, we
            will delete it. If you believe a child has provided us with
            personal information, contact us using the information below.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — COPPA compliance; consider also age 16 threshold under GDPR for EEA users */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 11 */}
        <DocumentSection numeral="11." title="Data Security">
          <Paragraph>
            We implement reasonable administrative, physical, and technical
            safeguards designed to protect personal information from
            unauthorized access, disclosure, alteration, and destruction.
            However, no system is completely secure. We cannot guarantee the
            absolute security of your information.
          </Paragraph>
          <Paragraph>
            In the event of a data breach involving personal information, we
            will provide notification as required by applicable law, including
            the Illinois Personal Information Protection Act and other state
            breach notification statutes.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — implement formal incident response plan; document specific safeguards (encryption at rest/in transit, access controls, audit logs); align breach notification timing with each applicable state's requirements */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 12 */}
        <DocumentSection numeral="12." title="International Data Transfers">
          <Paragraph>
            The Site is operated from the United States. If you access the
            Site from outside the United States, your personal information may
            be transferred to, stored, and processed in the United States. The
            data protection laws of the United States may differ from those
            of your country.
          </Paragraph>
          <Paragraph>
            For users in the European Economic Area, United Kingdom, or
            Switzerland, we rely on Standard Contractual Clauses or other
            appropriate transfer mechanisms approved under applicable law.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — implement Standard Contractual Clauses for EU/UK transfers; consider Data Privacy Framework certification for U.S. organizations receiving EU personal data */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 13 */}
        <DocumentSection numeral="13." title="Third-Party Links">
          <Paragraph>
            The Site may contain links to third-party websites. We are not
            responsible for the privacy practices of those websites. We
            encourage you to review the privacy policies of any third-party
            site you visit.
          </Paragraph>
        </DocumentSection>

        <SectionDivider />

        {/* Section 14 */}
        <DocumentSection numeral="14." title="Changes to This Policy">
          <Paragraph>
            We may update this Privacy Policy from time to time. When we do,
            we will revise the &ldquo;Last Updated&rdquo; date. For material
            changes, we will provide additional notice such as email
            notification or a prominent notice on the Site. Your continued
            use of the Site after the effective date of any changes indicates
            your acceptance of the updated Policy.
          </Paragraph>
        </DocumentSection>

        <SectionDivider />

        {/* Section 15 */}
        <DocumentSection numeral="15." title="Contact Us">
          <Paragraph>
            For questions about this Privacy Policy or to exercise your
            rights, contact us at:
          </Paragraph>
          <address className="not-italic mt-[1.2em] font-body text-ink-700">
            PS Medical Aesthetics, LLC
            <br />
            Attn: Privacy Officer
            <br />
            <Placeholder note="INSERT REGISTERED BUSINESS ADDRESS" />
            <br />
            Email:{" "}
            <Placeholder note="INSERT PRIVACY CONTACT EMAIL — typically privacy@ or legal@" />
          </address>
          {/* LEGAL REVIEW REQUIRED — designate a Privacy Officer or Data Protection Officer (DPO) if required by GDPR; establish DSAR workflow with response time tracking */}
        </DocumentSection>

        <SectionDivider />

        {/* End of document — quiet footer with two text links */}
        <footer className="mt-16 flex flex-col items-center text-center">
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            § End of document
          </p>
          <ul
            role="list"
            className="mt-10 flex flex-col items-center gap-6 md:flex-row md:gap-12"
          >
            {[
              { label: "Terms of Service", href: "/terms" },
              { label: "Home", href: "/" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-body text-[14px] leading-body text-ink-700 transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
                >
                  {link.label} <span aria-hidden="true">&rarr;</span>
                </Link>
              </li>
            ))}
          </ul>
        </footer>

        {/* Bottom page hairline */}
        <div
          aria-hidden="true"
          className="mt-16 flex justify-center md:mt-24"
        >
          <span className="block h-px w-[60px] bg-brand-500/50" />
        </div>
      </article>
    </div>
  );
}

// — Internal helpers — kept inline; no new exported primitives.

function SectionDivider() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center py-12 md:py-16"
    >
      <span className="block h-px w-[60px] bg-brand-500/50" />
    </div>
  );
}

function DocumentSection({
  numeral,
  title,
  children,
}: {
  numeral: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {numeral}
      </p>
      <h2
        className="mt-3 font-display text-ink-900"
        style={{
          fontSize: "clamp(1.5rem, 0.75vw + 1rem, 1.875rem)",
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          fontWeight: 500,
        }}
      >
        {title}
      </h2>
      <div
        className="mt-8 font-body text-ink-700"
        style={{
          fontSize: "clamp(1.0625rem, 0.5vw + 0.875rem, 1.1875rem)",
          lineHeight: 1.7,
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="mt-[1.2em] first:mt-0">{children}</p>;
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-[1.4em] mb-[0.4em] font-body font-medium text-ink-900">
      {children}
    </p>
  );
}

function BulletList({ items }: { items: ReadonlyArray<string> }) {
  return (
    <ul className="mt-[0.8em] space-y-2 pl-6 list-disc marker:text-ink-300">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Placeholder({ note }: { note: string }) {
  return (
    <span className="font-body italic text-ink-500">[{note}]</span>
  );
}
