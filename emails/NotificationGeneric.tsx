import { NotificationShell } from "./_notification-shell";

interface NotificationGenericEmailProps {
  title: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
  unsubscribeUrl: string;
}

// Fallback template — used for any category where no dedicated
// template is wired (e.g. inbox.new_lead, training.new_module_added,
// training.certification_completed). Body is a single paragraph
// string assembled from the dispatch payload.
export function NotificationGenericEmail(props: NotificationGenericEmailProps) {
  return (
    <NotificationShell
      preview={props.body || props.title}
      title={props.title}
      body={props.body}
      ctaUrl={props.ctaUrl}
      ctaLabel={props.ctaLabel}
      unsubscribeUrl={props.unsubscribeUrl}
    />
  );
}

export default NotificationGenericEmail;
