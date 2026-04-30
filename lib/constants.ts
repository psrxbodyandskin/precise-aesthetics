export const SITE = {
  name: "Precise Aesthetics",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://preciseaesthetics.com",
  description:
    "Protocol-driven pico laser. Predictable outcomes across every skin type. Skin of Every Shade.™",
  positioning:
    "Protocol-driven pico laser. Predictable outcomes across every skin type.",
  launch: {
    date: "2026-08-08",
    venue: "Civic Opera Building Rooftop",
    city: "Chicago",
  },
} as const;

export const NAV = {
  primary: [
    { href: "/pico", label: "Precise Pico" },
    { href: "/system", label: "The System" },
    { href: "/protocols", label: "Protocols" },
    { href: "/about", label: "About" },
    { href: "/launch", label: "Launch" },
  ],
  secondary: [
    { href: "/resources", label: "Resources" },
    { href: "/press", label: "Press" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/hipaa-notice", label: "HIPAA Notice" },
  ],
  cta: { href: "/demo", label: "Request a demo" },
} as const;
