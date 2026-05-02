import Link from "next/link";
import { Linkedin, Instagram, Twitter, Youtube } from "lucide-react";
import { Logo } from "./Logo";
import { Container } from "./Container";
import { getSiteSettings } from "@/lib/sanity/queries";
import type { SocialPlatform } from "@/lib/sanity/types";

const COMPANY_NAV = [
  { href: "/about", label: "About" },
  { href: "/press", label: "Press" },
  { href: "/contact", label: "Contact" },
];

const SYSTEM_NAV = [
  { href: "/system", label: "The System" },
  { href: "/pico", label: "Precise Pico" },
  { href: "/demo", label: "Practitioners" },
  { href: "/launch", label: "Launch" },
];

const LEGAL_NAV = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

const FALLBACK_TAGLINE = "Skin of every shade.";
const FALLBACK_DESCRIPTION =
  "A clinical technology company building complete dermatologic systems — starting with Precise Pico™.";

const platformIcon: Record<SocialPlatform, typeof Linkedin> = {
  linkedin: Linkedin,
  instagram: Instagram,
  x: Twitter,
  youtube: Youtube,
  tiktok: Twitter,
};

const platformLabel: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export async function Footer() {
  const settings = await getSiteSettings().catch(() => null);
  const tagline = settings?.tagline ?? FALLBACK_TAGLINE;
  const description = settings?.defaultMetaDescription ?? FALLBACK_DESCRIPTION;
  const socialLinks = settings?.socialLinks ?? [];

  return (
    <footer
      role="contentinfo"
      data-tone="midnight-deep"
      className="bg-midnight-800 text-cream-100 py-20 md:py-24"
    >
      <Container>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <Logo variant="horizontal" tone="cream" width={200} />
            <p className="mt-6 font-display text-h4 text-cream-50">{tagline}</p>
            <p className="mt-4 max-w-[36ch] text-small leading-body text-cream-300">
              {description}
            </p>
          </div>

          <FooterColumn title="Company" items={COMPANY_NAV} className="md:col-span-3" />
          <FooterColumn title="System" items={SYSTEM_NAV} className="md:col-span-3" />
          <FooterColumn title="Legal" items={LEGAL_NAV} className="md:col-span-2" />
        </div>

        <div className="mt-16 border-t border-brand-300/20 pt-8">
          <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between">
            <p className="text-caption text-cream-300">
              © 2026 PS Medical Aesthetics, LLC. All rights reserved.
            </p>
            {socialLinks.length > 0 && (
              <ul className="flex items-center gap-4">
                {socialLinks.map((link) => {
                  const Icon = platformIcon[link.platform];
                  return (
                    <li key={link._key}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Precise Aesthetics on ${platformLabel[link.platform]}`}
                        className="inline-flex h-11 w-11 items-center justify-center text-cream-300 transition-colors hover:text-cream-100"
                      >
                        <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p className="mt-6 text-caption leading-body text-cream-300">
            Precise Aesthetics™, The Precise System™, Precise Pico™, and PIH Prevention
            Protocol™ are trademarks of PS Medical Aesthetics, LLC.
          </p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
  className,
}: {
  title: string;
  items: ReadonlyArray<{ href: string; label: string }>;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="text-overline font-medium uppercase tracking-overline text-cream-300">
        {title}
      </h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-small text-cream-100 transition-colors hover:text-cream-50"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
