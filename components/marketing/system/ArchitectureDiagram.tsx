interface ArchitectureDiagramProps {
  /** "main" — verbs (executes / applies to / captures / refines).
   *  "data" — data lifecycle annotations (logged / aggregated / patterned / pushed back). */
  variant?: "main" | "data";
  /** Optional figure annotation rendered top-right (e.g., "Fig. 04"). */
  fig?: string;
  /** Optional title overlay rendered bottom-center. */
  title?: string;
}

// Static SVG closed-loop architecture diagram. 4 quadrant cards arranged in a
// square layout, connected by clockwise arrows in brand-300 hairlines.
//
// "main" variant: verbs on the arrows (executes / applies to / captures / refines).
// "data" variant: same 4-pillar structure with the arrows annotated as the
// data lifecycle steps (logged → aggregated → patterned → pushed).
//
// Pure 2D SVG. No animation. Brand colors only. Reads as a technical drawing.
export function ArchitectureDiagram({
  variant = "main",
  fig,
  title,
}: ArchitectureDiagramProps) {
  const labels =
    variant === "main"
      ? {
          a: "executes",
          b: "applies to",
          c: "captures",
          d: "refines",
        }
      : {
          a: "treatment logged",
          b: "outcomes aggregated",
          c: "patterns detected",
          d: "protocols updated",
        };

  // Pillar copy
  const pillars = [
    {
      title: "Protocols",
      role: "Defines the what",
      x: 80,
      y: 40,
    },
    {
      title: "Delivery",
      role: "Executes the how",
      x: 480,
      y: 40,
    },
    {
      title: "Biologic Control",
      role: "Governs the recovery",
      x: 480,
      y: 360,
    },
    {
      title: "Data Intelligence",
      role: "Enables the refinement",
      x: 80,
      y: 360,
    },
  ];

  const cardW = 240;
  const cardH = 120;

  return (
    <figure
      className="relative w-full"
      role="img"
      aria-label={`Architecture diagram: the four pillars of The Precise System connected in a closed loop. ${labels.a}, ${labels.b}, ${labels.c}, ${labels.d}.`}
    >
      <svg
        viewBox="0 0 800 520"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full h-auto"
        aria-hidden="true"
      >
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#A8C8E8" />
          </marker>
        </defs>

        {/* Center label */}
        <text
          x="400"
          y="260"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#A8C8E8"
          fillOpacity="0.45"
          fontFamily="Fraunces, Georgia, serif"
          fontStyle="italic"
          fontSize="18"
        >
          The Precise System™
        </text>

        {/* Arrows clockwise. Curves arc gracefully outside the cards. */}
        {/* Top arrow: Protocols → Delivery */}
        <path
          d="M 320 100 Q 400 60 480 100"
          stroke="#A8C8E8"
          strokeWidth="1.2"
          strokeOpacity="0.7"
          fill="none"
          markerEnd="url(#arrowhead)"
        />
        <text
          x="400"
          y="60"
          textAnchor="middle"
          fill="#A8C8E8"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="11"
          letterSpacing="0.12em"
        >
          {labels.a.toUpperCase()}
        </text>

        {/* Right arrow: Delivery → Biologic */}
        <path
          d="M 720 160 Q 760 260 720 360"
          stroke="#A8C8E8"
          strokeWidth="1.2"
          strokeOpacity="0.7"
          fill="none"
          markerEnd="url(#arrowhead)"
        />
        <text
          x="760"
          y="265"
          textAnchor="middle"
          fill="#A8C8E8"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="11"
          letterSpacing="0.12em"
        >
          {labels.b.toUpperCase()}
        </text>

        {/* Bottom arrow: Biologic → Data */}
        <path
          d="M 480 420 Q 400 460 320 420"
          stroke="#A8C8E8"
          strokeWidth="1.2"
          strokeOpacity="0.7"
          fill="none"
          markerEnd="url(#arrowhead)"
        />
        <text
          x="400"
          y="475"
          textAnchor="middle"
          fill="#A8C8E8"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="11"
          letterSpacing="0.12em"
        >
          {labels.c.toUpperCase()}
        </text>

        {/* Left arrow: Data → Protocols */}
        <path
          d="M 80 360 Q 40 260 80 160"
          stroke="#A8C8E8"
          strokeWidth="1.2"
          strokeOpacity="0.7"
          fill="none"
          markerEnd="url(#arrowhead)"
        />
        <text
          x="40"
          y="265"
          textAnchor="middle"
          fill="#A8C8E8"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="11"
          letterSpacing="0.12em"
        >
          {labels.d.toUpperCase()}
        </text>

        {/* Pillar cards */}
        {pillars.map((p) => (
          <g key={p.title}>
            <rect
              x={p.x}
              y={p.y}
              width={cardW}
              height={cardH}
              rx="2"
              ry="2"
              fill="#121C33"
              stroke="#A8C8E8"
              strokeOpacity="0.3"
              strokeWidth="1"
            />
            <text
              x={p.x + cardW / 2}
              y={p.y + 50}
              textAnchor="middle"
              fill="#FDFCF9"
              fontFamily="Fraunces, Georgia, serif"
              fontSize="22"
              letterSpacing="-0.005em"
            >
              {p.title}
            </text>
            <text
              x={p.x + cardW / 2}
              y={p.y + 78}
              textAnchor="middle"
              fill="#C9C2B5"
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="13"
            >
              {p.role}
            </text>
          </g>
        ))}
      </svg>

      {/* Top-right Fig. annotation */}
      {fig && (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 font-body text-overline tracking-overline uppercase text-brand-300/70"
        >
          {fig}
        </span>
      )}

      {title && (
        <figcaption className="mt-6 text-center font-body text-caption tracking-overline uppercase text-cream-300/70">
          {title}
        </figcaption>
      )}
    </figure>
  );
}
