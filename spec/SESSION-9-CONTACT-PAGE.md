# Session 9 — /contact Page

> Run from repo root. Builds /contact as a hybrid page: short editorial framing followed by a single general contact form.

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/SESSION-8-ABOUT-PAGE.md` (editorial register reference)
6. This spec

**Visual reference:** /demo for the form pattern, /about for the editorial framing register.

---

## What Gets Built

| Route | Purpose |
| --- | --- |
| `/contact` | Hybrid — short editorial framing + single general contact form |

**Out of scope:**
- Live chat
- Public phone numbers
- Physical address (entity-level only — "Chicago, Illinois" if mentioned at all)
- Inquiry-type routing (single inbox for all submissions)

---

## Constraints

1. **MASTER.md tokens only.**
2. **Editorial register matches /about and /system.** Quiet, confident, no marketing language.
3. **No personalities.** No names on the page.
4. **Reuse existing form primitives.** Same Input, Label, Textarea, Button components used elsewhere.
5. **Reuse existing API + email patterns.** Same Zod + Resend + Supabase pipeline as /demo.
6. **Lighthouse 95+ across all metrics.**

---

## Page Structure

3 moments:

1. Editorial header
2. The form
3. Footer note

All on one continuous bone-100 surface. No section tone changes.

---

# SECTION 1 — Editorial Header

```
Eyebrow: § GET IN TOUCH

Display heading (Fraunces, large, two lines, italic on second):
Reach the team
behind the system.

Lead (Inter 19px, ink-700, max-w-[58ch]):
Use the form below to send a message. Practitioners interested in 
scheduling a demonstration can use the demo page directly.

[Inline link]: Request a demonstration → /demo
```

Header sized smaller than a full hero — about 40-50vh on desktop. Quiet entry, not a banner.

Optional Fig. annotation in top-right corner (your call — include if it adds editorial weight).

---

# SECTION 2 — The Form

Sits in the same bone-100 section as the header. No tone change. A subtle hairline divider between the editorial framing and the form (60px brand-300 hairline at 30%, centered, with py-12 above and below).

**Layout:**
- Single column, max-w-[640px], centered
- Labels above inputs (not floating)
- Generous vertical spacing between fields (mb-6)

**Fields (in order):**

```
1. Full name (REQUIRED)
   Type: text
   Label: "Your name"
   Validation: min 1, max 120

2. Email (REQUIRED)
   Type: email
   Label: "Email"
   Validation: RFC email, max 254

3. Organization (OPTIONAL)
   Type: text
   Label: "Practice or organization"
   Helper text below field: "Optional"
   Validation: max 160

4. Subject (REQUIRED)
   Type: text
   Label: "Subject"
   Validation: min 1, max 200

5. Message (REQUIRED)
   Type: textarea (5 rows default, expands)
   Label: "Your message"
   Validation: min 10, max 4000

[Submit button, primary, full-width on mobile, auto on desktop]
"Send message"
```

**Field visual treatment:**
- Match the existing /demo form input style exactly
- Bone-50 background on inputs, ink-100 border, ink-900 text
- Focus state: brand-300 border + brand-300 outline ring at 50% opacity
- Error state: error color border + error message in caption text below field
- All fields tab-order correct, focus visible, aria-described errors

**Submit behavior:**
- Submit button shows loading state during submission (spinner + "Sending..." text)
- On success: form replaced in-place with success state
- Success copy: short, calm — "Message sent. We'll respond as appropriate."
- On error: Sonner toast with neutral copy

**UTM capture:**
- Capture utm_source, utm_medium, utm_campaign from URL on mount
- Pass with submission for attribution

---

# SECTION 3 — Footer Note

After the form, a small footer note (mt-16):

```
[Caption text, Inter 13px, ink-500, max-w-[58ch], centered]
This form sends a message to the Precise Aesthetics team. We respond 
as time and content allow. Practitioner inquiries about The Precise 
System are best routed through the demonstration request page.
```

No CTA. No buttons. The footer is informational closure.

---

# THE PIPELINE (BACKEND)

Mirrors the `/api/lead` and `/api/demo-request` pattern.

## File: `lib/schemas/contact-message.ts`

```typescript
import { z } from "zod";

export const contactMessageSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email().max(254),
  organization: z.string().max(160).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(4000),
  utm: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
  }).optional(),
});

export type ContactMessageValues = z.infer<typeof contactMessageSchema>;
```

## File: `lib/supabase/contact-messages.ts`

`insertContactMessage()` writes to a new Supabase `contact_messages` table.

**Migration required** — add to `supabase/migrations/`:

```sql
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  organization text,
  subject text not null,
  message text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text
);

create index idx_contact_messages_created_at 
  on public.contact_messages (created_at desc);

create index idx_contact_messages_email 
  on public.contact_messages (lower(email));

alter table public.contact_messages enable row level security;

