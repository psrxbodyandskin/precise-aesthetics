# Session P10 — Notifications

> Run after P9 (Training + Certification) is deployed and confirmed working. Builds the notification system: in-app notification center + email delivery for high-importance events, category-based mute preferences with mandatory critical types.

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/PORTAL-MASTER-SPEC.md`
6. `spec/RLS-PATTERNS.md`
7. `spec/SESSION-P4-PROTOCOL-LIBRARY-SCHEMA.md`
8. `spec/SESSION-P6-TREATMENT-LOGGING.md`
9. `spec/SESSION-P8-INBOX.md`
10. `spec/SESSION-P9-TRAINING-CERTIFICATION.md`
11. This spec

---

## Architecture

One unified notification system serving practitioners and admins. Two delivery channels: in-app notification center + email via Resend. Triggered by domain events captured in P4-P9. Category-based preferences with mandatory critical types.

---

## Goal

After this session:
- `/portal/notifications` — practitioner notification center
- `/admin/notifications` — admin notification center
- Bell icon in portal nav and admin sidebar with unread count badge
- `/portal/settings/notifications` — practitioner preferences
- `/admin/settings/notifications` — admin preferences
- Server-side dispatch on domain events
- Email delivery via Resend for high-importance events
- Mark-as-read interactions (single + bulk)
- Quiet hours support

---

## What Gets Built

### Database
- `notifications` table
- `notification_preferences` table
- `notification_dispatch_log` table
- Migration `0012_notifications.sql`

### Server-side dispatch
- `lib/notifications/dispatch.ts` — central function
- Domain event hooks added to existing routes
- Email templates per category

### Portal UI
- NotificationBell in PortalNav header
- `/portal/notifications` — full list
- `/portal/settings/notifications` — preferences

### Admin UI
- NotificationBell in AdminSidebar
- `/admin/notifications` — full list
- `/admin/settings/notifications` — preferences

---

## Critical Constraints

1. Build on P1-P9 foundation. RLS Class A for notifications (recipient owns).
2. MASTER.md tokens only.
3. Mandatory critical categories cannot be muted (UI + server-side).
4. Email templates match existing brand register (LeadWelcome, AdverseEventNotification).
5. Idempotent dispatch via deterministic event_id.
6. No email in dev environments (log to console).
7. All migrations held for manual review.
8. Mobile-friendly notification UI.

---

## Notification Categories

### Practitioner-side (recipient_type = 'practice')

| Category | In-app | Email | Mute? | Triggered by |
|----------|--------|-------|-------|--------------|
| `protocol.updated_for_used_protocol` | Yes | Yes | NO | Protocol republished where practice has logged ≥1 treatment with it |
| `adverse_event.status_updated` | Yes | Yes | NO | Roni updates an adverse event the practice reported |
| `protocol.new_for_owned_device` | Yes | No | YES | New protocol published for an owned device |
| `training.new_module_added` | Yes | No | YES | New module added to a curriculum for an owned device |
| `training.certification_expiring` | Yes | Yes | NO | 60d/30d/7d before expiry (when expiry enabled in Q4) |

### Admin-side (recipient_type = 'admin')

| Category | In-app | Email | Mute? | Triggered by |
|----------|--------|-------|-------|--------------|
| `adverse_event.new` | Yes | Yes | NO | Practitioner submits treatment with adverse_reaction = yes |
| `inbox.new_demo_request` | Yes | Yes | YES | New /demo submission |
| `inbox.new_lead` | Yes | No | YES | New homepage lead capture |
| `inbox.new_contact_message` | Yes | Yes | YES | New /contact submission |
| `training.certification_completed` | Yes | No | YES | Practitioner completes certification |
| `practice.high_engagement` | Yes | No | YES | (P11 may compute; leave structure ready) |

---

# DATA MODEL

## Migration: `0012_notifications.sql`

```sql
-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  
  recipient_type text not null check (recipient_type in ('practice', 'admin')),
  practice_id uuid references public.practices(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete cascade,
  practice_user_id uuid references public.practice_authorized_users(id) on delete set null,
  
  category text not null,
  
  title text not null,
  body text,
  link_path text,
  metadata jsonb,
  
  read_at timestamptz,
  
  event_id text not null,
  
  unique(recipient_type, practice_id, admin_user_id, event_id)
);

create index idx_notifications_practice_unread on public.notifications(practice_id) 
  where recipient_type = 'practice' and read_at is null;
create index idx_notifications_admin_unread on public.notifications(admin_user_id)
  where recipient_type = 'admin' and read_at is null;
create index idx_notifications_created_at on public.notifications(created_at desc);
create index idx_notifications_category on public.notifications(category);

