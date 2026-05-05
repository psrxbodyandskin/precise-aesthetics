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

// Admin-side, mutable. New /contact form submission. Body is
// prefilled with sender + subject; admin opens to read full
// message + reply via mailto.
export function NotificationInboxContactMessageEmail(props: Props) {
  return (
    <NotificationShell
      preview="Someone sent a contact-form message."
      eyebrow="Inbox"
      title={props.title}
      body={
        <>
          <Text style={notificationParagraphStyle}>{props.body}</Text>
          <Text style={notificationParagraphStyle}>
            Open the inbox to read the full message and reply directly.
          </Text>
        </>
      }
      ctaUrl={props.ctaUrl}
      ctaLabel={props.ctaLabel}
      unsubscribeUrl={props.unsubscribeUrl}
    />
  );
}

export default NotificationInboxContactMessageEmail;
