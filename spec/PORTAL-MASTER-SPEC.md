# Portal + Admin Build — Master Spec

> Complete architecture and 12-session build plan for the Precise Aesthetics practitioner portal and internal admin panel. All decisions locked through pre-build planning.

---

## Pre-Build Reads

Before any session begins:
- `CLAUDE.md`
- `design-system/MASTER.md`
- `design-system/BRAND-IDENTITY.md`
- `design-system/COPY-DECK.md`
- This master spec
- The session-specific spec for the current session

**Skills active throughout:** `ui-ux-pro-max`, `frontend-design`

---

## Architecture Overview

### Two product surfaces, one codebase

**Practitioner Portal** — `/portal/*` routes
- Practice-facing
- Single account per practice
- Zero AI on the surface

**Admin Panel** — `/admin/*` routes
- Internal team only (you + Roni)
- Six AI agents, all on-demand
- Adverse event monitoring + alert system

Shared:
- Same Next.js app
- Same Supabase database
- Same design system
- Same auth provider (Supabase Auth)

### Account model

**Practice = one account = one login.**

- Practice has: name, primary contact email, address, phone, owned devices
- One set of credentials per practice
- "Authorized users" list within the practice (just names + optional roles, no logins)
- Treatment logs attributed to: practice + entered-by name
- Practice owner self-manages authorized users (add/remove freely)

### Authentication

Supabase Auth, two methods, practitioner chooses:
- Email + password
- Magic link

First-time login uses email invite link. No public signup — provisioned only by admin.

Admin authentication separate. Same Supabase Auth, different `role` claim. Admin login at `/admin/login`.

### Authorization

**Row-Level Security (RLS) at the database level.** Non-negotiable.

- Each practice can only read/write their own data
- Admins can read all data, write only what their role allows
- Treatment logs, photos, notifications all filtered by practice_id at the database level
- Even if a UI bug exposed a query, RLS prevents data leak

### Device-gated protocol access

Practices see only protocols relevant to their owned devices.

- `devices` table — Precise Pico, Precise RF (future), etc.
- Each protocol tagged with `applicable_devices: [device_ids]`
- Each practice tagged with `owned_devices: [device_ids]`
- Protocol library queries filter to: protocols where `applicable_devices ∩ practice.owned_devices` ≠ empty

### AI agents (admin only, on-demand)

All six agents use Anthropic API, all run on click or per-event. No always-on background jobs.

| Agent | Trigger |
|---|---|
| Pattern Analyst | Roni clicks "analyze outcomes" |
| Protocol Drafter | Roni clicks "draft update" |
| Practice Health Reviewer | Roni clicks "review practices" |
| Communication Drafter | Roni clicks "draft email" |
| Query Assistant | Roni types natural-language question |
| Lead Enricher | Auto-triggered per new lead |

Realistic Anthropic cost at launch scale: ~$14/month. Scales with usage, not a constraint.

---

## Decisions Locked

**On the practitioner side:**
- One login per practice
- Authorized users dropdown for "entered by" attribution
- Practice owner self-manages authorized users
- Email invite only for setup (no phone capture)
- Setup wizard on first login (5-7 steps)
- Protocol library is the centerpiece feature
- Photos uploaded with treatment logs (consent checkbox required)
- Lightweight treatment logging — system contribution interface, not EMR
- Notifications only for protocol updates relevant to owned devices
- Certification badge for Precise Aesthetics training completion
- Zero AI on the practitioner surface

**On the admin side:**
- Six AI agents, all on-demand
- Practice account provisioning interface
- Protocol library full CRUD with versioning, device tagging
- Lead/demo/contact inbox
- Aggregated treatment data dashboard for Roni
- Adverse event monitoring with email alerts + in-panel review section

**Cut from scope:**
- Stripe billing (manual invoicing handled outside portal)
- Multi-location complexity (device data is what matters)
- Photo redaction (practitioners handle consent)
- Patient series tracking (practitioners use their own EMR)
- Inventory tracking
- Data export
- Practice-level analytics for practitioners
- Case studies / KOL identification
- CE credit tracking (just Precise certification status)
- Rating systems

---

## Adverse Event Handling

Simple by design.

**On the treatment log:**
- "Adverse reaction?" toggle (yes/no)
- If yes → text field opens for practitioner description
- Submit triggers:
  - Email to Roni (with practitioner-entered description, treatment context, link to admin view)
  - Flagged record in admin panel for review
  - Status field: "new" → "reviewing" → "addressed" (Roni manages status)

**In admin panel:**
- "Adverse Events" section in Roni's nav
- List view of flagged events sorted newest first
- Click any to see full context: which protocol, which practice, which entered-by user, what parameters were used, the description, photos if attached
- Filter by status, date, practice
- Roni can add internal notes per event

That's it. No severity classification, no category dropdown, no rating. Practitioner reports it, Roni reviews it.

---

