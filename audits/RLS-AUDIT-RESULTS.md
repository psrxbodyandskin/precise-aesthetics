# RLS Audit Results — P12

**Date:** 2026-05-05
**Method:** Static policy review against `spec/RLS-PATTERNS.md` (every migration 0001–0014, every table) + runtime audit script (`scripts/rls-audit.ts`) for execution against a local Supabase that mirrors prod schema.
**Scope:** All 29 tables in `public` schema across 14 migrations.
**Author:** P12 hardening pass.

---

## Executive summary

| | |
|---|---|
| **Critical findings** | 0 |
| **High findings** | 0 |
| **Medium findings** | 0 |
| **Low findings** | 1 (info-leak via SECURITY DEFINER RPC — see Finding L-1) |
| **By-design notes** | 5 (documented; not gaps) |
| **Dead-table notes** | 3 (documented; deferred to P13 cleanup) |
| **Static review status** | **PASS** — no policy gap blocks launch |
| **Runtime audit status** | Script ready (`scripts/rls-audit.ts`); user runs locally via `supabase start` + `npx tsx scripts/rls-audit.ts` |

**No RLS gap blocks launch.** Every table that handles practice or admin data has the policies its data class demands. By-design exceptions (append-only AEs, no-DELETE notifications, etc.) are documented in this report and in code comments.

---

## Method

1. **Static review.** Every migration 0001–0014 read in full. Each table classified per `spec/RLS-PATTERNS.md`:
   - **Class A** — practice-owned (CRUD own, admin reads all)
   - **Class B** — admin-managed shared (admin all, practice reads relevant)
   - **Class C** — admin-only
   - **append-only** — admin/practice INSERT or service-role only; no UPDATE/DELETE
   - **dead** — pre-portal table left in place for P13 cleanup
2. **Expected matrix encoded.** `scripts/rls-audit-matrix.ts` lists every (table × role × op) cell with the expected outcome.
3. **Runtime script written.** `scripts/rls-audit.ts` provisions four local users (`admin`, `practiceA`, `practiceB`, `anon`), signs each in, runs every cell, reports a markdown table to stdout. Hard-coded refusal to point at any non-local Supabase URL.
4. **User-driven runtime execution.** Per P12 concern #7, the audit runs against local Supabase mirroring prod schema, never against production.

---

## Per-table audit matrix

> Source migration, RLS class, and expected (role × op) outcomes. Failures from the runtime script append below this section after execution.

### P1 — RLS framework (`0004_rls_framework.sql`)

| Table | Class | Helpers used | Notes |
|---|---|---|---|
| `audit_log` | append-only | `is_admin()` | Admin SELECT only. `no_update`/`no_delete` policies enforce append-only. INSERT happens via the `log_audit()` SECURITY DEFINER RPC, never direct. ✓ |

### P1 (initial schema 0001) — pre-portal tables

| Table | Class | Status |
|---|---|---|
| `practitioners` | dead | Pre-portal table from before practice-account model. Old `auth.uid() = id` policies remain. **No active code paths reference it.** Leave in place; P13 cleanup. |
| `treatment_logs` | dead | Same era. Replaced by `treatments` in P6. **No active code paths reference it.** P13. |
| `event_rsvps` | dead | RLS enabled, no policies — service-role only. **No `/api/rsvp` route exists.** Lockout state is correct for an unused table. P13. |

### P2 — practice account model (`0005_practices.sql`, `0006_practice_authorized_users.sql`)

| Table | Class | Helpers | Notes |
|---|---|---|---|
| `practices` | B | `is_admin()`, `current_practice_id()` | Admin CRUD; practice reads own row only. ✓ |
| `practice_users` | A | `is_admin()`, `current_practice_id()` | Practice CRUDs own; admin all. ✓ |
| `devices` | B | `is_admin()`, `is_practice()` | Practice reads `is_active = true` rows. ✓ |
| `practice_devices` | B (read-only for practice) | `is_admin()`, `current_practice_id()` | Admin manages; practice reads its own. No practice writes. ✓ |
| `practice_authorized_users` | A | `is_admin()`, `current_practice_id()` | Practice CRUDs own roster. ✓ |

