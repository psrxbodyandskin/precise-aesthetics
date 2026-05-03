# RLS Patterns

> Canonical Row-Level Security conventions for portal/admin tables.
> Locked in Session P1; followed by every migration from P2 onward.

---

## Foundations (already in `0004_rls_framework.sql`)

Three SQL helper functions, available to every policy:

| Function | Returns | Source |
|---|---|---|
| `public.auth_role()` | `text` | `auth.jwt() -> 'app_metadata' ->> 'role'` |
| `public.is_admin()` | `boolean` | `auth_role() = 'admin'` |
| `public.is_practice()` | `boolean` | `auth_role() = 'practice'` |
| `public.current_practice_id()` | `uuid` | `auth.jwt() -> 'app_metadata' ->> 'practice_id'` |

**Role lives in `app_metadata`, never `user_metadata`.** `user_metadata` is user-editable through Supabase's standard auth update endpoint — storing role there allows any authenticated user to promote themselves to admin. `app_metadata` is admin-only writable (service-role key required), making it the only trustworthy authorization claim.

**`practice_id` lives in `app_metadata` for the same reason.** It's set during practice provisioning (P2) and never changed by the user.

---

## Table classification

Every table created in P2+ falls into one of three classes. Each class has a fixed policy template — applied verbatim per migration.

### Class A — Practice-owned (most portal data)

Treatment logs, photos, notifications, settings, practice-specific protocol notes. Practice can CRUD their own rows. Admin can read all.

**Required column:** `practice_id uuid not null references public.practices(id) on delete cascade`

**Required index:** `create index idx_<table>_practice on public.<table> (practice_id);`

**Policy template:**

```sql
alter table public.<table> enable row level security;

create policy "<table> read: own practice"
  on public.<table> for select
  using (practice_id = public.current_practice_id());

create policy "<table> insert: own practice"
  on public.<table> for insert
  with check (practice_id = public.current_practice_id());

create policy "<table> update: own practice"
  on public.<table> for update
  using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

create policy "<table> delete: own practice"
  on public.<table> for delete
  using (practice_id = public.current_practice_id());

create policy "<table> read: admin all"
  on public.<table> for select
  using (public.is_admin());
```

Note: admin write policies are *not* part of this template. If admins need to write to a practice-owned table for a specific feature (e.g., adverse event status updates), add that policy explicitly with a clear name and an audit-log requirement.

### Class B — Admin-managed shared content (protocol library, training assets, devices)

Authoring lives with admins. Practices read what's relevant to their owned devices. No practice writes.

**Policy template:**

```sql
alter table public.<table> enable row level security;

create policy "<table> read: practice"
  on public.<table> for select
  using (public.is_practice() and <device-or-status filter>);

create policy "<table> read: admin"
  on public.<table> for select
  using (public.is_admin());

create policy "<table> insert/update/delete: admin"
  on public.<table> for all
  using (public.is_admin())
  with check (public.is_admin());
```

The `<device-or-status filter>` is per-table. For protocols: `applicable_devices && (select owned_devices from practices where id = current_practice_id())`. For training assets: `is_published = true`.

### Class C — Admin-only (audit log, internal tools, AI agent runs, lead inbox)

Practices never see these. Admin reads all; some are append-only.

**Policy template:**

```sql
alter table public.<table> enable row level security;

create policy "<table> read: admin"
  on public.<table> for select
  using (public.is_admin());

create policy "<table> write: admin"
  on public.<table> for all
  using (public.is_admin())
  with check (public.is_admin());

-- For append-only tables (audit_log pattern): add explicit no-update + no-delete:
-- create policy "<table> no_update" on public.<table> for update using (false);
-- create policy "<table> no_delete" on public.<table> for delete using (false);
```

---

## Service-role bypass

The service-role Supabase client (used by trusted server code in `/api/*` routes via `getServiceClient()`) bypasses RLS entirely. Use it sparingly and only where the application layer has already verified authorization (e.g., the auth callback writing to its own log entry).

Service-role inserts to `public.audit_log` are the canonical example: the application has already verified the actor's role; the DB just stores.

---

## Audit logging

Every admin write action is logged. Pattern:

```ts
// In an admin-only server action / route handler:
await getServiceClient().rpc("log_audit", {
  p_actor_id: user.id,
  p_actor_role: user.role,
  p_action: "practice.invite",
  p_target_type: "practice",
  p_target_id: newPracticeId,
  p_metadata: { email: targetEmail },
  p_ip_address: getClientIp(req.headers),
});
```

`log_audit()` is `security definer` so the policy on `audit_log` doesn't need an explicit insert policy for the service role — the function call inserts on behalf of the caller.

**Required for:** account provisioning (P2), protocol publish/unpublish (P4), adverse event status changes (P6/P7), admin-initiated communications (P8/P11). Optional but recommended for read events on sensitive PHI views.

---

## Verification before each session ships

1. `select policyname, schemaname, tablename, cmd from pg_policies where schemaname = 'public';` — confirm every new table has the expected policies.
2. Manual test: log in as a practice user, attempt to read another practice's row by ID — must return zero rows, not "permission denied" (RLS filters silently).
3. Manual test: log in as a practice user, attempt to insert with a different `practice_id` — must fail.
4. Manual test: admin can read across practices.

These tests run before each new migration is applied to production Supabase.
