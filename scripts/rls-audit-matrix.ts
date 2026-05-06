// P12 — Expected RLS access matrix.
//
// Source of truth for what each role should be able to do on
// each table. The audit script (rls-audit.ts) runs every cell
// and asserts the outcome matches.
//
// Class A — Practice-owned (CRUD own, admin reads all)
// Class B — Admin-managed shared (admin all, practice reads relevant)
// Class C — Admin-only (admin all)
// Special — anon-insert, append-only, dead, etc.

export type Role = "admin" | "practiceA" | "practiceB" | "anon";
export type Op = "select" | "insert" | "update" | "delete";
export type Outcome = "allow" | "deny" | "skip-dead-table";

export interface RowExpectation {
  role: Role;
  op: Op;
  /** Allowed in general (admin) OR allowed only for own rows (practice). */
  expected: Outcome;
  /** When `expected = "allow"` for practice but only on own rows, this
   *  flags the test driver to use a same-practice row id; when
   *  `expected = "deny"` for practice B, the driver uses practice A's row id. */
  scope?: "own" | "other-practice" | "any";
  notes?: string;
}

export interface TableExpectation {
  table: string;
  class: "A" | "B" | "C" | "special-public-form" | "dead" | "append-only";
  description: string;
  rows: RowExpectation[];
}

// ----------------------------------------------------------
// Class C — Admin-only (audit_log, agent_runs, dispatch_log)
// ----------------------------------------------------------
const adminOnly = (table: string, description: string): TableExpectation => ({
  table,
  class: "C",
  description,
  rows: [
    { role: "admin", op: "select", expected: "allow" },
    { role: "admin", op: "insert", expected: "allow" },
    { role: "admin", op: "update", expected: "allow" },
    { role: "admin", op: "delete", expected: "allow" },
    { role: "practiceA", op: "select", expected: "deny" },
    { role: "practiceA", op: "insert", expected: "deny" },
    { role: "practiceA", op: "update", expected: "deny" },
    { role: "practiceA", op: "delete", expected: "deny" },
    { role: "practiceB", op: "select", expected: "deny" },
    { role: "anon", op: "select", expected: "deny" },
    { role: "anon", op: "insert", expected: "deny" },
  ],
});

// ----------------------------------------------------------
// Class A — Practice-owned (CRUD own, admin reads all)
// ----------------------------------------------------------
const classA = (
  table: string,
  description: string,
  opts?: { adminWrites?: boolean; practiceCanWrite?: boolean },
): TableExpectation => {
  const adminWrites = opts?.adminWrites ?? true; // most class A tables let admin write too
  const practiceCanWrite = opts?.practiceCanWrite ?? true;
  return {
    table,
    class: "A",
    description,
    rows: [
      { role: "admin", op: "select", expected: "allow", scope: "any" },
      { role: "admin", op: "insert", expected: adminWrites ? "allow" : "deny" },
      { role: "admin", op: "update", expected: adminWrites ? "allow" : "deny", scope: "any" },
      { role: "admin", op: "delete", expected: adminWrites ? "allow" : "deny", scope: "any" },
      { role: "practiceA", op: "select", expected: "allow", scope: "own" },
      { role: "practiceA", op: "select", expected: "deny", scope: "other-practice" },
      { role: "practiceA", op: "insert", expected: practiceCanWrite ? "allow" : "deny", scope: "own" },
      { role: "practiceA", op: "update", expected: practiceCanWrite ? "allow" : "deny", scope: "own" },
      { role: "practiceA", op: "delete", expected: practiceCanWrite ? "allow" : "deny", scope: "own" },
      { role: "practiceB", op: "select", expected: "deny", scope: "other-practice", notes: "B reads A's row" },
      { role: "practiceB", op: "update", expected: "deny", scope: "other-practice" },
      { role: "anon", op: "select", expected: "deny" },
      { role: "anon", op: "insert", expected: "deny" },
    ],
  };
};

// ----------------------------------------------------------
// Class B — Admin-managed shared (admin all, practice reads)
// ----------------------------------------------------------
const classB = (table: string, description: string): TableExpectation => ({
  table,
  class: "B",
  description,
  rows: [
    { role: "admin", op: "select", expected: "allow" },
    { role: "admin", op: "insert", expected: "allow" },
    { role: "admin", op: "update", expected: "allow" },
    { role: "admin", op: "delete", expected: "allow" },
    { role: "practiceA", op: "select", expected: "allow", notes: "filtered by relevance" },
    { role: "practiceA", op: "insert", expected: "deny" },
    { role: "practiceA", op: "update", expected: "deny" },
    { role: "practiceA", op: "delete", expected: "deny" },
    { role: "anon", op: "select", expected: "deny" },
  ],
});

