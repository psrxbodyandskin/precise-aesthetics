import {
  AlertCircle,
  Bell,
  GraduationCap,
  Inbox,
  Library,
  ScrollText,
  Sparkles,
  type LucideProps,
} from "lucide-react";

import type { NotificationCategory } from "@/lib/schemas/notifications";

// Lucide icon per category — used in the dropdown panel + list
// items. All icons stay strokeWidth=1.5 to match the rest of the
// portal/admin chrome.
const ICON_MAP: Record<NotificationCategory, React.ComponentType<LucideProps>> = {
  // Practice — clinical
  "protocol.updated_for_used_protocol": Library,
  "adverse_event.status_updated": AlertCircle,
  "training.certification_expiring": ScrollText,
  // Practice — library
  "protocol.new_for_owned_device": Library,
  "training.new_module_added": GraduationCap,
  // Admin — clinical
  "adverse_event.new": AlertCircle,
  // Admin — inbox
  "inbox.new_demo_request": Inbox,
  "inbox.new_lead": Inbox,
  "inbox.new_contact_message": Inbox,
  // Admin — operations
  "training.certification_completed": GraduationCap,
  "practice.high_engagement": Sparkles,
};

interface CategoryIconProps {
  category: NotificationCategory;
  className?: string;
}

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const Icon = ICON_MAP[category] ?? Bell;
  return (
    <Icon className={className} strokeWidth={1.5} aria-hidden="true" />
  );
}