-- notification_preferences
create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  user_type text not null check (user_type in ('practice', 'admin')),
  practice_id uuid references public.practices(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete cascade,
  
  -- jsonb shape: { "category.name": { "in_app": bool, "email": bool }, ... }
  preferences jsonb not null default '{}',
  
  quiet_hours_start time,
  quiet_hours_end time,
  quiet_hours_timezone text default 'America/Chicago',
  
  unique(user_type, practice_id, admin_user_id)
);

create index idx_notification_preferences_practice on public.notification_preferences(practice_id);
create index idx_notification_preferences_admin on public.notification_preferences(admin_user_id);

-- notification_dispatch_log
create table public.notification_dispatch_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  
  notification_id uuid references public.notifications(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'email')),
  status text not null check (status in (
    'sent', 'failed', 'skipped_preference', 'skipped_quiet_hours'
  )),
  
  resend_message_id text,
  error_message text
);

create index idx_dispatch_log_notification_id on public.notification_dispatch_log(notification_id);
create index idx_dispatch_log_created_at on public.notification_dispatch_log(created_at desc);

-- Updated_at triggers
create trigger trg_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- RLS

alter table public.notifications enable row level security;

create policy notifications_admin_all on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

create policy notifications_practice_read_own on public.notifications
  for select using (
    public.is_practice()
    and recipient_type = 'practice'
    and practice_id = public.current_practice_id()
  );

create policy notifications_practice_update_own on public.notifications
  for update using (
    public.is_practice()
    and recipient_type = 'practice'
    and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice()
    and recipient_type = 'practice'
    and practice_id = public.current_practice_id()
  );

alter table public.notification_preferences enable row level security;

create policy notification_preferences_admin_all on public.notification_preferences
  for all using (public.is_admin()) with check (public.is_admin());

create policy notification_preferences_practice_crud_own on public.notification_preferences
  for all using (
    public.is_practice() and user_type = 'practice'
    and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice() and user_type = 'practice'
    and practice_id = public.current_practice_id()
  );

create policy notification_preferences_admin_crud_own on public.notification_preferences
  for all using (
    public.is_admin() and user_type = 'admin'
    and admin_user_id = auth.uid()
  )
  with check (
    public.is_admin() and user_type = 'admin'
    and admin_user_id = auth.uid()
  );

alter table public.notification_dispatch_log enable row level security;

create policy dispatch_log_admin_all on public.notification_dispatch_log
  for all using (public.is_admin()) with check (public.is_admin());

-- RPCs
create or replace function public.get_unread_notification_count()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  count_val integer;
begin
  if public.is_practice() then
    select count(*) into count_val
    from notifications
    where recipient_type = 'practice'
      and practice_id = public.current_practice_id()
      and read_at is null;
  elsif public.is_admin() then
    select count(*) into count_val
    from notifications
    where recipient_type = 'admin'
      and admin_user_id = auth.uid()
      and read_at is null;
  else
    count_val := 0;
  end if;
  return count_val;
end;
$$;

create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_practice() then
    update notifications
    set read_at = now()
    where recipient_type = 'practice'
      and practice_id = public.current_practice_id()
      and read_at is null;
  elsif public.is_admin() then
    update notifications
    set read_at = now()
    where recipient_type = 'admin'
      and admin_user_id = auth.uid()
      and read_at is null;
  end if;
end;
$$;
```

---

# DISPATCH SYSTEM

## `lib/notifications/dispatch.ts`

Central function — every notification trigger in the codebase calls this.

```typescript
import "server-only";
import { getServiceClient } from "@/lib/supabase/server-auth";
import { sendNotificationEmail } from "@/lib/notifications/email";

export type NotificationCategory =
  | 'protocol.updated_for_used_protocol'
  | 'adverse_event.status_updated'
  | 'protocol.new_for_owned_device'
  | 'training.new_module_added'
  | 'training.certification_expiring'
  | 'adverse_event.new'
  | 'inbox.new_demo_request'
  | 'inbox.new_lead'
  | 'inbox.new_contact_message'
  | 'training.certification_completed'
  | 'practice.high_engagement';

export interface DispatchPayload {
  category: NotificationCategory;
  practiceId?: string;
  adminUserId?: string;
  practiceUserId?: string;
  eventId: string;
  title: string;
  body?: string;
  linkPath?: string;
  metadata?: Record<string, any>;
}