// ----------------------------------------------------------
// Public-form tables (admin all + anon insert)
// ----------------------------------------------------------
const publicForm = (table: string): TableExpectation => ({
  table,
  class: "special-public-form",
  description: "Public form submission lands here; admin manages",
  rows: [
    { role: "admin", op: "select", expected: "allow" },
    { role: "admin", op: "insert", expected: "allow" },
    { role: "admin", op: "update", expected: "allow" },
    { role: "admin", op: "delete", expected: "allow" },
    { role: "practiceA", op: "select", expected: "deny" },
    { role: "anon", op: "select", expected: "deny" },
    { role: "anon", op: "insert", expected: "allow", notes: "public form submission" },
    { role: "anon", op: "update", expected: "deny" },
    { role: "anon", op: "delete", expected: "deny" },
  ],
});

// ----------------------------------------------------------
// MATRIX
// ----------------------------------------------------------
export const RLS_MATRIX: TableExpectation[] = [
  // P1 — RLS framework
  {
    table: "audit_log",
    class: "append-only",
    description: "Append-only via log_audit() RPC. Admin reads. Nobody updates/deletes.",
    rows: [
      { role: "admin", op: "select", expected: "allow" },
      { role: "admin", op: "insert", expected: "deny", notes: "use log_audit() RPC, not direct INSERT" },
      { role: "admin", op: "update", expected: "deny" },
      { role: "admin", op: "delete", expected: "deny" },
      { role: "practiceA", op: "select", expected: "deny" },
      { role: "anon", op: "select", expected: "deny" },
    ],
  },

  // P1 (initial schema 0001) — these are DEAD pre-portal tables.
  {
    table: "practitioners",
    class: "dead",
    description: "Pre-portal practitioner table. Replaced by practices + practice_authorized_users in P2. RLS policies reference auth.uid() (legacy). Leave alone until P13.",
    rows: [],
  },
  {
    table: "treatment_logs",
    class: "dead",
    description: "Pre-portal treatment table. Replaced by treatments in P6. Leave alone until P13.",
    rows: [],
  },
  {
    table: "event_rsvps",
    class: "dead",
    description: "Launch-event RSVPs table from 0001. RLS enabled, no policies — service-role only. No client API route exists. Leave alone until P13.",
    rows: [
      { role: "admin", op: "select", expected: "deny", notes: "no admin policy; service-role only" },
      { role: "practiceA", op: "select", expected: "deny" },
      { role: "anon", op: "insert", expected: "deny", notes: "no anon policy; was meant to use service role" },
    ],
  },

  // P8 — public-form tables
  publicForm("leads"),
  publicForm("demo_requests"),
  publicForm("contact_messages"),

  // P2 — practice account model
  {
    table: "practices",
    class: "B",
    description: "Admin manages practices. Practice reads its own row only.",
    rows: [
      { role: "admin", op: "select", expected: "allow" },
      { role: "admin", op: "insert", expected: "allow" },
      { role: "admin", op: "update", expected: "allow" },
      { role: "admin", op: "delete", expected: "allow" },
      { role: "practiceA", op: "select", expected: "allow", scope: "own" },
      { role: "practiceA", op: "select", expected: "deny", scope: "other-practice" },
      { role: "practiceA", op: "insert", expected: "deny" },
      { role: "practiceA", op: "update", expected: "deny" },
      { role: "practiceA", op: "delete", expected: "deny" },
      { role: "anon", op: "select", expected: "deny" },
    ],
  },
  classA("practice_users", "Practice's primary user records (admin can also write)"),
  classA("practice_authorized_users", "Roster of users who can perform gated actions for the practice"),
  classB("devices", "Device catalog. Practice reads active devices."),
  {
    table: "practice_devices",
    class: "B",
    description: "Practice's owned devices. Admin manages. Practice reads its own.",
    rows: [
      { role: "admin", op: "select", expected: "allow" },
      { role: "admin", op: "insert", expected: "allow" },
      { role: "admin", op: "update", expected: "allow" },
      { role: "admin", op: "delete", expected: "allow" },
      { role: "practiceA", op: "select", expected: "allow", scope: "own" },
      { role: "practiceA", op: "insert", expected: "deny" },
      { role: "practiceA", op: "update", expected: "deny" },
      { role: "practiceA", op: "delete", expected: "deny" },
      { role: "practiceB", op: "select", expected: "deny", scope: "other-practice" },
      { role: "anon", op: "select", expected: "deny" },
    ],
  },

  // P4 — protocol library
  classB("indication_categories", "Taxonomy. Practice reads, admin manages."),
  classB("protocols", "Practice reads device-gated; admin manages."),
  classB("protocol_devices", "Protocol-device join table. Practice reads."),
  {
    table: "protocol_versions",
    class: "append-only",
    description: "Append-only version history. Admin reads/inserts. Practice reads device-gated. Nobody updates/deletes.",
    rows: [
      { role: "admin", op: "select", expected: "allow" },
      { role: "admin", op: "insert", expected: "allow" },
      { role: "admin", op: "update", expected: "deny" },
      { role: "admin", op: "delete", expected: "deny" },
      { role: "practiceA", op: "select", expected: "allow", notes: "device-gated" },
      { role: "practiceA", op: "insert", expected: "deny" },
      { role: "practiceA", op: "update", expected: "deny" },
      { role: "practiceA", op: "delete", expected: "deny" },
      { role: "anon", op: "select", expected: "deny" },
    ],
  },

  // P6 — treatments
  classA("treatments", "Practice CRUDs own treatments. Admin reads/writes all."),
  classA("treatment_photos", "Practice CRUDs own photos."),
  {
    table: "treatment_adverse_events",
    class: "A",
    description: "Practice INSERT + SELECT own only. No UPDATE or DELETE for practice (clinical-incident audit trail integrity). Admin all.",
    rows: [
      { role: "admin", op: "select", expected: "allow" },
      { role: "admin", op: "insert", expected: "allow" },
      { role: "admin", op: "update", expected: "allow" },
      { role: "admin", op: "delete", expected: "allow" },
      { role: "practiceA", op: "select", expected: "allow", scope: "own" },
      { role: "practiceA", op: "select", expected: "deny", scope: "other-practice" },
      { role: "practiceA", op: "insert", expected: "allow", scope: "own" },
      {
        role: "practiceA",
        op: "update",
        expected: "deny",
        scope: "own",
        notes: "by-design: AE is append-only from practice side",
      },
      {
        role: "practiceA",
        op: "delete",
        expected: "deny",
        scope: "own",
        notes: "by-design: AE is append-only from practice side",
      },
      { role: "anon", op: "select", expected: "deny" },
    ],
  },

  // P9 — training
  classB("training_modules", "Published modules visible to practice; admin manages."),
  classB("training_curricula", "Curricula visible to practice for owned devices."),
  classB("curriculum_modules", "Join table read by practice."),
  classB("module_materials", "Module materials read by practice."),
  classA("module_progress", "Practice CRUDs own progress rows."),
  {
    table: "practice_certifications",
    class: "A",
    description:
      "Practice CRUDs own certifications. Admin all. Note: practice_user_id added in 0012 (P9.1) — RLS still keys on practice_id which remains correct.",
    rows: [
      { role: "admin", op: "select", expected: "allow" },
      { role: "admin", op: "insert", expected: "allow" },
      { role: "admin", op: "update", expected: "allow" },
      { role: "admin", op: "delete", expected: "allow" },
      { role: "practiceA", op: "select", expected: "allow", scope: "own" },
      { role: "practiceA", op: "select", expected: "deny", scope: "other-practice" },
      { role: "practiceA", op: "insert", expected: "allow", scope: "own" },
      { role: "practiceA", op: "update", expected: "allow", scope: "own" },
      { role: "practiceA", op: "delete", expected: "deny", notes: "no practice DELETE policy — by design, certs are append-only from practice side" },
      { role: "anon", op: "select", expected: "deny" },
    ],
  },

  // P10 — notifications
  {
    table: "notifications",
    class: "A",
    description:
      "Practice reads + updates own (mark read). No INSERT (server-side only via service role). No DELETE for practice (audit trail).",
    rows: [
      { role: "admin", op: "select", expected: "allow" },
      { role: "admin", op: "insert", expected: "allow" },
      { role: "admin", op: "update", expected: "allow" },
      { role: "admin", op: "delete", expected: "allow" },
      { role: "practiceA", op: "select", expected: "allow", scope: "own" },
      { role: "practiceA", op: "select", expected: "deny", scope: "other-practice" },
      {
        role: "practiceA",
        op: "insert",
        expected: "deny",
        notes: "by-design: server-only via service role",
      },
      { role: "practiceA", op: "update", expected: "allow", scope: "own", notes: "mark-as-read" },
      {
        role: "practiceA",
        op: "delete",
        expected: "deny",
        notes: "by-design: notifications are read-only audit trail",
      },
      { role: "anon", op: "select", expected: "deny" },
    ],
  },
  classA("notification_preferences", "Practice CRUDs own preferences."),
  adminOnly("notification_dispatch_log", "Server-side dispatch log. Admin only."),

  // P11 — agent runs
  adminOnly("agent_runs", "Anthropic agent invocation log. Admin only."),
];
