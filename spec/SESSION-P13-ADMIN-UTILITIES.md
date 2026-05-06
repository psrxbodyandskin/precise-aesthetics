# Session P13 — Admin Utilities (Help Chatbot + Vendor Directory + Stack Reference)

> Run after P12 (Hardening + Runbook) is deployed. Builds three admin-only utilities: AI-powered help chatbot, vendor contact directory, and stack reference page. All small CRUD work plus one chatbot agent. Single session.

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/PORTAL-MASTER-SPEC.md`
6. `spec/RLS-PATTERNS.md`
7. `spec/SESSION-P11-AI-AGENTS.md` (chatbot reuses agent infrastructure)
8. `spec/SESSION-P12-HARDENING-RUNBOOK.md` (rate limiting pattern)
9. This spec

---

## The Three Components

**1. Help chatbot.** Floating button bottom-right on every admin page. Roni clicks, asks questions, gets answers from a curated knowledge base via Haiku. No live database access — purely instructional.

**2. Vendor directory.** Admin CRUD page for tracking every business contact: manufacturers, software vendors, service providers. Searchable, filterable.

**3. Stack reference.** Admin CRUD page for tracking every system: env var names (NOT values), where credentials live, monthly costs, renewal dates. NO actual secrets stored — pointer directory only.

All three are admin-only, no practitioner-facing surface, building on existing patterns.

---

## Goal

After this session:
- Floating help chatbot accessible from every `/admin/*` page
- Knowledge base of system instructions (drafted in this session, expanded post-launch from real questions)
- `/admin/vendors` — directory list + detail + create + edit
- `/admin/stack` — system reference list + detail + create + edit
- AdminSidebar updated with Vendors + Stack entries
- All three RLS Class C (admin-only)
- Cost tracking for chatbot via existing `agent_runs` infrastructure
- All migrations held for manual review

---

## What Gets Built

### Database
- `vendors` table — vendor records
- `stack_services` table — service records
- `stack_env_vars` table — env var name + service mapping
- Migration `0015_admin_utilities.sql` (single migration, three tables)

### Server-side
- `lib/agents/help-assistant.ts` — Haiku agent with knowledge base system prompt
- `lib/admin/vendors.ts` — CRUD data layer
- `lib/admin/stack.ts` — CRUD data layer
- Help knowledge base content as a constant (`lib/help/knowledge-base.ts`)

### API routes
- `POST /api/admin/help/chat` — chatbot endpoint (rate-limited 30/admin/hour)
- `GET /api/admin/vendors`, `POST`, plus `[id]` GET/PATCH/DELETE
- `GET /api/admin/stack`, `POST`, plus `[id]` GET/PATCH/DELETE
- `GET /api/admin/stack/[id]/env-vars`, `POST`, `DELETE [varId]`

### UI
- Help chatbot floating button + side panel (every admin page)
- `/admin/vendors` — list with filters
- `/admin/vendors/[id]` — detail/edit
- `/admin/vendors/new` — create
- `/admin/stack` — list grouped by category
- `/admin/stack/[id]` — detail/edit with env var management
- `/admin/stack/new` — create
- AdminSidebar updates

---

## Critical Constraints

1. **Build on P1-P12 foundation.** Use `requireAdmin()`, RLS Class C, audit log, existing patterns.
2. **MASTER.md tokens only.** No new colors, fonts, icons.
3. **NO actual secrets stored in stack reference.** Just env var names and storage location pointers (e.g., "stored in 1Password vault: Precise Aesthetics > Production"). Never the value itself.
4. **Help chatbot has no live database access.** Pure inference over knowledge base. Don't pass live data to the LLM.
5. **Chatbot conversations are session-only.** No persistence across sessions. Reset on page reload. (Logged to agent_runs for cost tracking, but conversation history doesn't persist back to user.)
6. **All migrations held for manual review.**
7. **Mobile-friendly chatbot panel.** Roni uses admin from her phone.

---

# DATA MODEL

## Migration: `0015_admin_utilities.sql`

```sql
-- Vendors
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  name text not null,
  category text not null check (category in (
    'manufacturer',
    'software_vendor',
    'service_provider',
    'logistics',
    'professional_services',
    'other'
  )),
  description text, -- what they provide
  
  -- Primary contact
  contact_name text,
  contact_email text,
  contact_phone text,
  
  -- Messaging handles
  whatsapp text,
  telegram text,
  signal text,
  
  -- Web presence
  website text,
  
  -- Account info
  account_id text, -- our customer ID with them
  
  -- Internal notes
  notes text,
  
  -- Status
  status text not null default 'active' check (status in ('active', 'paused', 'former')),
  
  -- Metadata
  created_by uuid references auth.users(id),
  last_updated_by uuid references auth.users(id)
);

create index idx_vendors_category on public.vendors(category);
create index idx_vendors_status on public.vendors(status);
create index idx_vendors_name on public.vendors(name);

create trigger trg_vendors_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();

-- Stack services
create table public.stack_services (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  name text not null, -- e.g., "Vercel", "Supabase", "Anthropic"
  category text not null check (category in (
    'hosting',
    'database',
    'auth',
    'email',
    'cms',
    'ai',
    'analytics',
    'monitoring',
    'storage',
    'domain',
    'payment',
    'other'
  )),
  
  what_it_does text not null, -- one-line description
  
  -- Plan/tier info
  plan_tier text, -- e.g., "Pro", "Team", "Enterprise"
  monthly_cost_estimate_usd numeric(10, 2),
  renewal_date date,
  
  -- Access info
  login_url text,
  account_owner_user_id uuid references auth.users(id),
  
  -- Where credentials live (NOT the credentials themselves)
  credentials_storage_location text, -- e.g., "1Password: Precise Production vault"
  
  -- Support
  support_contact text, -- email or URL
  documentation_links text, -- markdown links
  
  -- Status
  status text not null default 'active' check (status in ('active', 'paused', 'former')),
  
  -- Internal notes
  notes text,
  
  -- Metadata
  created_by uuid references auth.users(id),
  last_updated_by uuid references auth.users(id)
);

create index idx_stack_services_category on public.stack_services(category);
create index idx_stack_services_status on public.stack_services(status);

create trigger trg_stack_services_updated_at
  before update on public.stack_services
  for each row execute function public.set_updated_at();

-- Stack env vars (per service)
create table public.stack_env_vars (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  
  service_id uuid not null references public.stack_services(id) on delete cascade,
  
  -- Just the name, never the value
  var_name text not null, -- e.g., "ANTHROPIC_API_KEY"
  description text,
  
  -- Where the value is set
  set_in_vercel boolean not null default false,
  set_in_local_env boolean not null default false,
  
  -- Sensitivity classification
  is_secret boolean not null default true,
  
  unique(service_id, var_name)
);

create index idx_stack_env_vars_service_id on public.stack_env_vars(service_id);

-- RLS — all three Class C (admin only)
alter table public.vendors enable row level security;
alter table public.stack_services enable row level security;
alter table public.stack_env_vars enable row level security;

create policy vendors_admin_all on public.vendors
  for all using (public.is_admin()) with check (public.is_admin());

create policy stack_services_admin_all on public.stack_services
  for all using (public.is_admin()) with check (public.is_admin());

create policy stack_env_vars_admin_all on public.stack_env_vars
  for all using (public.is_admin()) with check (public.is_admin());

-- Practices never see any of these tables
```

---

# HELP CHATBOT

## Architecture

Single agent, single endpoint, conversation maintained in client state (not server-side persistence).

**Flow:**
1. Roni clicks floating help button → side panel slides in from right
2. Side panel shows: chat history (current session) + input field + send button
3. Roni types question, hits send
4. Client sends `POST /api/admin/help/chat` with `{ messages: [...full conversation history] }`
5. Server: `requireAdmin()`, rate limit check (30/admin/hour), call Haiku via `runAgent()`
6. Server returns answer
7. Client appends to conversation, scrolls to bottom

**On page navigation or reload:** conversation resets. No persistence intentional — keeps the chatbot stateless and predictable.

## Knowledge base

**File:** `lib/help/knowledge-base.ts`

Exports a single string constant — the system prompt that contains all instructional content.

**Initial knowledge base structure (sections to draft):**

```typescript
export const HELP_KNOWLEDGE_BASE = `You are the Precise Aesthetics admin help assistant. Answer questions about how the admin system works based on the knowledge below. Be concise and specific. If a question is about something not covered here, say so clearly.

Voice: helpful, calm, factual. No marketing language.

# How the admin system works

## Practices and provisioning

To provision a new practice:
1. Navigate to /admin/practices
2. Click "+ New practice"
3. Fill in the form: practice name, primary email, primary contact name, address, phone, devices owned
4. Submit
5. The practice receives an invite email via Resend
6. They click the invite link, set their password, complete the 7-step setup wizard
7. Their status changes from "pending" to "active" automatically

To edit a practice: navigate to /admin/practices/[id] and use inline edit on each field.

To assign devices to a practice: on the practice detail page, use the Devices section to add or remove device assignments.

## Protocols

Protocols are authored in Sanity Studio at /studio. When you publish a protocol, a webhook syncs it to Supabase and makes it visible to practices that own the matching device.

Protocol versioning: when you republish a protocol, a new version snapshot is created. Treatments reference the version that was active when they were logged — historical treatments don't change when you publish updates.

## Inbox

The /admin/inbox page shows all inbound from the marketing site:
- Leads (homepage email captures)
- Demo requests (/demo form)
- Contact messages (/contact form)

Filter by type using the pills. Filter by status using the dropdown.

Status workflow: new → contacted → qualified → closed. Click a row to see full detail and update status.

When a new submission arrives, you receive a notification (in-app and email for demo + contact, in-app only for leads).

Lead Enricher (AI) auto-runs on each new submission and populates the Enrichment section with inferred practice info.

## AI agents

The system has six AI agents in /admin/ai:
- Pattern Analyst — analyzes treatment outcome data, surfaces patterns
- Protocol Drafter — drafts protocol updates based on your direction
- Practice Health Reviewer — flags practices needing attention
- Communication Drafter — drafts emails in brand voice
- Query Assistant — translates natural-language questions into SQL queries
- Lead Enricher — auto-runs on new leads (no manual trigger needed)

All agent runs are logged at /admin/ai/runs with cost tracking at /admin/ai/cost.

To run an agent:
- Pattern Analyst: dashboard, click "Analyze outcomes"
- Protocol Drafter: dashboard or protocol detail page
- Practice Health Reviewer: dashboard, "Review practices"
- Communication Drafter: any inbox detail or practice detail, "Draft email"
- Query Assistant: /admin/ai/query

## Notifications

You receive notifications for:
- Adverse events (mandatory, can't be muted)
- New inbox submissions (mutable)
- Certification completions (mutable)

Configure preferences at /admin/settings/notifications. Set quiet hours to pause non-mandatory emails during off-hours.

The bell icon in the sidebar shows unread count. Click for recent notifications, full list at /admin/notifications.

## Treatments and adverse events

Practices log treatments at /portal/treatments/new. They must be certified for the device first.

When a practice flags an adverse event, you receive a notification (mandatory). Review at /admin/adverse-events.

Workflow on adverse events: new → reviewing → addressed.

## Training and certification

Training curricula tied to devices. Each device has one curriculum.

Authoring: /admin/training. Create curriculum, add modules with videos and supporting materials. Publish when ready.

Practices see their own curriculum at /portal/training. They watch videos to 90%, acknowledge, and complete certification per user.

A practice user must be certified before they can be selected as "entered by" on a treatment for that device.

## Vendor directory

/admin/vendors — track every business contact (manufacturers, software vendors, service providers). Search and filter by category.

## Stack reference

/admin/stack — track every system we use, plan tier, monthly cost, env var names (not values), where credentials live.

## Common workflows

To send a follow-up email to a lead:
1. Go to /admin/inbox/lead/[id]
2. Click "Draft email"
3. Choose purpose (welcome, follow up, address concern, custom)
4. Communication Drafter generates 2 alternatives
5. Pick one, click "Use this" — copies to clipboard with mailto: link
6. Edit and send from your mail client
7. Update status to "contacted"

To investigate adverse event patterns:
1. Go to /admin/dashboard
2. In adverse events panel, click "Analyze adverse event patterns"
3. Pattern Analyst surfaces statistically significant findings
4. Review, replay if needed
5. If pattern suggests protocol refinement, use Protocol Drafter for next steps

To check who's certified at a practice:
1. Go to /admin/practices/[id]
2. Section: Certifications shows status per device + per user

## Things this assistant can't help with

- Writing actual code or SQL
- Accessing live database to look up specific records (use the Query Assistant for that)
- Sending emails on your behalf (Communication Drafter generates drafts only)
- Modifying production data
`;
```

This is the v1 knowledge base. Post-launch, expand based on Roni's actual questions.

## Help chatbot agent

**File:** `lib/agents/help-assistant.ts`

```typescript
import { runAgent } from "@/lib/agents/base";
import { HELP_KNOWLEDGE_BASE } from "@/lib/help/knowledge-base";

export interface HelpChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function runHelpAssistant(params: {
  triggeredByUserId: string;
  messages: HelpChatMessage[];
}) {
  // Build conversation context for Haiku
  const conversationText = params.messages
    .map(m => `${m.role === 'user' ? 'Question' : 'Answer'}: ${m.content}`)
    .join('\n\n');
  
  const userMessage = `Conversation so far:\n\n${conversationText}\n\nProvide the next answer.`;
  
  return await runAgent({
    agentType: 'help_assistant',
    model: 'claude-haiku-4-5',
    systemPrompt: HELP_KNOWLEDGE_BASE,
    userMessage,
    triggeredByUserId: params.triggeredByUserId,
    triggerType: 'manual',
    maxTokens: 1024, // Help answers should be concise
    temperature: 0.5, // Lower temp for consistency
  });
}
```

**Add `'help_assistant'` to the `agent_type` check constraint in `agent_runs` table.** Migration 0015 includes this:

```sql
alter table public.agent_runs 
  drop constraint if exists agent_runs_agent_type_check;

alter table public.agent_runs
  add constraint agent_runs_agent_type_check check (agent_type in (
    'pattern_analyst',
    'protocol_drafter',
    'practice_health_reviewer',
    'communication_drafter',
    'query_assistant',
    'lead_enricher',
    'help_assistant'
  ));
```

## API route

**File:** `app/api/admin/help/chat/route.ts`

```typescript
export async function POST(req: Request) {
  await requireAdmin();
  
  // Rate limit: 30 chat messages per admin per hour (more permissive than other agents since it's instructional)
  const rateLimitOk = await helpChatRateLimit(req);
  if (!rateLimitOk) return new Response("Rate limited", { status: 429 });
  
  const { messages } = await req.json();
  // Validate messages array
  
  const result = await runHelpAssistant({
    triggeredByUserId: currentUserId,
    messages,
  });
  
  return Response.json({
    answer: result.output,
    cost: result.cost,
    runId: result.runId,
  });
}
```

Add `helpChatRateLimit` helper to `lib/rate-limit.ts` mirroring `agentRateLimit` but with 30/hour bucket.

## UI Components

```
components/admin/help/
├── HelpFloatingButton.tsx        (client — floating bottom-right)
├── HelpChatPanel.tsx             (client — slide-in panel)
├── HelpMessageList.tsx           (client — scrollable conversation)
├── HelpMessageBubble.tsx         (server — single message)
├── HelpInputField.tsx            (client — textarea + send button)
└── HelpEmptyState.tsx            (server — initial panel state)
```

**HelpFloatingButton:**
- Fixed position: bottom-right, 24px from edge
- Circular button, 56px diameter
- Background: brand-700
- Icon: Lucide `MessageCircleQuestion` (or P|A monogram if available)
- Hover: subtle scale + shadow
- z-index above page content but below modals
- Click → opens HelpChatPanel

**HelpChatPanel:**
- Slide-in from right
- Width: 400px desktop, full-width on mobile
- Height: 80vh, anchored bottom-right
- Header: "Help" title + close button (X)
- Body: HelpMessageList (scrolls to bottom on new message)
- Footer: HelpInputField

**Empty state copy:**
- "Ask anything about how the system works."
- Suggested questions as clickable chips:
  - "How do I publish a protocol?"
  - "How do I review adverse events?"
  - "How do AI agents work?"

**Message bubble styling:**
- User: right-aligned, bone-100 background, ink-900 text
- Assistant: left-aligned, brand-100 background, ink-900 text, with small "Help" label above

**Loading state during AI response:**
- Three-dot pulse animation (`...`)
- "Thinking..." text below
- Cancel button to abort the request

**Error state:**
- "Unable to get an answer right now. Try again or rephrase."
- Retry button

## Wiring into AdminLayout

`HelpFloatingButton` rendered globally in `app/(admin)/layout.tsx`. Available on every admin page.

State managed via simple React context provider — `HelpChatProvider` holds the conversation messages array, panel open/closed state.

---

# VENDOR DIRECTORY

## Routes

- `/admin/vendors` — list view
- `/admin/vendors/new` — create
- `/admin/vendors/[id]` — detail + edit

## List view (`/admin/vendors`)

Page header:
```
Eyebrow: § ADMIN
H1: Vendors.
Lead: Track every business contact in one place.
Action: "+ New vendor" (top-right)
```

Filter bar:
- Search (searches name + description + contact_name + contact_email)
- Category multi-select dropdown
- Status filter (active / paused / former / all)

Table:
- Name (clickable to detail)
- Category (chip)
- Description
- Contact (name + email)
- Status (chip)
- Last updated
- Click row → /admin/vendors/[id]

Empty states: no vendors yet, no matches.

## Create form (`/admin/vendors/new`)

Sections:

**Identity**
- Name (required)
- Category (required dropdown)
- Description (textarea)
- Status (default "active")

**Primary contact**
- Contact name
- Contact email
- Contact phone

**Messaging handles**
- WhatsApp
- Telegram
- Signal

**Web presence**
- Website URL
- Account/customer ID with this vendor

**Internal**
- Notes (textarea, internal-only)

Submit: creates vendor, redirects to detail view.

## Detail view (`/admin/vendors/[id]`)

Same fields as create, edit-in-place per section (same pattern as `/admin/practices/[id]` from P2).

Action buttons:
- Status workflow: Mark as paused / Mark as former / Reactivate (depending on current state)
- Delete (with confirmation modal — soft delete by setting status='former' rather than hard delete)

Audit log section at bottom showing all changes.

## Components

```
components/admin/vendors/
├── VendorsListView.tsx           (server — table)
├── VendorsFilterBar.tsx          (client — search + filter)
├── VendorRow.tsx                 (server — single row)
├── VendorDetailView.tsx          (server — wraps edit sections)
├── VendorIdentitySection.tsx
├── VendorContactSection.tsx
├── VendorMessagingSection.tsx
├── VendorWebSection.tsx
├── VendorNotesSection.tsx
├── VendorStatusActions.tsx
└── VendorCategoryChip.tsx
```

Each section uses inline edit pattern: hover shows edit pencil, click → edit mode, save on blur or explicit save.

---

# STACK REFERENCE

## Routes

- `/admin/stack` — services list (grouped by category)
- `/admin/stack/new` — create service
- `/admin/stack/[id]` — service detail + env vars management

## List view (`/admin/stack`)

Page header:
```
Eyebrow: § ADMIN
H1: Stack reference.
Lead: Every system we use, every env var name, where the credentials live. NO actual secrets stored here.
Action: "+ New service" (top-right)
```

Filter bar:
- Category filter (all / hosting / database / auth / email / cms / ai / analytics / monitoring / etc.)
- Status filter (active / paused / former / all)

**Services grouped by category:**

```
HOSTING
─────────────────
Vercel · Pro · $20/mo · Renews 2026-12-15
GitHub · Team · $4/mo · Renews 2026-08-01

DATABASE
─────────────────
Supabase · Pro · $25/mo · Renews 2026-09-12

AI
─────────────────
Anthropic · Pay-as-you-go · ~$15/mo · No renewal

...
```

Each service card shows: name + plan + cost + renewal. Click → detail view.

Cost summary at top: "Total monthly stack cost: ~$XX/mo across N services."

## Detail view (`/admin/stack/[id]`)

Sections:

**Identity**
- Service name
- Category
- What it does (one-line)
- Status

**Plan + cost**
- Plan/tier
- Monthly cost estimate
- Renewal date

**Access**
- Login URL (clickable)
- Account owner (admin user dropdown)
- Credentials storage location (free text — e.g., "1Password: Precise Production vault > Vercel admin")

**Env variables (separate section with table)**
- For each env var:
  - Var name
  - Description
  - Set in Vercel: yes/no
  - Set in local env: yes/no
  - Is secret: yes/no
- "+ Add env var" button

**Support + docs**
- Support contact
- Documentation links (markdown)

**Internal notes**
- Free text

**SECURITY WARNING BANNER (always visible):**

```
⚠ Never paste actual secret values here. Only env var names + 
where the value is stored.
```

Banner is brand-700 background, cream-100 text. Dismissable per-session but always re-renders on page reload. Critical guardrail to prevent operator mistakes.

## Components

```
components/admin/stack/
├── StackServicesList.tsx              (server — grouped by category)
├── StackServiceCard.tsx               (server — list item)
├── StackCostSummary.tsx               (server — top stat)
├── StackDetailView.tsx                (server — wraps sections)
├── StackIdentitySection.tsx
├── StackPlanCostSection.tsx
├── StackAccessSection.tsx
├── StackEnvVarsTable.tsx              (client — add/remove rows)
├── StackEnvVarRow.tsx
├── StackAddEnvVarModal.tsx            (client — form for new env var)
├── StackSupportSection.tsx
├── StackNotesSection.tsx
├── StackCategoryChip.tsx
└── StackSecurityBanner.tsx            (always visible, sticky)
```

## Validation

In the env var add modal:
- Var name required (validated to be uppercase + underscores: `^[A-Z][A-Z0-9_]*$`)
- Description optional but encouraged
- Set-in flags + is-secret flag default to true (assume secret until told otherwise)

**Server-side validation: reject any env var with a `value` field in the request body.** Even if frontend prevents it, server enforces — never accept value data, ever. Document this enforcement clearly in the route handler.

---

# ADMIN SIDEBAR UPDATE

`AdminSidebar.tsx` NAV_ITEMS — add Vendors + Stack at the bottom of the main nav (before AI section):

```
1. Dashboard
2. Practices
3. Inbox
4. Adverse Events
5. Protocols
6. Training
7. Vendors           (NEW)
8. Stack             (NEW)
─── AI ───
Query / Runs / Cost
```

The help chatbot floating button is global, not in the sidebar.

---

# DATA LAYER

## `lib/admin/vendors.ts`

```typescript
import "server-only";

export async function listVendors(filters: {
  search?: string;
  categories?: string[];
  status?: string;
});

export async function getVendorById(id: string);
export async function createVendor(data: VendorInput, actorId: string);
export async function updateVendor(id: string, data: Partial<VendorInput>, actorId: string);
export async function softDeleteVendor(id: string, actorId: string); // sets status='former'
```

All call `logAudit()` with verbs: `vendor.created`, `vendor.updated`, `vendor.archived`.

## `lib/admin/stack.ts`

```typescript
import "server-only";

export async function listStackServices(filters: {
  categories?: string[];
  status?: string;
});

export async function getStackServiceById(id: string);
export async function createStackService(data: StackServiceInput, actorId: string);
export async function updateStackService(id: string, data: Partial<StackServiceInput>, actorId: string);

export async function listEnvVarsForService(serviceId: string);
export async function addEnvVar(serviceId: string, data: EnvVarInput, actorId: string);
export async function removeEnvVar(varId: string, actorId: string);

export async function getTotalMonthlyCost(); // sum of monthly_cost_estimate_usd for active services
```

All call `logAudit()`.

---

# API ROUTES

All under `/api/admin/*`, all `requireAdmin()`:

**Help:**
- `POST /api/admin/help/chat` — chatbot

**Vendors:**
- `GET /api/admin/vendors` — list with filters
- `POST /api/admin/vendors` — create
- `GET /api/admin/vendors/[id]` — detail
- `PATCH /api/admin/vendors/[id]` — update
- `DELETE /api/admin/vendors/[id]` — soft delete (status='former')

**Stack:**
- `GET /api/admin/stack` — list services
- `POST /api/admin/stack` — create service
- `GET /api/admin/stack/[id]` — service detail
- `PATCH /api/admin/stack/[id]` — update service
- `DELETE /api/admin/stack/[id]` — soft delete (status='former')
- `GET /api/admin/stack/[id]/env-vars` — list env vars for service
- `POST /api/admin/stack/[id]/env-vars` — add env var (server enforces no value field)
- `DELETE /api/admin/stack/env-vars/[varId]` — remove env var

---

# VERIFICATION

Before declaring done:

1. `npm run build` clean
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Migration 0015 written, NOT applied
5. Manual test sequence (after migration applied):
   
   **Help chatbot:**
   - Sign in as admin on any /admin/* page
   - See floating help button bottom-right
   - Click → side panel opens
   - Empty state shows suggested questions
   - Click a suggested question → it sends as user message
   - Receive answer from Haiku
   - Verify agent_runs row created with agent_type='help_assistant', model='claude-haiku-4-5'
   - Verify cost tracked
   - Continue conversation → context preserved across messages
   - Reload page → conversation resets
   - Test rate limit by sending 30+ messages rapidly → blocked at 30/hour
   - Test on mobile (375px) → panel renders full-width, usable
   
   **Vendor directory:**
   - Visit /admin/vendors → empty state
   - Click "+ New vendor" → form renders
   - Submit valid vendor → redirects to detail view
   - Edit each section inline → changes persist, audit log entries written
   - Filter by category, by status, search by name → results filter correctly
   - Mark as former → status updates, vendor still in list (filtered when status='active')
   
   **Stack reference:**
   - Visit /admin/stack → empty state
   - Click "+ New service" → form
   - Submit service (e.g., "Vercel" with plan, cost, login URL)
   - Detail view: add env var → row in env_vars table
   - Try API call to add env var with `value` field → server rejects
   - Cost summary on list view sums correctly
   - Security banner always visible
   - Test markdown rendering on documentation_links field
6. RLS verification:
   - Practice user attempting /admin/vendors → blocked
   - Practice user attempting /api/admin/stack → 403
7. Audit log verification:
   - Every CRUD action writes to audit_log

---

# PRE-DELIVERY CHECKLIST

- [ ] Tokens-only, no new colors/fonts/icons
- [ ] All migrations held for manual review
- [ ] Help chatbot has NO live database access (only knowledge base context)
- [ ] Stack reference has NO actual secrets (server rejects value field)
- [ ] Help chatbot rate-limited (30/admin/hour)
- [ ] Conversation history client-only (no server persistence)
- [ ] All RLS policies tested
- [ ] Mobile-friendly chatbot panel
- [ ] Security banner always visible on stack detail
- [ ] All admin writes hit logAudit()
- [ ] Reduced motion respected
- [ ] All copy [DRAFT]-marked

---

# DELIVERABLES

When done, report:
1. Production preview URLs (`/admin/vendors`, `/admin/stack`, plus help button verification screenshot)
2. Lighthouse scores
3. Migration SQL location (held)
4. Components built
5. Drafted copy flagged for approval (especially the knowledge base content)
6. Help chatbot test results (sample Q&A, cost per interaction)
7. RLS verification confirmation
8. Audit log verification confirmation
9. Server-side secret rejection verification
10. Decisions made not explicit in spec
11. Anything to verify before P12.5

After P13 is approved + migration applied + manual tests pass, P12.5 polish pass runs autonomously, then we hit the launch ritual.
