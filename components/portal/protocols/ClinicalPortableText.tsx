import {
  PortableText,
  type PortableTextComponents,
} from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

interface ClinicalPortableTextProps {
  value: PortableTextBlock[] | undefined;
}

// Clinical-document PortableText renderer. Distinct register from any
// editorial PortableText elsewhere — denser line height, no Fig/§
// annotations, no marketing visual treatments. Tuned for chair-side
// reading.
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p
        className="font-body text-ink-700 mb-4 last:mb-0"
        style={{ fontSize: "1rem", lineHeight: 1.65 }}
      >
        {children}
      </p>
    ),
    h2: ({ children }) => (
      <h3
        className="font-display text-ink-900 mt-8 mb-3 first:mt-0"
        style={{
          fontSize: "1.375rem",
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
          fontWeight: 400,
        }}
      >
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4
        className="font-display text-ink-900 mt-6 mb-2 first:mt-0"
        style={{
          fontSize: "1.125rem",
          letterSpacing: "-0.005em",
          lineHeight: 1.25,
          fontWeight: 400,
        }}
      >
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className="border-l-2 border-brand-500/40 pl-5 my-5 font-body text-ink-700"
        style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}
      >
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul
        className="list-disc space-y-1.5 pl-6 mb-4 font-body text-ink-700"
        style={{ fontSize: "1rem", lineHeight: 1.6 }}
      >
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol
        className="list-decimal space-y-1.5 pl-6 mb-4 font-body text-ink-700"
        style={{ fontSize: "1rem", lineHeight: 1.6 }}
      >
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-medium text-ink-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => {
      const href: string | undefined = value?.href;
      if (!href) return <>{children}</>;
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-700 underline-offset-[3px] decoration-1 hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm print:text-ink-900 print:underline"
        >
          {children}
        </a>
      );
    },
  },
};

export function ClinicalPortableText({ value }: ClinicalPortableTextProps) {
  if (!value || value.length === 0) return null;
  return <PortableText value={value} components={components} />;
}