### P4 — protocol library (`0007_protocols.sql`)

| Table | Class | Notes |
|---|---|---|
| `indication_categories` | B | Admin all; practice reads. ✓ |
| `protocols` | B | Admin all; practice reads device-gated (filter via `applicable_devices` ∩ practice's owned devices). ✓ |
| `protocol_devices` | B | Admin all; practice reads. ✓ |
| `protocol_versions` | append-only | Admin SELECT + INSERT; `no_update`/`no_delete` enforce append-only. Practice reads device-gated. ✓ |

### P6 — treatments (`0008_treatments.sql`)

| Table | Class | Notes |
|---|---|---|
| `treatments` | A | Admin all; practice CRUD own. ✓ |
| `treatment_photos` | A | Admin all; practice CRUD own. ✓ |
| `treatment_adverse_events` | A (restricted) | Admin all; practice INSERT + SELECT own only. **No UPDATE / DELETE for practice — by design** (clinical-incident audit trail; once submitted, only admin manages status). Documented in code (`0008_treatments.sql:225-228`). ✓ |

### P9 — training (`0011_training.sql`, `0012_per_user_certifications.sql`)

| Table | Class | Notes |
|---|---|---|
| `training_modules` | B | Practice reads `is_published = true`. ✓ |
| `training_curricula` | B | Practice reads curricula tied to owned devices. ✓ |
| `curriculum_modules` | B | Join table; practice reads. ✓ |
| `module_materials` | B | Materials read by practice. ✓ |
| `module_progress` | A | Practice CRUD own progress rows. ✓ |
| `practice_certifications` | A (restricted) | Admin all; practice SELECT + INSERT + UPDATE own. **No practice DELETE — by design** (certs are append-only from practice side; admin can revoke). P9.1 added `practice_user_id` (FK to `practice_authorized_users`) — RLS still keys on `practice_id` which remains correct because the column is on the same table. ✓ |

### P8 — inbox (`0010_inbox_status.sql`)

| Table | Class | Notes |
|---|---|---|
| `leads` | special-public-form | Admin all; **anon INSERT** (public form submission). ✓ |
| `demo_requests` | special-public-form | Same. ✓ |
| `contact_messages` | special-public-form | Same. P11 added `enrichment_data` + `enriched_at` columns in `0014_agent_runs.sql`. RLS unchanged — column-level access not segmented. ✓ |

### P10 — notifications (`0013_notifications.sql`)

| Table | Class | Notes |
|---|---|---|
| `notifications` | A (restricted) | Admin all; practice SELECT + UPDATE own (mark-as-read). **No practice INSERT — by design** (server-side only via service role). **No practice DELETE — by design** (notifications are read-only audit trail). ✓ |
| `notification_preferences` | A (with admin self-write) | Admin manages all; admin can also write own (admin users have notification preferences too). Practice CRUDs own. ✓ |
| `notification_dispatch_log` | C | Admin SELECT only. Service-role inserts dispatch records server-side. ✓ |

### P11 — agent runs (`0014_agent_runs.sql`)

| Table | Class | Notes |
|---|---|---|
| `agent_runs` | C | Admin all only. Class C is correct for AI agent audit trail — practice never sees this surface. ✓ |

---

## Findings

### Finding L-1 (LOW) — `is_user_certified_for_device(p_practice_user_id, p_device_id)` is unrestricted

**Severity:** Low
**File:** `supabase/migrations/0012_per_user_certifications.sql:161-180`

The function is `SECURITY DEFINER`, returns boolean for "is user X certified for device Y", and accepts any `practice_user_id` from any practice without an `is_admin()` or "same practice" gate.

**Impact:** A practice user could probe whether a specific user on another practice is certified for a specific device. The information leaked is a single boolean. No PHI involved.

**Why low and not medium:**
- Caller would need to know the target practice's `practice_user_id` UUID (not enumerable from anywhere they can reach)
- Output is a boolean; no detail about who, when, or what curriculum
- The legitimate caller (treatment POST gate) already passes the calling user's own ID — adding a "same practice" gate is correct hardening but doesn't fix an active exploit

**Recommendation:** Add `practice_user_id IN (SELECT id FROM practice_authorized_users WHERE practice_id = current_practice_id())` guard. Track as **P13 hardening**, not P12 (would require migration; user said all migrations held). Alternatively: leave `SECURITY DEFINER`, add `IF NOT (is_admin() OR EXISTS ...)` guard to the function body.

**Status:** **Documented, deferred to P13.** Not blocking launch.

---

### By-design notes (not gaps)

| # | Table | Note |
|---|---|---|
| BD-1 | `treatment_adverse_events` | Practice can INSERT + SELECT but not UPDATE/DELETE. Clinical-incident integrity. |
| BD-2 | `practice_certifications` | Practice can SELECT/INSERT/UPDATE but not DELETE. Certifications are append-only from practice side. |
| BD-3 | `notifications` | Practice can SELECT + UPDATE (mark-as-read) but not INSERT or DELETE. Server-only insertion; read-only audit trail. |
| BD-4 | `audit_log`, `protocol_versions` | Append-only via `no_update` / `no_delete` policies. Audit + version history integrity. |
| BD-5 | `event_rsvps` | RLS enabled, zero policies — full lockout. Service-role only path was the design; the API route never shipped. Acceptable lockout for an unused table; P13 cleanup. |

---

## Pre-delivery checklist (Phase A)

- [x] Every table from migrations 0001–0014 enumerated
- [x] Each table classified per RLS-PATTERNS.md (A / B / C / append-only / special / dead)
- [x] Every table has RLS enabled (`alter table ... enable row level security` confirmed in source)
- [x] Helper-function usage spot-checked: policies use `public.is_admin()`, `public.is_practice()`, `public.current_practice_id()` consistently from P2 onward
- [x] Append-only enforcement verified for `audit_log` and `protocol_versions` (`no_update` + `no_delete` policies present)
- [x] Service-role bypass usage audited at the spec level — used in API routes for cross-cutting writes (audit log, notifications, agent_runs); the application layer verifies authorization first
- [x] Runtime audit script (`scripts/rls-audit.ts`) authored; refuses to run against non-local Supabase URL; ready for user execution
- [x] Expected matrix encoded as TypeScript (`scripts/rls-audit-matrix.ts`) — single source of truth, imported by the runner
- [x] Findings classified; one LOW (info-leak via RPC), zero critical/high/medium
- [x] `.env.audit.example` template created

---

## Runtime audit — operator instructions

1. Ensure Docker is running.
2. From repo root:
   ```
   supabase start
   supabase db reset --local      # applies all migrations in supabase/migrations/
   ```
3. Copy `.env.audit.example` → `.env.audit`. Populate from `supabase status` output:
   - `SUPABASE_URL` (typically `http://127.0.0.1:54321`)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
4. Run:
   ```
   npx tsx scripts/rls-audit.ts > audits/RLS-AUDIT-RUN.md
   ```
5. Review `RLS-AUDIT-RUN.md`. Any cell with `pass = ✗` is a runtime gap; investigate before concluding.
6. The script is idempotent — test users/practices upserted on each run.

**The runtime script is for your local execution.** Do not invoke against production. The script's URL guard refuses; treat that guard as belt-and-suspenders.

---

## What changed during P12 Phase A

- **Created:** `scripts/rls-audit-matrix.ts` (expected matrix as TypeScript)
- **Created:** `scripts/rls-audit.ts` (runtime audit runner)
- **Created:** `.env.audit.example` (env template for the runner)
- **Created:** This document.
- **Schema:** No migrations created. All RLS policies untouched. (Per concern-7 answer: hardening only — destructive policy edits go to P13.)

---

## Items deferred from Phase A

- **P13:** `is_user_certified_for_device` RPC gate (Finding L-1)
- **P13:** Cleanup of dead tables (`practitioners`, `treatment_logs`, `event_rsvps`)
- **P12.5 / runtime:** Operator runs `npx tsx scripts/rls-audit.ts` and pastes results here

---

**Phase A status: COMPLETE — no critical/high/medium findings, one low documented for P13. Cleared to proceed to Phase B (security audit + rate limiting).**
