import { z } from "zod";

// P13.5 — admin account self-service schemas.
//
// Email change goes through Supabase's standard confirmation flow:
// updateUser({ email }) sends a confirmation link to the NEW address,
// which the operator clicks to finalize. We log admin.email_changed
// when initiated; admin.email_change_confirmed is logged on next
// settings-page load if we detect the confirmation completed.
//
// Password change requires the current password as a re-auth check
// (defense against unattended/unlocked admin sessions). After update,
// other sessions are revoked via supabase.auth.admin.signOut(userId,
// { scope: 'others' }).

export const emailChangeSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email().max(200),
});
export type EmailChangeInput = z.infer<typeof emailChangeSchema>;

// Min 12 chars per Brian's spec callout. No upper-bound complexity
// rule — modern guidance prefers length over forced symbol/digit
// requirements (NIST 800-63B). Enforce only the floor.
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .max(200),
});
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
