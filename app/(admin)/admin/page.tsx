import { redirect } from "next/navigation";

// /admin → /admin/dashboard. The dashboard is the admin landing surface
// from P7 onward. Auth check happens in the layout + dashboard page.
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
