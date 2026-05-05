import { Text } from "@react-email/components";
import {
  NotificationShell,
  notificationParagraphStyle,
} from "./_notification-shell";

interface NotificationProtocolUpdatedEmailProps {
  title: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
  unsubscribeUrl: string;
}

// Mandatory clinical notification — the practice has logged at
// least one treatment with a protocol that was just republished.
// Copy emphasises "review before logging again."
export function NotificationProtocolUpdatedEmail(
  props: NotificationProtocolUpdatedEmailProps,
) {
  return (
    <NotificationShell
      preview="A protocol your practice has used was updated."
      eyebrow="Clinical update"
      title={props.title}
      body={
        <>
          <Text style={notificationParagraphStyle}>{props.body}</Text>
          <Text style={notificationParagraphStyle}>
            Please review the changes before your next session with this
            protocol. Parameter envelopes and treatment endpoints may have
            shifted.
          </Text>
        </>
      }
      ctaUrl={props.ctaUrl}
      ctaLabel={props.ctaLabel}
      unsubscribeUrl={props.unsubscribeUrl}
    />
  );
}

export default NotificationProtocolUpdatedEmail;
