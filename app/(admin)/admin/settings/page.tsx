import { redirect } from "next/navigation";

// /admin/settings → /admin/settings/account by default. Account is the
// most-accessed sub-page (per P13.5 — credential rotation). When more
// settings ship and a true index makes sense, this becomes a landing
// page with a tile per sub-section.
export default function AdminSettingsIndexPage() {
  redirect("/admin/settings/account");
}
