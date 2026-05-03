import { Button } from "@/components/ui/button";

interface Props {
  surface: "portal" | "admin";
  className?: string;
}

// Uses a plain HTML form so logout works without client JS. Browsers
// post the form, the route handler clears cookies, then 303-redirects
// to the appropriate login.
export function LogoutButton({ surface, className }: Props) {
  return (
    <form
      action={`/api/auth/logout?surface=${surface}`}
      method="post"
      className="inline"
    >
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className={className}
      >
        {/* [DRAFT] */}Sign out
      </Button>
    </form>
  );
}
