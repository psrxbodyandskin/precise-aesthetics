# Session P2 — Practice Account Model

> Run after P1 (Auth Foundation) is deployed and login confirmed working on production. Builds the practice account schema, the admin-side provisioning interface, and the email invite flow.

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/PORTAL-MASTER-SPEC.md`
6. `spec/RLS-PATTERNS.md` (from P1 — canonical Class A/B/C templates)
7. This spec

---

## Goal

After this session:
- Practices can be created in the admin panel
- Each created practice has a Supabase Auth user attached
- An invite email is sent automatically
- The invited user clicks the link, completes setup (P3 builds the wizard — for now they land on a placeholder)
- The practice's `practice_id` claim flows into JWT for RLS to work in P3+
- Admin can view, search, edit, suspend practices
- Every admin write action is audit-logged

---

## What Gets Built

| Surface | What |
|---|---|
| Database | `practices` table, `practice_users` table, `devices` table, `practice_devices` join, related RLS |
| Schema additions | `practice_id` claim added to JWT for practice users; new `current_practice_id()` SQL helper returns it |
| Admin UI | `/admin/practices` (list), `/admin/practices/new` (provision), `/admin/practices/[id]` (detail/edit) |
| Email | Resend invite email template + send function |
| API | `/api/admin/practices/*` routes for create / update / suspend |
| Audit | Every admin write goes through `log_audit()` from P1 |

---

## Critical Constraints

1. **Build on P1 foundation.** Use `lib/auth/server.ts` helpers, follow `spec/RLS-PATTERNS.md` policy templates, write to `audit_log` via `log_audit()`.
2. **MASTER.md tokens only.** No new colors, fonts, icons.
3. **Editorial register applies to admin too.** Functional but premium. Reference: Stripe Dashboard, Linear admin views.
4. **All migrations held for manual review.** Write the SQL, do not apply to prod automatically.
5. **Audit log every admin write action.** Provisioning, editing, suspending — all logged.
6. **Service-role client only on server.** Never ship Supabase service keys to the client.
7. **`practice_id` claim must be set in JWT** for `current_practice_id()` to return the correct value. This unlocks all RLS in P3+.

---

# DATA MODEL

## Table: `practices`

```sql
create table public.practices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Identity
  name text not null,
  primary_email text not null,
  phone text,
  
  -- Address
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text default 'US',
  
  -- Status
  status text not null default 'pending' 
    check (status in ('pending', 'active', 'suspended', 'archived')),
  status_changed_at timestamptz default now(),
  status_changed_by uuid references auth.users(id),
  
  -- Auth linkage
  auth_user_id uuid references auth.users(id) unique,
  
  -- Provisioning context
  provisioned_by uuid references auth.users(id),
  provisioned_at timestamptz default now(),
  
  -- Notes (admin-only, internal)
  internal_notes text
);

create index idx_practices_status on public.practices(status);
create index idx_practices_auth_user_id on public.practices(auth_user_id);
create index idx_practices_primary_email on public.practices(lower(primary_email));
```

**RLS Policies (Class A — practice-owned):**

```sql
alter table public.practices enable row level security;

-- Admin: full read/write
create policy practices_admin_all on public.practices
  for all using (public.is_admin())
  with check (public.is_admin());

-- Practice: read own only (cannot edit own practice record — admin-controlled)
create policy practices_practice_read_own on public.practices
  for select using (
    public.is_practice() 
    and id = public.current_practice_id()
  );
```

## Table: `practice_users` (authorized users — names only, not logins)

```sql
create table public.practice_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  
  full_name text not null,
  role_at_practice text, -- "Practitioner", "MA", "Front desk", etc. — free text
  is_active boolean not null default true,
  
  -- Optional extra metadata
  notes text
);

create index idx_practice_users_practice_id on public.practice_users(practice_id);
```

**RLS Policies:**

```sql
alter table public.practice_users enable row level security;

-- Admin: full read/write
create policy practice_users_admin_all on public.practice_users
  for all using (public.is_admin())
  with check (public.is_admin());

-- Practice: full CRUD on their own practice's users (self-service per master spec)
create policy practice_users_own on public.practice_users
  for all using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );
```

## Table: `devices` (catalog of products Precise sells)

```sql
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  
  slug text not null unique, -- e.g. 'precise-pico'
  display_name text not null, -- e.g. 'Precise Pico™'
  short_description text,
  is_active boolean not null default true,
  
  -- Sort order in admin UI
  sort_order integer default 0
);

-- Seed with Precise Pico
insert into public.devices (slug, display_name, short_description) values
  ('precise-pico', 'Precise Pico™', 'Multi-wavelength pico laser');
```

**RLS Policies (Class B — admin-managed shared):**

```sql
alter table public.devices enable row level security;

-- Admin: full read/write
create policy devices_admin_all on public.devices
  for all using (public.is_admin())
  with check (public.is_admin());

-- Practice: read all active devices (so they can see what they could own)
create policy devices_practice_read_active on public.devices
  for select using (
    public.is_practice() 
    and is_active = true
  );
```

## Table: `practice_devices` (which devices each practice owns)

```sql
create table public.practice_devices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  device_id uuid not null references public.devices(id),
  
  -- Provenance
  serial_number text,
  acquired_at date,
  notes text,
  
  unique(practice_id, device_id)
);

create index idx_practice_devices_practice_id on public.practice_devices(practice_id);
create index idx_practice_devices_device_id on public.practice_devices(device_id);
```

**RLS Policies:**

```sql
alter table public.practice_devices enable row level security;

-- Admin: full read/write
create policy practice_devices_admin_all on public.practice_devices
  for all using (public.is_admin())
  with check (public.is_admin());

-- Practice: read own device ownership only
create policy practice_devices_practice_read_own on public.practice_devices
  for select using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );
```

## JWT claim addition

P1 added `current_practice_id()` SQL helper but it returns null until a practice_id claim is set. P2 sets it.

When admin creates a practice + auth user, write `practice_id` to the user's `app_metadata`:

```javascript
await supabaseAdmin.auth.admin.updateUserById(authUserId, {
  app_metadata: { 
    role: 'practice', 
    practice_id: practiceRecord.id 
  }
});
```

The `current_practice_id()` SQL helper from P1 reads from `auth.jwt() -> 'app_metadata' ->> 'practice_id'` and returns the UUID. This is what makes every Class A RLS policy work for the rest of the build.

---

# ADMIN UI

## Route: `/admin/practices` (list view)

**Purpose:** see all practices, filter, search, click to detail.

**Layout:**
- Page header: eyebrow `§ ADMIN`, h1 `Practices`, lead `Manage practice accounts and device assignments.`
- Top bar: search input (filters by name/email), status filter dropdown (all / pending / active / suspended), `+ New practice` primary button (top-right)
- Table:
  - Columns: Practice name | Primary email | Devices | Status | Created | Actions
  - Status rendered as small colored chip (pending = ink-500, active = green-700, suspended = error-700, archived = ink-300)
  - Devices column: stacked tiny chips showing owned device names
  - Actions: kebab menu → View / Edit / Suspend / Archive
  - Click row → `/admin/practices/[id]`
  - Empty state: `No practices yet. Provision the first one to get started.` with primary `+ New practice` button
- Pagination: 50 per page

**Editorial register:** Stripe Dashboard density, but quieter. Hairline dividers between rows (1px ink-100). Fraunces only on the page heading and detail-view headings, Inter throughout the table.

## Route: `/admin/practices/new` (provisioning form)

**Purpose:** create a new practice account, send invite email.

**Layout:**
- Two-column on desktop. Left: form. Right: editorial sidebar explaining the provisioning flow.

**Form fields (in order):**

```
Section 1 — Practice identity
- Practice name (required)
- Primary contact email (required, validates as email)
- Phone (optional)

Section 2 — Address
- Address line 1
- Address line 2 (optional)
- City
- State (US state dropdown)
- Postal code
- Country (defaults to US)

Section 3 — Devices owned
- Device picker (multi-select)
- Pulls from `devices` table where `is_active = true`
- Each selection allows entering optional serial_number + acquired_at date inline
- Initially: only Precise Pico™ available

Section 4 — Internal notes (admin only)
- Multi-line textarea
- For Roni / sales team context (e.g. "Met at AAD, urgent demo, multi-state practice")

[Provision practice] primary submit button
```

**Right sidebar (editorial framing):**

```
§ HOW PROVISIONING WORKS

01  Practice record created
    Saved to the database with status: pending.

02  Auth user attached
    Supabase creates the login credentials.

03  Invite email sent
    The primary contact receives a one-time setup link.

04  Status flips to active
    When they complete the setup wizard.

[BodyText caption]
Provisioning sends a real email immediately. Double-check the 
primary contact email before submitting.
```

**On submit:**
1. Server action validates with Zod
2. Service-role Supabase client creates auth user with email
3. Insert into `practices` table with all field data
4. Insert into `practice_users` table with placeholder "Primary contact" record (practice owner customizes in setup wizard P3)
5. Insert into `practice_devices` for each selected device
6. Update auth user's `app_metadata` with `{role: 'practice', practice_id: <new id>}`
7. Trigger Supabase invite email send (or send via Resend)
8. Call `log_audit()` with action='practice.provisioned'
9. Redirect to `/admin/practices/[id]` with success toast

**On error:**
- Validation errors inline
- Server errors via Sonner toast with neutral copy
- If email exists: show inline error on email field

## Route: `/admin/practices/[id]` (detail / edit view)

**Purpose:** view full practice context, edit, suspend, archive.

**Layout:**

Top section (header):
- Breadcrumb: `Practices › {practice name}`
- Eyebrow: `§ {practice name}`
- H1: practice name (Fraunces, large)
- Status chip + provisioned date + last updated
- Action buttons (right-aligned): `Edit details` / `Suspend` / `Archive`

Body — three columns or stacked sections on mobile:

**Section A — Identity**
- Practice name, primary email, phone
- Inline edit on click (optional for P2; can be modal in P2 if simpler)

**Section B — Address**
- Full address block, read-only by default, edit modal

**Section C — Devices owned**
- List of `practice_devices` with serial numbers, acquired dates
- `+ Add device` button → modal to add another device record
- Per-device row: serial number, acquired date, notes, Edit/Remove

**Section D — Authorized users (read-only here, practice manages from portal)**
- List from `practice_users` table
- Display only — note: "Authorized users are managed by the practice from their portal settings."

**Section E — Internal notes (admin-only, editable inline)**
- Textarea, save on blur

**Section F — Activity log (audit log entries for this practice)**
- List view: timestamp + action + actor + summary
- Filtered to `audit_log` rows where `target_type = 'practice'` and `target_id = practice.id`

**Section G — Account auth info**
- Auth user ID
- Created at
- Last sign-in (from `auth.users`)
- "Resend invite email" button (if status = pending)
- "Force password reset" button

**Suspend / Archive actions:**
- Suspend: changes status to 'suspended', logs audit, optionally sends notification email to practice
- Archive: changes status to 'archived', removes from default lists, retains data
- Both require confirmation modal: "Are you sure? This action will be logged."

---

# EMAIL TEMPLATES

## `emails/PracticeInvite.tsx`

The invite email sent on provisioning.

**From:** RESEND_FROM_EMAIL  
**Subject:** Welcome to Precise Aesthetics  
**Preview:** Your practitioner portal account is ready. Click to set up.

**Layout (matches LeadWelcome.tsx brand register):**
- Bone-100 background
- Navy logo at top
- Greeting: "Hi {practiceName} team,"
- Body:
  - "Your Precise Aesthetics practitioner portal account has been created."
  - "Click the button below to set up your account. This link is valid for 24 hours."
  - "Inside the portal, you'll find the protocol library, treatment logging, and notifications when protocols update."
- CTA button: "Set up your account" → magic link URL from Supabase invite
- Footer: "If you didn't expect this email, please contact us." + trademark line + address

**Plain text fallback:** required. React Email handles auto-generation.

---

# API ROUTES

## `app/api/admin/practices/route.ts`

**POST** — Create new practice (called from `/admin/practices/new` form):
1. `requireAdmin()` from `lib/auth/server.ts`
2. Parse and validate body with Zod
3. Service-role: create auth user with `inviteUserByEmail()` 
4. Service-role: insert practices row
5. Service-role: insert practice_users placeholder
6. Service-role: insert practice_devices rows
7. Service-role: update auth user app_metadata
8. Call `log_audit()` 
9. Return practice ID for redirect

**GET** — List practices (called from `/admin/practices`):
1. `requireAdmin()`
2. Query practices with filters (status, search by name/email)
3. Join with practice_devices for device chips
4. Return paginated results

## `app/api/admin/practices/[id]/route.ts`

**GET** — Full practice detail with all relations
**PATCH** — Update practice fields (different sections can call with subset)
**DELETE** — Archive (soft delete, sets status='archived', does not actually delete)

## `app/api/admin/practices/[id]/suspend/route.ts`

**POST** — Suspend practice. Changes status, logs audit, optionally sends email.

## `app/api/admin/practices/[id]/resend-invite/route.ts`

**POST** — Resends the Supabase invite email. Logs audit.

---

# ZOD SCHEMA

## `lib/schemas/practice.ts`

```typescript
import { z } from "zod";

export const practiceProvisioningSchema = z.object({
  // Identity
  name: z.string().min(1).max(200),
  primaryEmail: z.string().email().max(254),
  phone: z.string().max(40).optional().nullable(),
  
  // Address
  addressLine1: z.string().max(200).optional().nullable(),
  addressLine2: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().length(2).default("US"),
  
  // Devices
  deviceIds: z.array(z.object({
    deviceId: z.string().uuid(),
    serialNumber: z.string().max(100).optional(),
    acquiredAt: z.string().optional(), // ISO date
  })).min(0),
  
  // Internal
  internalNotes: z.string().max(2000).optional().nullable(),
});

export type PracticeProvisioningValues = z.infer<typeof practiceProvisioningSchema>;
```

---

# COMPONENTS TO BUILD

**`components/admin/practices/PracticeProvisioningForm.tsx`** — RHF + Zod, all sections from `/admin/practices/new`. Editorial right-sidebar layout.

**`components/admin/practices/PracticesTable.tsx`** — list view with search, filter, pagination.

**`components/admin/practices/StatusChip.tsx`** — colored status indicator. Reusable for any status display.

**`components/admin/practices/DevicePicker.tsx`** — multi-select with serial number / date inputs per selection.

**`components/admin/practices/PracticeDetailView.tsx`** — full detail page with all sections.

**`components/admin/practices/AuditLogTable.tsx`** — generic audit log list, filtered by target. Reusable for other admin views.

**`components/admin/shared/AdminBreadcrumb.tsx`** — breadcrumb nav, will be used across admin.

**`components/admin/shared/AdminPageHeader.tsx`** — eyebrow + h1 + lead + actions row pattern.

These components carry over to P3+, build them well.

---

# VERIFICATION

Before declaring done:

1. `npm run build` clean
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Migration written, NOT applied to prod (held for manual review)
5. Local manual test:
   - Sign in as admin
   - Visit `/admin/practices` → empty state renders
   - Click `+ New practice` → form renders
   - Submit valid practice form → success toast, redirect to detail page
   - Check Supabase: practice record created, auth user created, app_metadata has practice_id, audit log entry written
   - Check Resend logs: invite email sent
   - Click invite link in test email → land on `/portal/reset-password/confirm` (P1 surface) → set password → end up on `/portal` placeholder
6. Edit practice → changes persist, audit log entry written
7. Suspend practice → status changes, chip color updates, audit log entry
8. Resend invite → second email sent, audit log entry
9. Search and filter on practice list work
10. Reduced motion respected (no scroll animations)
11. Tab through provisioning form keyboard-only

---

# PRE-DELIVERY CHECKLIST

- [ ] All MASTER tokens
- [ ] No new fonts/icons/colors
- [ ] Editorial register on admin pages (Fraunces page heads, hairlines)
- [ ] Forms accessible (labels, aria-describedby errors, keyboard tab order)
- [ ] Loading + error + empty states for every async surface
- [ ] Service-role client server-only
- [ ] Every admin write hits `log_audit()`
- [ ] RLS policies written and documented
- [ ] All migrations held for manual review
- [ ] Email template matches LeadWelcome.tsx brand
- [ ] Drafted copy flagged

---

# DELIVERABLES

When done, report:
1. Files created/modified
2. Migration SQL file location (held for review)
3. Decisions made not explicit in spec
4. Drafted copy flagged for approval (especially the invite email body, internal sidebar copy)
5. Manual test confirmation
6. Anything to verify before P3 starts
7. Blockers if any

After P2 is approved and migrated, P3 picks up: setup wizard + first-time portal experience.
