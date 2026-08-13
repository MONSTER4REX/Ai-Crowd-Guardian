/**
 * ACG — Insights data + MonacoMap SVG.
 * Extracted from ProductSections so the 6 scroll chapters can each
 * render its own product detail without a separate product page.
 *
 * Style: PRD dark Grand Prix / telemetry — mono labels, red thread.
 */
import {
  BOTTLENECK_FACTORS,
  DECISION_TIMELINE,
  VENUE_EDGES,
  VENUE_NODES,
} from "@/data/venue";

export const SIGNAL_COLORS = {
  safe: "#2ECC71",
  monitor: "#F5C518",
  intervention: "#FF8C42",
  critical: "#FF3B30",
} as const;

export { BOTTLENECK_FACTORS, DECISION_TIMELINE };

export function MonacoMap({ highlightSafe = false }: { highlightSafe?: boolean }) {
  const w = 520;
  const h = 340;
  const pos = (x: number, y: number) => [x * w, y * h] as const;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-full w-full"
      role="img"
      aria-label="Schematic top-down map of Circuit de Monaco showing crowd routes and risk zones"
    >
      <rect x={0} y={0} width={w} height={h} fill="#16161B" />
      {/* faint grid */}
      {Array.from({ length: 11 }).map((_, i) => (
        <g key={i}>
          <line x1={i * (w / 10)} y1={0} x2={i * (w / 10)} y2={h} stroke="#2A2A32" strokeWidth={1} />
          <line x1={0} y1={i * (h / 10)} x2={w} y2={i * (h / 10)} stroke="#2A2A32" strokeWidth={1} />
        </g>
      ))}
      {/* edges */}
      {VENUE_EDGES.map((e, i) => {
        const a = VENUE_NODES.find((n) => n.id === e.from)!;
        const b = VENUE_NODES.find((n) => n.id === e.to)!;
        const [ax, ay] = pos(a.x / 100, a.y / 100);
        const [bx, by] = pos(b.x / 100, b.y / 100);
        const color = e.safe && highlightSafe ? "#2ECC71" : e.safe ? "#E4002B" : "#2A2A32";
        const dash = e.safe ? undefined : "6 6";
        return (
          <line
            key={i}
            x1={ax}
            y1={ay}
            x2={bx}
            y2={by}
            stroke={color}
            strokeWidth={e.safe ? 3 : 1.5}
            strokeDasharray={dash}
            opacity={0.9}
          />
        );
      })}
      {/* nodes */}
      {VENUE_NODES.map((n) => {
        const [x, y] = pos(n.x / 100, n.y / 100);
        const r = n.risk && n.risk >= 70 ? 10 : n.risk ? 8 : 5;
        const fill =
          n.risk && n.risk >= 70 ? "#FF3B30" : n.risk ? "#F5C518" : "#9A9AA5";
        return (
          <g key={n.id}>
            {n.risk && n.risk >= 70 && (
              <circle cx={x} cy={y} r={18} fill="none" stroke="#FF3B30" strokeWidth={1} opacity={0.6}>
                <animate attributeName="r" values="16;22;16" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.15;0.6" dur="2.4s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={x} cy={y} r={r} fill={fill} />
            <text
              x={x}
              y={y - r - 6}
              textAnchor="middle"
              fill="#F5F5F7"
              fontSize={9}
              fontFamily="JetBrains Mono, monospace"
              letterSpacing={1}
            >
              {n.name}
            </text>
            {n.risk !== undefined && (
              <text
                x={x}
                y={y + r + 13}
                textAnchor="middle"
                fill={fill}
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
              >
                RISK {n.risk}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
