// SSR / mobile / reduced-motion silhouette.
// Renders the FULL SYSTEM ALIVE peak frame as a clean SVG: four pedestals
// arranged in a clockwise loop, each with its pillar object reading clearly,
// connected by lit arrow paths, with a soft champagne center wash.
import { COLORS } from "./constants";

export function StaticFallback() {
  // ViewBox 320x240 (~4:3), perspective-projected approximation of the four
  // pedestals at [-1.4, 0, ±0.8] / [1.4, 0, ±0.8] viewed from elevated camera.
  // Coordinates here are screen-space approximations; not raycast.
  const W = 320;
  const H = 240;

  // Pedestal screen positions (top-left / top-right are "back", bottom are "front").
  const pads = {
    protocols: { x: 88, y: 92 }, // back-left
    delivery: { x: 232, y: 92 }, // back-right
    data: { x: 248, y: 168 }, // front-right
    biologic: { x: 72, y: 168 }, // front-left
  };

  const pedestalPath = (cx: number, cy: number, rx = 36, ry = 9) =>
    `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

  const arrowPath = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    bow: number,
  ) => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    // Bow outward — perpendicular from midpoint, scaled by `bow`.
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;
    const cx = mx + nx * bow;
    const cy = my + ny * bow;
    return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  };

  return (
    <div className="relative aspect-square w-full max-w-[620px] mx-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full"
        role="img"
        aria-label="A visualization of the four-pillar Precise System: Protocols, Delivery Mechanism, Data Intelligence, and Biologic Control, connected in a closed loop."
      >
        <defs>
          <radialGradient id="pa-bg" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor={COLORS.midnight700} stopOpacity="0.55" />
            <stop offset="100%" stopColor={COLORS.midnight800} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pa-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={COLORS.champagne200} stopOpacity="0.6" />
            <stop offset="60%" stopColor={COLORS.champagne200} stopOpacity="0.2" />
            <stop offset="100%" stopColor={COLORS.champagne200} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill="url(#pa-bg)" />

        {/* Champagne center wash (FULL SYSTEM ALIVE accent) */}
        <circle cx={W / 2} cy={H / 2 + 12} r="60" fill="url(#pa-center-glow)" />

        {/* Lit arrows — clockwise: P→D, D→Da, Da→B, B→P. Bow outward from center. */}
        <g
          stroke={COLORS.brand300}
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        >
          <path d={arrowPath(pads.protocols, pads.delivery, -22)} />
          <path d={arrowPath(pads.delivery, pads.data, 22)} />
          <path d={arrowPath(pads.data, pads.biologic, 22)} />
          <path d={arrowPath(pads.biologic, pads.protocols, -22)} />
        </g>

        {/* Pedestal discs (ellipse — top-down perspective) */}
        {Object.values(pads).map((p, i) => (
          <path
            key={`ped-${i}`}
            d={pedestalPath(p.x, p.y + 26)}
            fill={COLORS.ink700}
            opacity="0.95"
          />
        ))}
        {/* Pedestal rim glow rings */}
        {Object.values(pads).map((p, i) => (
          <ellipse
            key={`rim-${i}`}
            cx={p.x}
            cy={p.y + 26}
            rx="36"
            ry="9"
            fill="none"
            stroke={COLORS.brand300}
            strokeWidth="1.3"
            opacity="0.85"
          />
        ))}

        {/* Pillar 1 — Protocols (3 layered curved panels, brand-300 frosted) */}
        <g transform={`translate(${pads.protocols.x}, ${pads.protocols.y - 8})`}>
          <path
            d="M -22 -2 Q 0 -10 22 -2 L 22 18 Q 0 10 -22 18 Z"
            fill={COLORS.brand300}
            opacity="0.55"
          />
          <path
            d="M -20 -8 Q 0 -16 20 -8 L 20 12 Q 0 4 -20 12 Z"
            fill={COLORS.brand300}
            opacity="0.7"
          />
          <path
            d="M -18 -14 Q 0 -22 18 -14 L 18 6 Q 0 -2 -18 6 Z"
            fill={COLORS.brand300}
            opacity="0.85"
          />
        </g>

        {/* Pillar 2 — Delivery (upright monolith with screen) */}
        <g transform={`translate(${pads.delivery.x}, ${pads.delivery.y - 14})`}>
          <rect
            x="-13"
            y="-26"
            width="26"
            height="40"
            rx="3"
            fill={COLORS.midnight800}
            stroke={COLORS.brand300}
            strokeOpacity="0.4"
            strokeWidth="0.6"
          />
          {/* Screen */}
          <rect
            x="-9"
            y="-21"
            width="18"
            height="26"
            rx="1.5"
            fill={COLORS.brand300}
            opacity="0.85"
          />
          {/* Top notch */}
          <rect
            x="-5"
            y="-29"
            width="10"
            height="3"
            fill={COLORS.midnight800}
          />
        </g>

        {/* Pillar 3 — Data (full glowing torus + particle suggestion) */}
        <g transform={`translate(${pads.data.x}, ${pads.data.y - 8})`}>
          {/* Outer torus */}
          <ellipse cx="0" cy="0" rx="20" ry="6" fill="none" stroke={COLORS.brand500} strokeWidth="3" opacity="0.85" />
          <ellipse cx="0" cy="0" rx="20" ry="6" fill="none" stroke={COLORS.brand300} strokeWidth="1" opacity="0.9" />
          {/* Inner companion torus */}
          <ellipse cx="0" cy="0" rx="22" ry="6.6" fill="none" stroke={COLORS.brand500} strokeWidth="1.2" opacity="0.45" />
          {/* Particles dotted around the path */}
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg, i) => {
            const r = (deg * Math.PI) / 180;
            return (
              <circle
                key={`p-${i}`}
                cx={Math.cos(r) * 20}
                cy={Math.sin(r) * 6}
                r="1.4"
                fill={COLORS.brand300}
                opacity="0.95"
              />
            );
          })}
        </g>

        {/* Pillar 4 — Biologic (cluster of bottles with champagne caps) */}
        <g transform={`translate(${pads.biologic.x}, ${pads.biologic.y - 16})`}>
          {/* Tall slim */}
          <rect x="-22" y="-8" width="6" height="22" rx="0.8" fill={COLORS.cream100} />
          <rect x="-22" y="-10" width="6" height="2.5" fill={COLORS.champagne200} />
          {/* Squat jar */}
          <rect x="-13" y="2" width="9" height="12" rx="0.8" fill={COLORS.cream100} />
          <rect x="-13" y="0" width="9" height="2.5" fill={COLORS.champagne200} />
          {/* Narrow vial */}
          <rect x="-1" y="-4" width="5" height="18" rx="0.8" fill={COLORS.cream100} />
          <rect x="-1" y="-6" width="5" height="2.5" fill={COLORS.champagne200} />
          {/* Small wide jar */}
          <rect x="7" y="3" width="8" height="11" rx="0.8" fill={COLORS.cream100} />
          <rect x="7" y="1" width="8" height="2.3" fill={COLORS.champagne200} />
          {/* Medium bottle */}
          <rect x="17" y="-2" width="6" height="16" rx="0.8" fill={COLORS.cream100} />
          <rect x="17" y="-4" width="6" height="2.5" fill={COLORS.champagne200} />
        </g>
      </svg>
    </div>
  );
}
