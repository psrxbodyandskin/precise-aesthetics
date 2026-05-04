// First 4 chars of the practice UUID — anonymized identifier used in
// dashboard surfaces where Roni needs to track patterns without seeing
// practice names. Per spec callout 2: reversibility is acceptable
// because clicking through to detail surfaces the full practice context.
export function PracticeIdHash({ practiceId }: { practiceId: string }) {
  const code = practiceId.slice(0, 4).toUpperCase();
  return (
    <span
      className="inline-flex items-center rounded-sm border border-ink-700/15 bg-bone-100 px-1.5 py-0.5 font-body text-caption font-medium text-ink-700"
      style={{
        letterSpacing: "0.1em",
        fontVariantNumeric: "tabular-nums",
      }}
      aria-label={`Anonymized practice identifier ${code}`}
      title="Anonymized practice identifier"
    >
      {code}
    </span>
  );
}