export async function dispatchNotification(payload: DispatchPayload): Promise<void>;
```

Implementation steps:
1. Insert notification with idempotency via unique(recipient_type, practice_id, admin_user_id, event_id)
2. Catch unique-violation (23505) and no-op
3. Log in_app dispatch
4. Determine if email should send (mandatory categories always; otherwise check preferences + quiet hours)
5. If email: render template, send via Resend, log dispatch result

## Mandatory categories (override preferences)

```typescript
const mandatoryEmail: NotificationCategory[] = [
  'protocol.updated_for_used_protocol',
  'adverse_event.status_updated',
  'training.certification_expiring',
  'adverse_event.new',
];
```

These bypass user preferences AND quiet hours.

## Domain event hooks

Add `dispatchNotification()` calls to these existing routes:

| File | Event | Category |
|------|-------|----------|
| `app/api/webhooks/sanity/protocol/route.ts` | After protocol publish sync | `protocol.updated_for_used_protocol` (per practice that used it), `protocol.new_for_owned_device` (per practice that owns device but hasn't used) |
| `app/api/portal/treatments/route.ts` | After adverse event insert | `adverse_event.new` (to all admins) |
| `app/api/lead/route.ts` | After lead insert | `inbox.new_lead` (to all admins) |
| `app/api/demo-request/route.ts` | After demo insert | `inbox.new_demo_request` (to all admins) |
| `app/api/contact/route.ts` | After contact insert | `inbox.new_contact_message` (to all admins) |
| `app/api/admin/inbox/[type]/[id]/route.ts` PATCH | When adverse event marked addressed | `adverse_event.status_updated` (to reporting practice) |
| `app/api/portal/training/curricula/[id]/certify/route.ts` | After cert | `training.certification_completed` (to all admins) |
| `app/api/admin/training/curricula/[id]/modules/route.ts` POST | After module added | `training.new_module_added` (per practice owning device) |

Each hook builds a deterministic `event_id`:
```typescript
eventId: `protocol.updated.${protocolId}.${versionLabel}.practice.${practiceId}`
eventId: `adverse_event.new.${treatmentAdverseEventId}`
eventId: `inbox.new_demo_request.${demoRequestId}`
```

---

# EMAIL TEMPLATES

Add to `emails/` (use existing LeadWelcome.tsx as register reference):

- `NotificationProtocolUpdated.tsx`
- `NotificationAdverseEventStatusUpdate.tsx`
- `NotificationCertificationExpiring.tsx`
- `NotificationInboxDemoRequest.tsx`
- `NotificationInboxContactMessage.tsx`

(`AdverseEventNotification.tsx` from P6 already exists — refactor to be dispatched via the new system, don't recreate.)

All templates:
- Bone-100 background
- Navy logo at top
- Fraunces greeting
- Inter body
- Branded CTA button to relevant in-app surface
- Footer with trademark line + unsubscribe link (links to /portal/settings/notifications or /admin/settings/notifications based on recipient_type)

`lib/notifications/email.ts` orchestrates: takes notification + payload, picks template, renders, sends via Resend.

---

# UI — NotificationBell (shared component)

**File:** `components/shared/notifications/NotificationBell.tsx`

Used in PortalNav header and AdminSidebar.

**Visual:**
- Lucide `Bell` icon
- Unread count badge (small dot or numbered chip, brand-700)
- Click → opens dropdown panel
- Hover state: ink-200 background

**Polling:**
- Polls `/api/portal/notifications/unread-count` (or admin equivalent) every 60s
- Pauses when tab is backgrounded (visibility API)
- Updates badge optimistically on mark-as-read

**Dropdown panel:**
- Width 360px desktop, full-width on mobile
- Header: "Notifications" + "Mark all read" link
- List of recent 10 notifications
- Footer: "See all notifications →" link
- Empty state: "No notifications yet."

**Each notification:**
- Category icon (Lucide, picked per category)
- Title (Inter regular ink-900)
- Body preview (single-line truncate, Inter 13px ink-700)
- Relative time (Inter 12px ink-500)
- Unread indicator dot (brand-300) at left edge if unread
- Click → navigate to link_path + mark read

---

# UI — Portal Routes

## `/portal/notifications`

Page header:
```
Eyebrow: § NOTIFICATIONS
H1: Notifications.
Lead: Updates relevant to your practice — protocol changes, adverse event reviews, training availability.
Action: "Mark all as read" (top-right)
```

Filter bar:
- Pill toggle: All / Unread
- Category multi-select dropdown

List:
- Server-rendered, paginated 50 per page
- Each row mirrors the dropdown item but full-size
- Click → navigate + mark read

Empty states for all-read and no-matches.

## `/portal/settings/notifications`

Page header:
```
Eyebrow: § SETTINGS
H1: Notification preferences.
Lead: Choose which notifications you receive and how.
```

Form sections:

**Clinical updates (mandatory)**
- Lock icon next to each row
- "Always on — clinical safety" caption
- Categories: protocol.updated_for_used_protocol, adverse_event.status_updated, training.certification_expiring

**Library updates (mutable)**
- Each row: title + description + "Show in app" checkbox + "Email me" checkbox
- Categories: protocol.new_for_owned_device, training.new_module_added

**Quiet hours**
- Toggle: "Pause email notifications during quiet hours"
- If on: time start, time end, timezone select
- Note: "Critical clinical notifications will still send during quiet hours."

Form saves on change with 500ms debounce. Sonner toast confirmation.

---

# UI — Admin Routes

Mirrors portal pattern.

`/admin/notifications` — same as portal but with admin-specific categories. Type pill filters: All / Inbox / Adverse Events / Training / Other.

`/admin/settings/notifications` — categories grouped:
- "Clinical alerts (mandatory)" — adverse_event.new
- "Inbox (mutable)" — lead, demo, contact
- "Operations (mutable)" — training.certification_completed, practice.high_engagement

---

# COMPONENTS

```
components/shared/notifications/
├── NotificationBell.tsx
├── NotificationDropdownPanel.tsx
├── NotificationListItem.tsx
├── CategoryIcon.tsx
├── UnreadBadge.tsx
└── EmptyNotificationsState.tsx

