# Database Backup Verification — P12 Phase F

**Date:** 2026-05-05
**Method:** Operator checklist (Supabase dashboard not introspectable from CLI without service-role admin API).
**Author:** P12 hardening pass.

---

## Why this matters

This is **clinical software**. Adverse events, treatment logs, certifications — losing any of it is a regulatory + reputational disaster. Backup retention determines how far back we can recover from accidental delete, ransomware, or migration mistakes.

**Minimum bar for launch:** at least Pro tier on Supabase (Free tier has 7-day PITR but no daily snapshot retention). Daily backups + ≥7-day retention.

---

## Operator checklist (Brian fills in)

Open Supabase Dashboard → project → Database → Backups.

| Setting | Required | Operator confirms | Captured value |
|---|---|---|---|
| Project plan | ≥ Pro | `[ ]` | _to fill_ |
| Daily snapshots | enabled | `[ ]` | _to fill_ |
| Snapshot retention | ≥ 7 days | `[ ]` | _to fill_ |
| Point-in-time recovery (PITR) | enabled | `[ ]` | _to fill_ |
| PITR retention window | ≥ 7 days | `[ ]` | _to fill_ |
| Most recent successful snapshot | dated within last 24h | `[ ]` | _date/time_ |
| Storage backups (covers buckets) | enabled if available on plan | `[ ]` | _to fill_ |

If any line above fails the requirement, **do not launch** until upgraded. Pro tier upgrade is immediate; PITR enablement is also immediate.

---

## Recovery procedure (template — operator validates)

> **Do not test the destructive parts of this procedure on production.** Validate against a staging/branch project if you want to run the full sequence end-to-end before launch.

### Scenario A — accidental delete of recent rows

If, e.g., someone runs `delete from public.treatments where ...` and clobbers data:

1. **Stop further writes** — revoke service-role key from any compromised process; if needed, take the deploy offline.
2. **Identify recovery target time** — the timestamp BEFORE the delete. Write it down precisely.
3. **Use PITR**:
   - Supabase Dashboard → Database → Backups → "Restore to point in time"
   - Select target timestamp
   - **Choose target: NEW database (not replace existing)** — gives you a clean clone to extract from
4. **Extract rows from the clone**, INSERT them back into prod via the regular API or service role
5. **Document the incident** in `LAUNCH-RUNBOOK.md` § Incident log

### Scenario B — full database recovery (catastrophic)

1. Supabase Dashboard → Database → Backups → "Restore"
2. Select most recent acceptable snapshot
3. Confirm — this **replaces** the live database
4. Notify Brian + Roni immediately
5. Re-deploy app to refresh any cached schema/types
6. Re-run RLS audit script (`scripts/rls-audit.ts`) against the restored DB to confirm policies survived
7. Re-run Flow 1–8 from `END-TO-END-VERIFICATION.md` smoke test (subset of critical flows)

### Scenario C — single table corruption

PITR + selective restore. Same as Scenario A but scope to the specific table.

---

## Storage backups (separate from DB backups)

Supabase Storage buckets (`treatment-photos`, `training-videos`, `training-materials`) are **not** included in database backups by default — they're separately managed.

| Setting | Required | Operator confirms |
|---|---|---|
| Storage tier supports backups | check Supabase pricing for current support | `[ ]` |
| Treatment photos bucket — versioning or backup configured | yes (clinical-data-relevant) | `[ ]` |
| Training videos / materials buckets | not as critical (admin-managed, can be re-uploaded) | `[ ]` |

If Storage backups aren't natively available on our plan, **fallback strategy**: periodic export of `treatment-photos` to a separate cold storage (S3/B2/etc) via a scheduled job. Track as **P13** if not natively covered.

---

## Anthropic + Resend + Sanity backups

| Service | Backup posture | Notes |
|---|---|---|
| Anthropic | Not applicable — `agent_runs` rows live in our Supabase DB; if our DB is backed up, the AI history is too. The Anthropic-side history is just a billing/usage view. | n/a |
| Resend | Send logs retained per Resend's plan; we don't depend on their retention for recovery. | n/a |
| Sanity | Sanity has its own document history + revision tracking. The mirror in our `protocols` table is replayable from Sanity if lost (just trigger a webhook or re-fetch). | resilient-by-design |

---

## What changed during Phase F

- Created this document.
- No code changes.
- No DB changes.
- Operator-side actions queued in the launch runbook.

---

## Pre-delivery checklist (Phase F)

- [x] Backup-verification protocol documented
- [x] Recovery procedure templates (Scenario A/B/C) drafted
- [x] Storage backup posture documented (clinical-data-relevant note)
- [x] Third-party backup posture (Anthropic / Resend / Sanity) noted
- [ ] **(operator)** Supabase plan tier confirmed ≥ Pro
- [ ] **(operator)** Daily snapshots + PITR enabled
- [ ] **(operator)** Retention ≥ 7 days
- [ ] **(operator)** Recovery procedure validated end-to-end against branch/staging project (recommended; not strictly required pre-launch)

**Phase F status: COMPLETE on the documentation side. Operator unticked items reference into `LAUNCH-RUNBOOK.md` Pre-launch (T-7) checklist.**

Cleared to proceed to Phase G (runbook + final summary).
