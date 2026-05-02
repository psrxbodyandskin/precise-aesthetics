import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";

// /terms is rendered in the same document register as /about and /privacy:
// bone-100 single-surface, oversized Fraunces display, 0.18em literal eyebrow
// tracking (intentional document-register override of --tracking-overline).
//
// Legal-copy divergences from MASTER.md (intentional, do not "fix"):
// 1. Trademark ™ symbols are preserved verbatim from the source draft. /about
//    omits ™ because it's editorial prose; legal documents require the marks.
// 2. ALL CAPS in §11 (Disclaimers) and §12 (Limitation of Liability) is
//    preserved verbatim per legal convention (UCC §2-316 conspicuousness).
//    No overline tracking is applied. BRAND-IDENTITY's "ALL CAPS reserved for
//    overlines" rule is overridden here because the caps are part of the
//    legal text, not a stylistic choice.
// 3. Section numbering uses Arabic ("1.", "2.") not Roman ("I.", "II.") —
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
  title: "Terms of Service — Precise Aesthetics",
  description:
    "The terms governing access to and use of preciseaesthetics.com.",
  alternates: { canonical: `${SITE.url}/terms` },
  openGraph: {
    title: "Terms of Service — Precise Aesthetics",
    description: "The terms governing access to and use of preciseaesthetics.com.",
    url: `${SITE.url}/terms`,
    siteName: SITE.name,
    type: "article",
  },
  robots: { index: true, follow: true },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default function TermsPage() {
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
            § Terms of Service
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
            Terms of Service
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
                <Placeholder note="INSERT EFFECTIVE DATE — typically the launch date or first publication date" />
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
            Welcome to the website of PS Medical Aesthetics, LLC
            (&ldquo;Precise Aesthetics,&rdquo; &ldquo;the Company,&rdquo;
            &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), an
            Illinois limited liability company. These Terms of Service
            (&ldquo;Terms&rdquo;) govern your access to and use of
            preciseaesthetics.com (the &ldquo;Site&rdquo;) and any services,
            content, or features made available through the Site
            (collectively, the &ldquo;Services&rdquo;).
          </Paragraph>
          <Paragraph>
            By accessing or using the Site, you agree to be bound by these
            Terms. If you do not agree to these Terms, you may not access or
            use the Site.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — confirm entity name and Illinois registration; verify scope of "Services" definition */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 2 */}
        <DocumentSection numeral="2." title="Eligibility and Intended Audience">
          <Paragraph>
            The Site is intended for use by licensed medical and aesthetic
            practitioners and authorized representatives of clinical practices
            considering or using The Precise System&trade; (&ldquo;the
            System&rdquo;). The Site is not intended for use by:
          </Paragraph>
          <BulletList
            items={[
              "Individuals under 18 years of age",
              "Patients seeking medical advice or treatment recommendations",
              "Consumers purchasing medical devices for personal use",
            ]}
          />
          <Paragraph>
            Information presented on the Site is intended for educational and
            informational purposes related to the Company&rsquo;s clinical
            technology offerings. Nothing on the Site constitutes medical
            advice or a recommendation to undergo any specific treatment.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — verify FDA-compliant language regarding professional vs consumer audience for Class 4 laser device marketing */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 3 */}
        <DocumentSection numeral="3." title="Not Medical Advice">
          <Paragraph>
            The Site provides information about clinical technology, treatment
            protocols, and aesthetic dermatology. This information:
          </Paragraph>
          <BulletList
            items={[
              "Is provided for educational purposes only",
              "Does not constitute medical, dermatologic, or other professional health advice",
              "Is not a substitute for diagnosis, treatment, or professional clinical judgment",
              "Should not be relied upon for treatment decisions for any individual patient",
            ]}
          />
          <Paragraph>
            Any treatment using The Precise System or any product affiliated
            with the Company must be administered by a licensed practitioner
            exercising independent clinical judgment.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — medical device disclaimer language varies by jurisdiction */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 4 */}
        <DocumentSection numeral="4." title="FDA and Regulatory Status">
          <Paragraph>
            The Precise Pico&trade; device referenced on the Site is a medical
            device subject to U.S. Food and Drug Administration (FDA)
            regulation. Any references to clinical performance, indications,
            or specifications reflect the Company&rsquo;s current understanding
            of the device, which may be subject to change pending regulatory
            review and clearance.
          </Paragraph>
          {/* Conditional cue rendered verbatim per Session 10 ambiguity A: user
              decides at review time whether the device is cleared. */}
          <Paragraph>
            <Placeholder note="IF DEVICE IS NOT YET FDA CLEARED, INCLUDE: The Precise Pico™ is not yet cleared for commercial distribution by the FDA. References to the device on this Site are for pre-launch informational purposes only and do not constitute an offer for sale or distribution in any jurisdiction where such offer would be unlawful." />
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — confirm FDA 510(k) status before launch; calibrate language exactly to current regulatory posture */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 5 */}
        <DocumentSection
          numeral="5."
          title="Account Registration and Practitioner Portal"
        >
          <Paragraph>
            Certain Services may require you to register an account or access
            a practitioner portal. By registering, you agree to:
          </Paragraph>
          <BulletList
            items={[
              "Provide accurate, current, and complete information",
              "Maintain and promptly update your information as needed",
              "Maintain the security and confidentiality of your account credentials",
              "Notify us immediately of any unauthorized access to or use of your account",
              "Accept responsibility for all activities that occur under your account",
            ]}
          />
          <Paragraph>
            We reserve the right to suspend or terminate accounts that violate
            these Terms or that we determine, in our sole discretion, pose a
            risk to the Site, Services, or other users.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — when practitioner portal launches, expand this section with portal-specific terms */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 6 */}
        <DocumentSection numeral="6." title="Demo Requests and Inquiries">
          <Paragraph>
            When you submit a demonstration request or other inquiry through
            the Site, you authorize the Company to contact you using the
            information you provide. Submission of an inquiry does not create
            a binding agreement between you and the Company. All commercial
            transactions are governed by separate written agreements between
            the Company and the practitioner or practice.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — define separation between Site terms and commercial purchase agreements */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 7 */}
        <DocumentSection numeral="7." title="Intellectual Property">
          <Paragraph>
            All content on the Site &mdash; including text, graphics, logos,
            images, audio clips, video, data compilations, software, and the
            selection and arrangement thereof &mdash; is the property of PS
            Medical Aesthetics, LLC or its licensors and is protected by
            United States and international copyright, trademark, and other
            intellectual property laws.
          </Paragraph>
          <Paragraph>
            The following are trademarks of PS Medical Aesthetics, LLC:
          </Paragraph>
          <BulletList
            items={[
              "Precise Aesthetics™",
              "The Precise System™",
              "Precise Pico™",
              "PIH Prevention Protocol™",
            ]}
          />
          <Paragraph>
            You may not reproduce, distribute, modify, create derivative works
            from, publicly display, publicly perform, republish, download,
            store, or transmit any content from the Site without our prior
            written consent, except for personal, non-commercial use that does
            not involve duplication or distribution.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — confirm all trademark filings are current; add registered ® symbols where applicable post-registration */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 8 */}
        <DocumentSection numeral="8." title="User Submissions and Feedback">
          <Paragraph>
            Any feedback, suggestions, ideas, or other submissions you make to
            the Site or send to the Company become the non-confidential
            property of the Company. You grant us a perpetual, irrevocable,
            worldwide, royalty-free license to use, reproduce, modify, publish,
            and distribute such submissions for any purpose without
            compensation to you.
          </Paragraph>
          <Paragraph>
            You agree not to submit any content that is unlawful, infringing,
            defamatory, harassing, or otherwise objectionable.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — UGC license scope, especially for clinical case discussion */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 9 */}
        <DocumentSection numeral="9." title="Privacy">
          <Paragraph>
            Your use of the Site is also governed by our{" "}
            <Link
              href="/privacy"
              className="text-brand-700 underline-offset-[3px] decoration-1 transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
            >
              Privacy Policy
            </Link>
            , which is incorporated into these Terms by reference. Please
            review the Privacy Policy to understand our practices.
          </Paragraph>
        </DocumentSection>

        <SectionDivider />

        {/* Section 10 */}
        <DocumentSection numeral="10." title="Third-Party Services">
          <Paragraph>
            The Site may contain links to or integrations with third-party
            websites, services, and platforms (including but not limited to
            Resend for email delivery, Supabase for data storage, PostHog for
            analytics, Cal.com for scheduling, and Vercel for hosting). The
            Company is not responsible for the content, privacy practices, or
            terms of service of any third-party services. Your use of
            third-party services is at your own risk and subject to the third
            party&rsquo;s own terms.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — list of subprocessors should be kept current; consider linking to a separate Subprocessors page */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 11 — ALL CAPS preserved verbatim per legal convention.
            Do NOT apply overline tracking; this is body copy in caps, not an
            overline label. */}
        <DocumentSection numeral="11." title="Disclaimers">
          <Paragraph>
            THE SITE AND SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND
            &ldquo;AS AVAILABLE,&rdquo; WITHOUT WARRANTY OF ANY KIND, EITHER
            EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT,
            AND ANY WARRANTIES ARISING FROM A COURSE OF DEALING, USAGE, OR
            TRADE PRACTICE.
          </Paragraph>
          <Paragraph>THE COMPANY DOES NOT WARRANT THAT:</Paragraph>
          <BulletList
            items={[
              "THE SITE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE",
              "ANY DEFECTS WILL BE CORRECTED",
              "THE SITE OR ANY SERVER MAKING IT AVAILABLE IS FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS",
              "THE INFORMATION ON THE SITE IS ACCURATE, COMPLETE, OR CURRENT",
            ]}
          />
          {/* LEGAL REVIEW REQUIRED — disclaimer language varies by state; Illinois consumer protection statutes may modify enforceability */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 12 — ALL CAPS preserved verbatim. Do NOT apply tracking. */}
        <DocumentSection numeral="12." title="Limitation of Liability">
          <Paragraph>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
            WILL THE COMPANY, ITS AFFILIATES, OR THEIR RESPECTIVE OFFICERS,
            DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING
            OUT OF OR RELATED TO YOUR USE OF THE SITE OR SERVICES, REGARDLESS
            OF THE LEGAL THEORY AND EVEN IF THE COMPANY HAS BEEN ADVISED OF
            THE POSSIBILITY OF SUCH DAMAGES.
          </Paragraph>
          <Paragraph>
            THE COMPANY&rsquo;S TOTAL LIABILITY ARISING OUT OF OR RELATED TO
            THESE TERMS WILL NOT EXCEED ONE HUNDRED DOLLARS ($100) OR THE
            AMOUNT YOU HAVE PAID TO THE COMPANY IN THE SIX MONTHS PRECEDING
            THE EVENT GIVING RISE TO LIABILITY, WHICHEVER IS GREATER.
          </Paragraph>
          <Paragraph>
            NOTHING IN THIS SECTION LIMITS LIABILITY THAT CANNOT BE LIMITED
            UNDER APPLICABLE LAW.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — Illinois courts have specific rules on liability caps for consumer transactions; medical device liability may not be limitable */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 13 */}
        <DocumentSection numeral="13." title="Indemnification">
          <Paragraph>
            You agree to indemnify, defend, and hold harmless the Company and
            its affiliates, officers, directors, employees, and agents from
            and against any claims, liabilities, damages, losses, and
            expenses, including reasonable attorneys&rsquo; fees, arising out
            of or in any way connected with:
          </Paragraph>
          <BulletList
            items={[
              "Your access to or use of the Site or Services",
              "Your violation of these Terms",
              "Your violation of any third-party right, including intellectual property or privacy rights",
              "Any content you submit to the Site",
            ]}
          />
          {/* LEGAL REVIEW REQUIRED — indemnification scope and applicability for B2B versus consumer users */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 14 */}
        <DocumentSection
          numeral="14."
          title="Governing Law and Dispute Resolution"
        >
          <Paragraph>
            These Terms are governed by and construed in accordance with the
            laws of the State of Illinois, without regard to its conflict of
            law provisions. You agree that any legal action or proceeding
            arising out of or related to these Terms or the Site shall be
            brought exclusively in the state or federal courts located in
            Cook County, Illinois, and you consent to the personal
            jurisdiction of such courts.
          </Paragraph>
          {/* LEGAL REVIEW REQUIRED — consider whether arbitration clause is appropriate; review forum selection clause enforceability for B2B vs consumer disputes */}
        </DocumentSection>

        <SectionDivider />

        {/* Section 15 */}
        <DocumentSection numeral="15." title="Changes to These Terms">
          <Paragraph>
            We may update these Terms from time to time. When we do, we will
            revise the &ldquo;Last Updated&rdquo; date above. Your continued
            use of the Site after any changes indicates your acceptance of the
            updated Terms. For material changes, we may provide additional
            notice such as email notification or a prominent notice on the
            Site.
          </Paragraph>
        </DocumentSection>

        <SectionDivider />

        {/* Section 16 */}
        <DocumentSection numeral="16." title="Severability">
          <Paragraph>
            If any provision of these Terms is found to be invalid or
            unenforceable, the remaining provisions will remain in full force
            and effect.
          </Paragraph>
        </DocumentSection>

        <SectionDivider />

        {/* Section 17 */}
        <DocumentSection numeral="17." title="Entire Agreement">
          <Paragraph>
            These Terms, together with our Privacy Policy and any other
            policies or agreements referenced herein, constitute the entire
            agreement between you and the Company regarding your use of the
            Site and supersede all prior agreements and understandings.
          </Paragraph>
        </DocumentSection>

        <SectionDivider />

        {/* Section 18 */}
        <DocumentSection numeral="18." title="Contact">
          <Paragraph>
            For questions about these Terms, contact us at:
          </Paragraph>
          <address className="not-italic mt-[1.2em] font-body text-ink-700">
            PS Medical Aesthetics, LLC
            <br />
            <Placeholder note="INSERT REGISTERED BUSINESS ADDRESS — required in Illinois" />
            <br />
            Email:{" "}
            <Placeholder note="INSERT LEGAL CONTACT EMAIL — typically legal@ or support@" />
          </address>
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
              { label: "Privacy Policy", href: "/privacy" },
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

function BulletList({ items }: { items: ReadonlyArray<string> }) {
  return (
    <ul className="mt-[1.2em] space-y-2 pl-6 list-disc marker:text-ink-300">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

// Renders [INSERT ...] cues from the source draft so the user can see what
// needs filling in before publication. The square brackets are preserved
// verbatim; the italic + ink-500 distinguishes the cue from body copy.
function Placeholder({ note }: { note: string }) {
  return (
    <span className="font-body italic text-ink-500">[{note}]</span>
  );
}
