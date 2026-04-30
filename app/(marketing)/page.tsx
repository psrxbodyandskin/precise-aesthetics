import Link from "next/link";

export default function HomePage() {
  return (
    <section className="bg-midnight-800 text-cream-50 min-h-[80vh] flex items-center">
      <div className="mx-auto w-full max-w-[1280px] px-6 md:px-10 lg:px-12 py-32 md:py-40">
        <p
          className="font-body text-cream-300 mb-8"
          style={{
            fontSize: "var(--text-overline)",
            letterSpacing: "var(--tracking-overline)",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Launching August 8, 2026 · Civic Opera Building
        </p>

        <h1
          className="font-display text-cream-50 max-w-[18ch]"
          style={{
            fontSize: "var(--text-display-xl)",
            lineHeight: "var(--leading-display)",
            letterSpacing: "var(--tracking-display)",
            fontWeight: 500,
          }}
        >
          Protocol-driven pico laser.
        </h1>

        <p
          className="font-body text-cream-100 mt-8 max-w-[60ch]"
          style={{
            fontSize: "var(--text-lead)",
            lineHeight: "var(--leading-body)",
          }}
        >
          Predictable outcomes across every skin type. The Precise Pico™
          system pairs a multi-wavelength pico platform with the PIH
          Prevention Protocol™ — engineered for safety on Fitzpatrick IV–VI.
        </p>

        <div className="mt-12">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center bg-cream-50 text-midnight-800 hover:bg-cream-100 transition-colors duration-150 ease-out font-body font-medium h-13 px-8 rounded-md"
            style={{
              borderRadius: "var(--radius-md)",
              transitionTimingFunction: "var(--ease-out)",
            }}
          >
            Request a demonstration
          </Link>
        </div>
      </div>
    </section>
  );
}
