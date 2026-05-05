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

// Mandatory — the practice's reported adverse event has been
// reviewed by clinical staff. Status moved (e.g. new → reviewing
// → addressed). Encourages reading the admin's notes if any.
export function NotificationAdverseEventStatusUpdateEmail(props: Props) {
  return (
    <NotificationShell
      preview="An adverse event you reported was reviewed."
      eyebrow="Adverse event"
      title={props.title}
      body={
        <>
          <Text style={notificationParagraphStyle}>{props.body}</Text>
          <Text style={notificationParagraphStyle}>
            Open the report to see clinical notes and any follow-up the
            review surfaced.
          </Text>
        </>
      }
      ctaUrl={props.ctaUrl}
      ctaLabel={props.ctaLabel}
      unsubscribeUrl={props.unsubscribeUrl}
    />
  );
}

export default NotificationAdverseEventStatusUpdateEmail;