components/portal/notifications/
├── NotificationsList.tsx
├── NotificationsFilterBar.tsx
└── NotificationPreferencesForm.tsx (variant: "portal")

components/admin/notifications/
├── AdminNotificationsList.tsx
├── AdminNotificationsFilterBar.tsx
└── (reuse) NotificationPreferencesForm with variant: "admin"
```

`NotificationPreferencesForm` shared between portal and admin via prop variant.

---

# API ROUTES

Portal:
- `GET /api/portal/notifications` — list with filters
- `POST /api/portal/notifications/[id]/read` — mark single
- `POST /api/portal/notifications/mark-all-read` — bulk
- `GET /api/portal/notifications/unread-count` — for bell
- `GET /api/portal/notifications/preferences`
- `PATCH /api/portal/notifications/preferences`

Admin: same routes under `/api/admin/notifications/*`.

All require `requireUser()`, branch on role for query scope.

---

# REAL-TIME UPDATES

P10 ships polling only:
- Bell badge polls every 60s when tab is foreground
- Pauses on tab background
- Optimistic update on mark-as-read

Real-time push (Supabase Realtime) deferred to Q4 polish.

---

# VERIFICATION

1. `npm run build` clean
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Migration written, NOT applied
5. Manual test sequence (after migration applied):
   - Sign in admin → /admin/notifications → empty
   - Configure preferences → save → reload → persist
6. Trigger each domain event:
   - Submit /demo → admin in-app + email (`inbox.new_demo_request`)
   - Submit /contact → admin in-app + email (`inbox.new_contact_message`)
   - Submit /lead → admin in-app only (`inbox.new_lead`)
   - Practitioner submits adverse-event treatment → admin in-app + email (`adverse_event.new`)
   - Admin marks adverse event addressed → practice in-app + email (`adverse_event.status_updated`)
   - Roni publishes new protocol version → practices that used it get in-app + email (`protocol.updated_for_used_protocol`)
   - Practitioner certifies → admin in-app (`training.certification_completed`)
7. RLS verification:
   - Practice A logs in → only own notifications
   - Cross-practice mark-as-read → blocked
8. Idempotency: duplicate event trigger → single notification
9. Mute test:
   - Mute `inbox.new_lead` → submit lead → no notification
   - Un-mute → next lead triggers
10. Mandatory test:
    - UI prevents muting `adverse_event.new`
    - Server-side: ignores preference if mandatory category
11. Quiet hours test:
    - Set quiet hours 22:00-07:00 CST
    - Trigger non-mandatory event during quiet hours → in-app fires, email skipped (logged)
    - Trigger mandatory event during quiet hours → email sent regardless

---

# PRE-DELIVERY CHECKLIST

- [ ] Tokens-only
- [ ] All migrations held
- [ ] Idempotency via event_id verified
- [ ] Mandatory categories cannot be muted (UI + server)
- [ ] Email templates match brand register
- [ ] Quiet hours respected for non-mandatory
- [ ] No emails in dev (console log)
- [ ] All RLS policies tested
- [ ] Bell polling 60s, pauses on background
- [ ] Mobile bell + dropdown work
- [ ] Mark-as-read optimistic
- [ ] Reduced motion respected
- [ ] All copy [DRAFT]-marked

---

# DELIVERABLES

When done, report:
1. Production preview URLs
2. Lighthouse scores
3. Migration SQL location (held)
4. Components built
5. Email templates added
6. Domain event hooks added (list of routes modified)
7. RLS verification confirmation
8. Idempotency verification
9. Mute + mandatory + quiet hours behavior verified
10. Drafted copy flagged for approval
11. Decisions made not explicit in spec
12. Anything to verify before P11

After P10 is approved + migration applied + manual tests pass, P11 picks up: AI agent integration (all 6 agents wired into admin).
