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

// Mandatory clinical notification — fires 60d/30d/7d before
// expiry once expiry is enabled (deferred per Q5). Template
// ships now so the dispatch path is wired end-to-end.
export function NotificationCertificationExpiringEmail(props: Props) {
  return (
    <NotificationShell
      preview="Your certification is approaching its expiry date."
      eyebrow="Certification"
      title={props.title}
      body={
        <>
          <Text style={notificationParagraphStyle}>{props.body}</Text>
          <Text style={notificationParagraphStyle}>
            Re-train through the curriculum to keep treatment-logging access
            for your device.
          </Text>
        </>
      }
      ctaUrl={props.ctaUrl}
      ctaLabel={props.ctaLabel}
      unsubscribeUrl={props.unsubscribeUrl}
    />
  );
}

export default NotificationCertificationExpiringEmail;
