# Session 4 — Teaser Landing Page + Lead Capture

> Run from repo root after Session 3 is approved. This session ships to production.

## Context

You have already read `CLAUDE.md`, `design-system/MASTER.md`, `design-system/BRAND-IDENTITY.md`, `design-system/COPY-DECK.md`, and the design-system primitives from Session 3 are committed.

This session ships **the first production-facing artifact**: a single-page teaser at `preciseaesthetics.com` that captures email leads from interested practitioners until the full site lands. Every day this is live = warm leads collected before launch.

## Goal

A single, beautiful teaser page at `/` that:
- States the brand promise
- Names the launch (Aug 8, 2026, Civic Opera Building)
- Captures email + practice info via a lead form
- Sends a Resend welcome email on submission
- Writes to the Supabase `leads` table
- Tracks the submission in PostHog
- Ships to production at `preciseaesthetics.com`

This is **not** the final homepage. It's a polished, simple, single-purpose page that exists until the full homepage lands in Session 5.

---

## Critical Constraints

- **Use COPY-DECK.md verbatim** for all marketing copy. Do not paraphrase.
- **Use Session 3 primitives** (`<Section>`, `<DisplayHeading>`, `<Lead>`, `<Eyebrow>`, `<Button>`, `<Logo>`). Do not duplicate primitive logic.
- **No Stripe.** No payments. No e-commerce.
- Mobile-first, responsive, Lighthouse 95+.
- Real Resend integration. Real Supabase write. PostHog event tracked.
- Production-ready: meta tags, OG image, sitemap entry, robots.txt allow.

---

## Part 1 — The Teaser Page

### File: `/app/(marketing)/page.tsx`

Replace the smoke-test placeholder from Session 1 with this.

**Page structure (top to bottom):**

#### Section 1 — Hero (`tone="midnight-deep"`, `size="hero"`)

```
[Eyebrow]  LAUNCHING AUGUST 8, 2026 · CIVIC OPERA BUILDING · CHICAGO

[DisplayHeading xl]
Predictable outcomes
across every skin type.

[Lead]
The Precise System pairs a multi-wavelength pico laser with the
PIH Prevention Protocol™, biologic control, and a data intelligence
layer that refines outcomes over time.

[Buttons row]
- Primary CTA: "Get launch updates" (scrolls to lead form section)
- Secondary CTA: "Request an invitation" (scrolls to launch section)
```

CTA scrolls smoothly to the relevant section anchor. Use native CSS `scroll-behavior: smooth` on `<html>` (already in MASTER.md ideally; if not, add via globals.css). Honor `prefers-reduced-motion` — disable smooth scroll for users who request reduced motion.

#### Section 2 — Thesis (`tone="bone"`, `size="default"`)

```
[Eyebrow]  WHY THE SYSTEM EXISTS

[DisplayHeading md]
Built for the patients the industry
has historically struggled to treat.

[BodyText]
Most pico systems were optimized for the easiest cases. The Precise
System was engineered for Fitzpatrick IV, V, and VI — where
post-inflammatory hyperpigmentation, complication risk, and protocol
inconsistency have made laser dermatology unreliable. We changed
the inputs. The outcomes followed.
```

Use `containerWidth="prose"` for readability.

#### Section 3 — Lead Capture (`tone="bone"`, `size="default"`, `id="updates"`)

```
[Eyebrow]  STAY INFORMED

[Heading level=2]
Get launch updates.

[Lead]
For practitioners who want first access to demo scheduling and
launch event invitations.

[LeadForm component]
```

This section is the primary conversion of this teaser page.

#### Section 4 — Launch (`tone="midnight"`, `size="default"`, `id="launch"`)

```
[Eyebrow]  BY INVITATION

[DisplayHeading md]
The Precise System launches
August 8, 2026.

[Lead]
An evening of clinical demonstrations and conversation at the Civic
Opera Building, Chicago. Attendance is by invitation only.

[Button primary-on-dark]: "Request an invitation"
```

