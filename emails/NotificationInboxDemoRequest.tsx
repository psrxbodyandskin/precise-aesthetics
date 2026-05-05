import { Text } from "@react-email/components";
import {
  NotificationShell,
  notificationParagraphStyle,
} from "./_notification-shell";

interface Props {
  title: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
  unsubscribeUrl: string;
}

// Admin-side, mutable. Goes to every admin user with
// app_metadata.role = 'admin' (Q2 fan-out). Practitioner team
// can mute via /admin/settings/notifications if the demo volume
// gets noisy.
export function NotificationInboxDemoRequestEmail(props: Props) {
  return (
    <NotificationShell
      preview="A new demo request landed in the admin inbox."
      eyebrow="Inbox"
      title={props.title}
      body={
        <>
          <Text style={notificationParagraphStyle}>{props.body}</Text>
          <Text style={notificationParagraphStyle}>
            Open the inbox for full submission context — practice, role,
            timeline, devices in use, UTM source.
          </Text>
        </>
      }
      ctaUrl={props.ctaUrl}
      ctaLabel={props.ctaLabel}
      unsubscribeUrl={props.unsubscribeUrl}
    />
  );
}

export default NotificationInboxDemoRequestEmail;