-- Service-role only for now; no public read/write access
```

After applying the migration, regenerate Supabase types: `npx supabase gen types typescript`.

## File: `app/api/contact/route.ts`

Standard route, mirrors `/api/demo-request`:

1. Rate limit (max 5 submissions / IP / minute)
2. Parse JSON body
3. Validate with `contactMessageSchema`
4. Insert into `contact_messages` table
5. Send Resend confirmation email (to user)
6. Send Resend internal notification (to RESEND_INTERNAL_NOTIFY_EMAIL)
7. Return `{ ok: true }` on success

Email failures don't 500 the request. Logged but don't block the lead.

## Email templates

**`emails/ContactMessageConfirmation.tsx`**

Branded email to the sender. Same brand treatment as LeadWelcome.tsx — bone-100 background, navy lockup, Fraunces lead name, footer with trademark line.

```
From: Precise Aesthetics <hello@preciseaesthetics.com>
Subject: Message received
Preview: We've received your message and will respond as appropriate.

Body:
Hi {fullName},

Thank you for reaching out. Your message has been received.

Subject: {subject}

We respond to inquiries as time and content allow. If your message 
concerns scheduling a clinical demonstration of The Precise System, 
the demonstration request page provides a more direct path.

[Footer with address block, trademark line, unsubscribe placeholder]
```

**`emails/InternalContactNotification.tsx`**

Operational email to RESEND_INTERNAL_NOTIFY_EMAIL. Mirrors the InternalLeadNotification format — bone background, lockup, Fraunces sender name, all submission details surfaced including organization, subject, message body, UTM params, timestamp.

`replyTo: values.email` so ops can hit reply directly.

## File: `lib/resend/send.ts`

Add two new functions:

```typescript
export async function sendContactConfirmation(
  values: ContactMessageValues
): Promise<SendResult>;

export async function sendInternalContactNotification(
  values: ContactMessageValues
): Promise<SendResult>;
```

Same patterns as the existing demo + lead functions.

---

# COMPONENT FILE

**`components/forms/ContactForm.tsx`**

Client component. RHF + Zod resolver, Sonner toasts, UTM capture, success state.

Mirrors the structure of `DemoRequestForm.tsx` but with the simpler 5-field layout above. All design polish patterns (loading states, error states, accessibility) carry over.

---

# PAGE FILE

**`app/(marketing)/contact/page.tsx`**

Server Component for the page chrome (header, footer note). Renders `<ContactForm />` (client component) inline between them.

```typescript
export const metadata: Metadata = {
  title: "Contact — Precise Aesthetics",
  description:
    "Send a message to the Precise Aesthetics team.",
  openGraph: {
    title: "Contact — Precise Aesthetics",
    description: "Send a message to the Precise Aesthetics team.",
    url: "https://preciseaesthetics.com/contact",
    type: "website",
  },
  alternates: {
    canonical: "https://preciseaesthetics.com/contact",
  },
};
```

---

# NAV INTEGRATION

Add `/contact` to:

1. **Header.tsx** — top-level nav item, between "About" and "Request a demonstration." Or in a "More" dropdown if nav is getting crowded.
2. **Footer** — site footer should already have a contact link. If it points at `mailto:` currently, swap to `/contact`.

---

# VERIFICATION

1. `npm run build` clean — /contact route generates
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Migration applied to Supabase, types regenerated
5. Visit /contact:
   - Editorial header renders cleanly
   - Form validates correctly
   - Submit a real message — confirm:
     - New row in `contact_messages` table
     - Confirmation email arrives at sender's inbox
     - Internal notification arrives at RESEND_INTERNAL_NOTIFY_EMAIL
6. Submit invalid data — proper error states, no API call leaks
7. Mobile (375px): form usable, inputs not zooming, submit reachable
8. Tab through page keyboard-only — focus visible, all fields reachable
9. Lighthouse on production build — 95+ all metrics

---

# PRE-DELIVERY CHECKLIST

- [ ] Tokens-only
- [ ] No new fonts/icons/colors
- [ ] Console clean
- [ ] System-first voice (no personalities, no founder mention)
- [ ] No physical address beyond "Chicago, Illinois" if mentioned
- [ ] Form follows existing input/label/button primitive patterns
- [ ] API mirrors /api/demo-request structure
- [ ] Email templates match LeadWelcome.tsx brand treatment
- [ ] UTM capture on form mount
- [ ] Server-side Zod re-validation in API route
- [ ] Rate limit applied
- [ ] Migration applied + types regenerated

---

# DELIVERABLES

When done, report:
1. Production preview URL for /contact
2. Confirmation real submission flowed through full pipeline (Supabase row + both emails)
3. Lighthouse scores
4. Migration confirmation (rows in contact_messages table accessible via service role)
5. Any decisions made not explicit in this prompt
6. Any blockers
