// Concentric rings diagram for the /system "Closed Loop" section. Each ring
// represents a protocol version (v1.0 → v1.1 → v1.2 ...). The visual reads as
// "always iterating, no end state" — better metaphor for continuous refinement
// than a finite timeline.
export function IterationRings() {
  // Rings with increasing radius. Outermost = oldest. Innermost = current/latest.
  const rings = [
    { r: 200, version: "v1.0", opacity: 0.18 },
    { r: 165, version: "v1.1", opacity: 0.26 },
    { r: 130, version: "v1.2", opacity: 0.38 },
    { r: 95, version: "v1.3", opacity: 0.55 },
    { r: 60, version: "v1.4", opacity: 0.78 },
  ];

  return (
    <figure
      role="img"
      aria-label="Concentric rings showing successive protocol versions, each iteration tighter than the last."
      className="relative w-full"
    >
      <svg
        viewBox="0 0 460 460"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full h-auto max-w-[440px] mx-auto"
        aria-hidden="true"
      >
        {/* Concentric rings */}
        {rings.map((ring) => (
          <g key={ring.version}>
            <circle
              cx="230"
              cy="230"
              r={ring.r}
              fill="none"
              stroke="#A8C8E8"
              strokeOpacity={ring.opacity}
              strokeWidth="1"
              strokeDasharray={ring.version === "v1.4" ? undefined : "4 4"}
            />
            {/* Version label on the ring */}
            <text
              x={230 + ring.r}
              y="230"
              textAnchor="start"
              dominantBaseline="middle"
              fill="#A8C8E8"
              fillOpacity={ring.opacity + 0.15}
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="10"
              letterSpacing="0.12em"
              dx="6"
            >
              {ring.version.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Center dot */}
        <circle cx="230" cy="230" r="3" fill="#E8DCC4" fillOpacity="0.9" />

        {/* "Now" label below the center */}
        <text
          x="230"
          y="252"
          textAnchor="middle"
          fill="#FDFCF9"
          fillOpacity="0.85"
          fontFamily="Fraunces, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
        >
          now
        </text>
      </svg>
    </figure>
  );
}