Button does the same scroll-to-form behavior as the hero secondary CTA — the form captures interest type via a checkbox or hidden field marking the lead as "launch event interest."

#### Section 5 — Closing (`tone="midnight-deep"`, `size="compact"`)

Single line, centered:
```
[DisplayHeading md, italic-or-Fraunces-distinct] (use Fraunces, normal weight)
Skin of every shade.
```

Wide letter-spacing if needed for premium feel. Use `containerWidth="narrow"`.

---

## Part 2 — Lead Form Component

### File: `/components/forms/LeadForm.tsx`

Client component. Uses React Hook Form + Zod.

**Fields:**

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| First name | text | yes | min 1, max 60 |
| Last name | text | yes | min 1, max 60 |
| Email | email | yes | RFC email pattern |
| Practice name | text | yes | min 1, max 120 |
| Role | select | yes | enum: "physician", "aprn", "pa", "rn", "owner", "other" |
| Interest | checkbox group | optional | enum array: "demo", "launch_event", "press" |
| Source | hidden | yes | "teaser" |

**Zod schema** lives at `/lib/schemas/lead-form.ts` so the API route can reuse it for server-side validation:

```ts
import { z } from "zod";

export const leadFormSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email().max(254),
  practiceName: z.string().min(1).max(120),
  role: z.enum(["physician", "aprn", "pa", "rn", "owner", "other"]),
  interest: z.array(z.enum(["demo", "launch_event", "press"])).default([]),
  source: z.literal("teaser").default("teaser"),
  utm: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
  }).optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
```

**UX behavior:**

- Label every field clearly. Use `<Label>` from shadcn (already installed).
- Inline validation on blur, error message in `error` color from MASTER.md.
- Submit button: primary variant, `loading` state on submit, disables during submission.
- After successful submit:
  - Form replaced with a success state in-place
  - Success copy: "Thanks. You'll hear from us as the launch approaches." (small, calm — no exclamation)
  - Optional: a small `<Eyebrow>` above saying "CONFIRMED"
  - A subtle 2-second fade-in for the success state, only if `prefers-reduced-motion` is not set
- On error: toast via Sonner with neutral, helpful copy ("Something went wrong. Please try again.")
- Capture UTM params from URL on mount, pass with submission

**Accessibility:**
- Every field labeled (visible, not just placeholder)
- Errors associated via `aria-describedby` and `aria-invalid`
- Submit button has visible `aria-busy` during submission
- Success state announced via `aria-live="polite"` region

**Form layout:**
- Single column on mobile
- 2-column grid for first/last name on tablet+
- Practice name and role: full width
- Interest checkboxes: rendered as checkbox group with helper text "Select all that apply (optional)"
- Submit button: full width on mobile, auto on desktop, right-aligned

---

## Part 3 — Lead Capture API

### File: `/app/api/lead/route.ts`

Replace the Session 1 stub with the real implementation.

```ts
export async function POST(req: Request) {
  // 1. Parse JSON body
  // 2. Validate with leadFormSchema
  // 3. Check for duplicate email in Supabase (return 200 with deduped: true if exists — don't error)
  // 4. Insert into Supabase `leads` table via service-role client
  // 5. Send Resend welcome email
  // 6. Send internal notification email to RESEND_INTERNAL_NOTIFY_EMAIL
  // 7. Return { ok: true }
}
```