## Setup Wizard Flow (First-Time Practice Login)

When you/Roni provision a practice account:
1. You enter: practice name, primary email, address, phone, owned device(s)
2. Supabase Auth sends invite email with one-time setup link
3. Practice clicks link → setup wizard starts

**Step 1 — Welcome**
"Welcome to Precise. Let's get you set up in three minutes."
Practice name pre-populated.

**Step 2 — Set password**
Email pre-filled. Create password + confirm.

**Step 3 — Confirm practice profile**
Practice address, phone, primary contact pre-populated from admin entry. Practice can edit.

**Step 4 — Authorized users**
"Who at your practice will be entering treatment data?"
Add user names + optional roles (practitioner, MA, front desk).
This pre-populates the "Entered by" dropdown on treatment logs.
Can add more users later from settings.

**Step 5 — Device confirmation**
Visual confirmation of owned devices ("You own: Precise Pico™").
Drives protocol library filtering.

**Step 6 — Brief tour**
Three slides with visuals:
1. "Browse the protocol library"
2. "Log treatments to refine the system"
3. "Stay updated when protocols evolve"

**Step 7 — Done**
"You're set up. Welcome to Precise."
[Enter Portal] → lands on dashboard.

Total time: under 5 minutes. Premium register, no friction.

---

## 12-Session Build Plan

| # | Session | Purpose |
|---|---|---|
| P1 | Auth Foundation | Supabase Auth + middleware + RLS framework + route group separation |
| P2 | Practice Account Model | Schema + admin provisioning interface + invite email flow |
| P3 | Setup Wizard + Portal Login | Onboarding flow + login UI + first-time experience |
| P4 | Protocol Library Schema + Admin CRUD | Tables, versioning, device tagging, admin authoring interface |
| P5 | Protocol Library Viewer (Portal) | Browse, search, filter by indication, view full protocol detail, device-filtered |
| P6 | Treatment Logging | Form + photo upload + adverse event flag + entered-by dropdown |
| P7 | Treatment History + Admin Dashboard | Practice's own history view + Roni's aggregated dashboard |
| P8 | Lead / Demo / Contact Inbox | Admin interface to manage all inbound from marketing site |
| P9 | Training Library + Certification | Video/guide hosting + completion tracking + cert badge |
| P10 | Notifications | In-app notification system + email digest for protocol updates |
| P11 | AI Agent Integration | All six agents wired into admin with on-demand triggers |
| P12 | QA + Security + Deploy | RLS audit, accessibility pass, Lighthouse, security review, deployment to production |

---

## Visual Standard

**Portal and admin extend the editorial brand register established by the marketing site.**

- Bone-100 surfaces for content areas
- Midnight headers and accents
- Fraunces for section headings, Inter for body and UI
- § Fig. annotations on major content blocks
- Hairline dividers
- Editorial restraint — no SaaS-y card-grid sprawl

But more functional:
- Forms, data tables, search, filters all present
- Loading states, empty states, error states for every async surface
- Skeleton loaders during data fetch
- Sonner for toasts, not modal interruptions

**Reference:** Stripe Dashboard, Linear, Notion. Functional but unmistakably premium.

---

## Constraints (Carry Through Every Session)

1. **MASTER.md tokens only.** No new colors, fonts, icons.
2. **Editorial register preserved.** Even functional UI uses Fraunces section heads, hairline dividers, Fig. annotations where appropriate.
3. **Server Components by default.** Client only when necessary (forms, interactive widgets).
4. **RLS enforced on every table** with practice or admin data. Tested, not assumed.
5. **Audit logging** on all admin write actions (provisioning, protocol changes, adverse event status changes). Required for clinical software.
6. **Reduced motion respected** throughout. No scroll animations, no decorative motion.
7. **Lighthouse 95+** on all portal pages, 90+ on admin pages (functional UIs trade some perf for capability).
8. **Accessibility AA** throughout. Tab navigation, focus visible, screen reader compatible.

---

## What Each Session Delivers

Every session ships:

- All code committed to repo
- All migrations applied to Supabase (after user review)
- Type-check clean, lint clean, build clean
- Pre-delivery checklist passed for every component
- End-of-session summary including:
  - Files created/modified
  - Decisions made not explicit in spec
  - Drafted copy flagged for approval
  - Blockers
  - What you should verify

User reviews each session before the next begins. No silent compounding of issues.

---

## Out of Scope (Not Built in This 12-Session Plan)

- Stripe billing
- SMS notifications
- Multi-language support
- Mobile apps (responsive web only)
- Practitioner-facing AI features
- Public-facing portal preview
- Patient-facing anything
- Third-party EMR integrations
- API for external developers

Each of these may earn a future session if business need emerges. Not built in this initial 12.

---

## Next Step

Begin with Session P1: Auth Foundation. Each subsequent session has its own dedicated spec written before that session begins, building on this master architecture.
