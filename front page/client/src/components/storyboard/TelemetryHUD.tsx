/**
 * ACG — Telemetry HUD: Stage 2→4 of the UI transition.
 * 3D → 3D + telemetry → 3D + venue labels → 3D + twin UI → dashboard.
 * Fades in between 45% and 80% progress so the control-room language
 * bleeds into the cinematic scene before the product sections begin.
 */
import { sceneRamp } from "@/hooks/useStoryboardScroll";

function HudBlock({
  progress,
  from,
  to,
  children,
  className = "",
}: {
  progress: number;
  from: number;
  to: number;
  children: React.ReactNode;
  className?: string;
}) {
  const t = sceneRamp(progress, from, to);
  return (
    <div
      className={`acg-panel px-4 py-3 ${className}`}
      style={{ opacity: t, transform: `translateY(${(1 - t) * 12}px)` }}
    >
      {children}
    </div>
  );
}

export default function TelemetryHUD({ progress }: { progress: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block">
      {/* Top-left: system status */}
      <div className="absolute left-6 top-6 w-64" style={{ opacity: sceneRamp(progress, 0.42, 0.56) }}>
        <div className="acg-panel px-4 py-3">
          <p className="micro-label">ACG / Telemetry</p>
          <div className="mt-2 flex items-center justify-between font-telemetry text-xs">
            <span className="text-[#9a9aa5]">CIRCUIT</span>
            <span className="text-[#F5F5F7]">MONACO</span>
          </div>
          <div className="mt-1 flex items-center justify-between font-telemetry text-xs">
            <span className="text-[#9a9aa5]">FLOW</span>
            <span className="text-[#F5F5F7]">
              {Math.round(sceneRamp(progress, 0.4, 0.8) * 8420)} PPL
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between font-telemetry text-xs">
            <span className="text-[#9a9aa5]">RISK</span>
            <span style={{ color: progress > 0.62 ? "#FF3B30" : "#F5C518" }}>
              {progress > 0.62 ? "▲ 82 / 100 CRITICAL" : "● 41 / 100 MONITOR"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom-right: route metrics */}
      <HudBlock progress={progress} from={0.5} to={0.66} className="absolute bottom-6 right-6 w-72">
        <p className="micro-label">Route analysis</p>
        <div className="mt-2 space-y-1 font-telemetry text-xs">
          <div className="flex justify-between text-[#9a9aa5]">
            <span>EXPOSURE</span>
            <span style={{ color: "#FF3B30" }}>
              +0 sec · HIGH
            </span>
          </div>
          <div className="flex justify-between text-[#F5F5F7]">
            <span>OPTIMIZED</span>
            <span style={{ color: "#2ECC71" }}>+18s · −63%</span>
          </div>
        </div>
      </HudBlock>

      {/* Right mid: venue labels */}
      <div
        className="absolute right-6 top-1/3 w-56"
        style={{ opacity: sceneRamp(progress, 0.64, 0.78) }}
      >
        <div className="acg-panel px-4 py-3">
          <p className="micro-label" style={{ color: "#FF3B30" }}>
            ▲ GATE B — CRITICAL
          </p>
          <div className="mt-2 font-telemetry text-xs text-[#9a9aa5]">
            <p>T-06:12 TO THRESHOLD</p>
            <p className="mt-1">RISK 82 / 100</p>
          </div>
        </div>
      </div>
    </div>
  );
}