**Error handling:**
- If Zod validation fails: 400 with field errors
- If Supabase insert fails: 500, log error, return generic message
- If Resend fails but Supabase succeeded: 200 (don't lose the lead because of an email problem). Log the email failure.
- Wrap the whole handler in try/catch
- Use `process.env` access inside the handler so missing env vars surface clearly

**Rate limiting (basic):**
- Simple in-memory or Vercel Edge Config rate limit: max 5 submissions per IP per minute
- If rate limited: return 429
- For now, in-memory is fine. Real rate limiting can come later.

**Server-side validation:** the API revalidates with Zod even though the client did. Never trust client validation alone.

---

## Part 4 — Resend Email Templates

### File: `/emails/LeadWelcome.tsx`

React Email template. Sent on successful lead submission.

**From:** `Precise Aesthetics <hello@preciseaesthetics.com>`
**Subject:** `Welcome to Precise Aesthetics`
**Preview text:** `First access to launch updates and demo scheduling.`

**Layout:**
- Width 600px, mobile responsive
- Background: bone-100
- Header: navy horizontal lockup, top-left, 200px wide
- Greeting: "Hi {firstName},"
- Body (Inter 16px, ink-700, line-height 1.6):
  - "Thank you for your interest in Precise Aesthetics."
  - "The Precise System launches August 8, 2026, at the Civic Opera Building in Chicago. As we approach launch, we'll share early access to demo scheduling and selected practitioners will receive invitations to the launch event."
  - "If you'd like to discuss the system in detail or schedule a demonstration, reply to this email."
- Footer (caption, ink-500):
  - Address block (placeholder for now: "PS Medical Aesthetics, LLC · Chicago, IL")
  - Trademark line: "Precise Aesthetics™ and Precise Pico™ are trademarks of PS Medical Aesthetics, LLC."
  - Unsubscribe link (use a placeholder href for now; full unsubscribe flow is a later session)

**Voice rules (from BRAND-IDENTITY.md):**
- Sentence case, no exclamation points, no emoji
- The system is the subject — not "we"
- Calm, premium, not over-eager

**Plain-text fallback:** required. React Email handles auto-generation if `<Text>` components are used correctly.

### File: `/emails/InternalLeadNotification.tsx`

Sent to `RESEND_INTERNAL_NOTIFY_EMAIL` (you/admin) on every new lead.

**Subject:** `New lead: {firstName} {lastName} — {practiceName}`

**Body:** Just the lead data, formatted as a plain table or simple list. No marketing styling needed — this is operational. Include source, UTM params, timestamp.

### File: `/lib/resend/send.ts`

Implement these functions properly (replacing Session 1 stubs):

```ts
export async function sendLeadWelcome(lead: LeadRecord): Promise<void>;
export async function sendInternalLeadNotification(lead: LeadRecord): Promise<void>;
```

Use the Resend client from `/lib/resend/client.ts`. Pass React Email components via `react:` parameter.

---

## Part 5 — Analytics

In `LeadForm.tsx`, fire PostHog events:

- `lead_form_viewed` — on mount (once per session)
- `lead_form_submitted` — on submit attempt
- `lead_form_succeeded` — on successful submission, includes role and interest array
- `lead_form_failed` — on validation or server error, includes error type

Use the PostHog client wired in Session 1. Server-side track is optional — client-side is enough for now.

Identify the user by email after submission (`posthog.identify(email)`). This lets us connect launch event RSVPs to lead capture later.

---

## Part 6 — SEO + Meta

### Page metadata

In `app/(marketing)/page.tsx`, export:

```ts
export const metadata: Metadata = {
  title: "Precise Aesthetics — Protocol-Driven Pico Laser",
  description:
    "Predictable outcomes across every skin type. The Precise System launches August 8, 2026. Get launch updates and demo access.",
  openGraph: {
    title: "Precise Aesthetics — A new standard in laser dermatology",
    description:
      "Predictable outcomes across every skin type. Launching August 8, 2026, Civic Opera Building, Chicago.",
    url: "https://preciseaesthetics.com",
    siteName: "Precise Aesthetics",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Precise Aesthetics — Predictable outcomes across every skin type.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Precise Aesthetics",
    description: "Predictable outcomes across every skin type.",
    images: ["/og-default.png"],
  },
  alternates: {
    canonical: "https://preciseaesthetics.com",
  },
};
```

### OG image

Create a simple OG image at `/public/og-default.png`:
- 1200 × 630
- Midnight-800 background
- Cream Logo lockup centered or top-left
- Hero line: "Predictable outcomes across every skin type."
- Footer line: "Launching August 8, 2026 · Civic Opera Building · Chicago"
- Use Fraunces + Inter

If you can't produce a real PNG, generate it programmatically using Vercel's `@vercel/og` (Next.js OG image generation). Place handler at `/app/og/route.tsx` or similar. Either approach is fine.

### Structured data

Add JSON-LD `Organization` schema in the page's head:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Precise Aesthetics",
  "legalName": "PS Medical Aesthetics, LLC",
  "url": "https://preciseaesthetics.com",
  "logo": "https://preciseaesthetics.com/brand/precise-aesthetics-monogram-circle-light-1024.png",
  "description": "A clinical technology company building complete dermatologic systems."
}
```

### Sitemap & robots

Update `app/sitemap.ts` to include only `/` for now (other routes don't exist yet).
Update `app/robots.ts` to allow all crawlers, point to sitemap, but **disallow `/portal/*`, `/studio`, `/sandbox`** explicitly.

---

## Part 7 — Production Readiness

### Environment variables (verify in Vercel project settings)

Required for this session to work in production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_INTERNAL_NOTIFY_EMAIL`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_SITE_URL`

Confirm with the user (me) that all are set before declaring complete.

### Error pages

Make sure `app/not-found.tsx` and `app/error.tsx` render with the brand. Minimum:
- Same Header/Footer
- A `<Section tone="bone">` with a calm headline ("Page not found." / "Something went wrong.")
- A button back to `/`

### Performance check

After build, run Lighthouse on the production preview deploy:
- Performance ≥ 95 (mobile and desktop)
- Accessibility = 100
- Best Practices ≥ 95
- SEO = 100

If any score is below target, identify why and fix before merging.

---

## Part 8 — Verification Checklist

Before declaring done:

1. `npm run build` clean
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Submit a test lead from the form — confirm:
   - New row in Supabase `leads` table
   - Welcome email arrives in inbox
   - Internal notification arrives at RESEND_INTERNAL_NOTIFY_EMAIL
   - PostHog event fires (check PostHog dashboard)
5. Submit the same email twice — second submission returns 200 with `deduped: true`, no second email sent
6. Submit invalid data (bad email, missing fields) — proper error states, no API call leaks
7. Test on mobile (375px) — form usable, no overflow, submit works
8. Tab through page keyboard-only — focus visible, form fully operable
9. Lighthouse run on preview deploy — all targets met
10. View source — meta tags present, JSON-LD present, OG image references valid
11. Visit `/og-default.png` (or OG route) — image renders correctly
12. Visit `/sitemap.xml` and `/robots.txt` — both correct

---

## Pre-Delivery Checklist (from MASTER.md)

For every component built this session:
- [ ] Reads from MASTER.md tokens only
- [ ] TypeScript strict, no `any`
- [ ] Responsive at 375 / 768 / 1024 / 1440
- [ ] Keyboard accessible
- [ ] Focus visible on every interactive element
- [ ] prefers-reduced-motion respected
- [ ] Touch targets ≥ 44 × 44px
- [ ] Body text contrast ≥ 4.5:1
- [ ] No console errors or warnings
- [ ] Loading + error + empty states present
- [ ] Semantic HTML (correct heading levels, landmarks)
- [ ] Server Components by default; client only where needed
- [ ] Lucide icons only

---

## Do NOT in This Session

- Do not build the full homepage (Session 5)
- Do not build other pages (`/system`, `/pico`, `/about`, etc.)
- Do not implement Cal.com (Session 11+)
- Do not build the practitioner portal
- Do not change MASTER.md tokens or globals.css design tokens
- Do not introduce new fonts or icon libraries
- Do not add Stripe or any payment processing
- Do not implement the unsubscribe flow (placeholder link is fine for now)

---

## Deliverables

When done, report back:
1. Production URL where this is live
2. Confirmation a real test lead made it through the full pipeline (Supabase + Resend + PostHog)
3. Lighthouse scores on the production deploy
4. Any decisions made not explicit in this prompt
5. Any blockers (missing env vars, Resend domain unverified, etc.)

Then we move to Session 5: the full homepage.
