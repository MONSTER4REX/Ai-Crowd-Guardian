/**
 * ACG — Story overlay: one info block per scroll chapter.
 *
 * New rules (user requirement):
 * 1. Each of the 6 chapters carries exactly ONE information block —
 *    the project detail for that chapter. No analogy headings, no
 *    duplicated titles.
 * 2. Windows do NOT overlap: chapter i's block fully fades out
 *    (translate + opacity) before chapter i+1's block fades in,
 *    so the screen is never showing two chapters' info at once.
 */
import { sceneRamp } from "@/hooks/useStoryboardScroll";
import { MonacoMap, BOTTLENECK_FACTORS } from "@/data/insights";
import { Link } from "wouter";

const micro = "micro-label";
const panel = "acg-panel";

/**
 * Cross-fade window: returns style for a chapter's info block.
 * Each chapter i owns window [start, end) of global progress.
 * Fades in over the first 6% and out over the last 6% of its window,
 * so adjacent windows never visibly overlap (current block is gone
 * before the next one fully arrives).
 */
function infoWindow(
  p: number,
  start: number,
  end: number,
  fade = 0.06
): React.CSSProperties {
  const t =
    sceneRamp(p, start, start + fade) * (1 - sceneRamp(p, end - fade, end));
  return {
    opacity: t,
    transform: `translateY(${(1 - t) * 22}px)`,
    pointerEvents: t > 0.5 ? "auto" : "none",
  };
}

/** Persistent chapter rail (right edge) — only labels, never info. */
const CHAPTERS = [
  { at: 0.0, label: "01", title: "The idea" },
  { at: 0.17, label: "02", title: "How it works" },
  { at: 0.34, label: "03", title: "Data" },
  { at: 0.51, label: "04", title: "Predict" },
  { at: 0.68, label: "05", title: "Digital twin" },
  { at: 0.85, label: "06", title: "Guardian" },
];

function activeChapter(p: number): number {
  let idx = 0;
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (p >= CHAPTERS[i].at) {
      idx = i;
      break;
    }
  }
  return idx;
}

export default function StoryOverlay({ progress }: { progress: number }) {
  // At exact p=0 every sceneRamp returns 0, hiding the opening block;
  // nudge so the first chapter's info is immediately visible.
  const p = progress || 1e-6;
  const active = activeChapter(p);
  const lineFill = `${Math.min(100, p * 112)}%`;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {/* ─── 01 / THE IDEA — one block only ─────────────────── */}
      <div
        className="absolute left-[6vw] bottom-[12vh] max-w-xl"
        style={infoWindow(p, 0.0, 0.17, 0.02)}
      >
        <p className={micro}>01 — The idea</p>
        <h1 className="font-display mt-3 text-4xl font-bold uppercase leading-[1.04] md:text-6xl">
          Predict before the crowd
          <br />
          <span className="text-brand-red">becomes unsafe.</span>
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-[#9a9aa5] md:text-lg">
          AI Crowd Guardian is a crowd-safety intelligence platform: it sees
          how a crowd moves, predicts where it will become dangerous, and
          reroutes people before it happens.
        </p>
      </div>

      {/* ─── 02 / HOW IT WORKS — one block only ─────────────── */}
      <div
        className="absolute right-[6vw] top-[16vh] max-w-sm text-right"
        style={infoWindow(p, 0.17, 0.34, 0.02)}
      >
        <p className={micro} style={{ color: "#E4002B" }}>
          02 — How it works
        </p>
        <p className="font-display mt-3 text-2xl font-bold uppercase leading-snug md:text-3xl">
          Reactive safety
          <br />
          is too late.
        </p>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#9a9aa5] md:text-base">
          Traditional crowd management responds after congestion builds.
          Our platform runs a live crowd model on top of your venue and
          acts minutes before a bottleneck forms — SEE → PREDICT →
          EXPLAIN → REROUTE → ACT.
        </p>
      </div>

      {/* ─── 03 / DATA — one block only (live sensing) ──────── */}
      <div
        className="absolute right-[6vw] top-[20vh] max-w-sm text-right"
        style={infoWindow(p, 0.34, 0.51)}
      >
        <p className={micro} style={{ color: "#2ECC71" }}>
          03 — Data
        </p>
        <p className="font-display mt-3 text-2xl font-bold uppercase leading-snug md:text-3xl">
          A live feed
          <br />
          of crowd flow.
        </p>
        <div className="mt-5" style={{ opacity: sceneRamp(p, 0.38, 0.44) }}>
          <div className={`${panel} p-4 text-left`}>
            <p className={micro} style={{ color: "#2ECC71" }}>
              Live sensing feed
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#9a9aa5]">
              Cameras and entry counters stream density, entry rate and
              dwell time into the crowd model — refreshed every second.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 font-telemetry text-center text-[11px]">
              <div className="rounded bg-[#0E0E12] px-1 py-2">
                <p className="text-lg font-bold text-[#F5F5F7]">32</p>
                <p className="mt-0.5 text-[#9a9aa5]">CAMERAS</p>
              </div>
              <div className="rounded bg-[#0E0E12] px-1 py-2">
                <p className="text-lg font-bold text-[#F5F5F7]">8</p>
                <p className="mt-0.5 text-[#9a9aa5]">GATES</p>
              </div>
              <div className="rounded bg-[#0E0E12] px-1 py-2">
                <p className="text-lg font-bold text-[#2ECC71]">1s</p>
                <p className="mt-0.5 text-[#9a9aa5]">UPDATE</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 04 / PREDICT — one block only (risk readout + why) */}
      <div
        className="absolute left-[6vw] top-[14vh] max-w-md"
        style={infoWindow(p, 0.51, 0.68)}
      >
        <p className={micro} style={{ color: "#FF3B30" }}>
          04 — Predict
        </p>
        <p className="font-display mt-3 text-2xl font-bold uppercase leading-snug md:text-3xl">
          Risk, forecast
          <br />
          before it forms.
        </p>
        <div className="mt-5" style={{ opacity: sceneRamp(p, 0.55, 0.61) }}>
          <div className="grid grid-cols-2 gap-2">
            <div className={`${panel} p-3`}>
              <p className={micro}>Location</p>
              <p className="font-display mt-1 text-lg font-bold">GATE B</p>
            </div>
            <div className={`${panel} p-3`}>
              <p className={micro}>Risk score</p>
              <p className="font-telemetry mt-1 text-xl font-bold" style={{ color: "#FF3B30" }}>
                82<span className="text-xs text-[#9a9aa5]">/100</span>
              </p>
            </div>
            <div className={`${panel} p-3`}>
              <p className={micro}>Time to threshold</p>
              <p className="font-telemetry mt-1 text-xl font-bold" style={{ color: "#FF3B30" }}>
                T−06:12
              </p>
            </div>
            <div className={`${panel} p-3`}>
              <p className={micro}>Status</p>
              <p className="font-telemetry mt-1 text-base font-bold" style={{ color: "#FF3B30" }}>
                ▲ CRITICAL
              </p>
            </div>
          </div>
          <div className={`${panel} mt-2 p-4`}>
            <p className={micro} style={{ color: "#F5C518" }}>
              Explainable — why Gate B?
            </p>
            <div className="mt-3 space-y-2.5">
              {BOTTLENECK_FACTORS.map((f, i) => (
                <div key={f.label}>
                  <div className="flex justify-between font-telemetry text-xs">
                    <span className="text-[#F5F5F7]">{i + 1}. {f.label}</span>
                    <span style={{ color: f.color }}>{f.value}%</span>
                  </div>
                  <div className="mt-1 h-1 w-full bg-[#16161B]">
                    <div
                      className="h-full"
                      style={{ width: `${f.value}%`, background: f.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 05 / DIGITAL TWIN — one block only (reroute + map) */}
      <div
        className="absolute right-[6vw] bottom-[12vh] max-w-md text-right"
        style={infoWindow(p, 0.68, 0.85)}
      >
        <p className={micro} style={{ color: "#2ECC71" }}>
          05 — Digital twin
        </p>
        <p className="font-display mt-3 text-2xl font-bold uppercase leading-snug md:text-3xl">
          Reroute, not
          <br />
          just alert.
        </p>
        <div className="mt-5" style={{ opacity: sceneRamp(p, 0.72, 0.78) }}>
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className={`${panel} p-4`}>
              <p className={micro} style={{ color: "#FF3B30" }}>
                Current route
              </p>
              <p className="font-telemetry mt-2 text-xl font-bold text-[#F5F5F7]">+0 sec</p>
              <p className="mt-1 font-telemetry text-[10px]" style={{ color: "#FF3B30" }}>
                ▲ HIGH EXPOSURE
              </p>
            </div>
            <div className={`${panel} p-4`}>
              <p className={micro} style={{ color: "#2ECC71" }}>
                Recommended route
              </p>
              <p className="font-telemetry mt-2 text-xl font-bold text-[#F5F5F7]">+18 sec</p>
              <p className="mt-1 font-telemetry text-[10px]" style={{ color: "#2ECC71" }}>
                ✓ −63% EXPOSURE
              </p>
            </div>
          </div>
          <div className={`${panel} mt-2 p-2`}>
            <MonacoMap highlightSafe />
          </div>
        </div>
      </div>

      {/* ─── 06 / GUARDIAN — one block only (CTA) ───────────── */}
      <div
        className="absolute left-[6vw] top-[24vh] max-w-xl"
        style={infoWindow(p, 0.85, 1.0)}
      >
        <p className={micro} style={{ color: "#E4002B" }}>
          06 — Guardian
        </p>
        <h1 className="font-display mt-3 text-4xl font-black uppercase leading-[1.04] md:text-6xl">
          Predict before
          <br />
          the crowd
          <br />
          becomes unsafe.
        </h1>
        <div className="pointer-events-auto mt-6 flex flex-wrap gap-4">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-[#E4002B] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-transform duration-150 hover:brightness-110 active:scale-[0.97]"
          >
            Enter Operations Desk
            <span aria-hidden>→</span>
          </Link>
          <a
            href="mailto:hello@aicrowdguardian.com"
            className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-transform duration-150 hover:bg-white/10 active:scale-[0.97]"
          >
            Request the demo
          </a>
        </div>
      </div>

      {/* ─── Persistent chapter rail (right edge) ───────────── */}
      <div className="absolute right-5 top-0 flex h-full flex-col items-end justify-center gap-3 md:right-8">
        <div className="absolute top-[10%] h-[80%] w-px bg-white/10">
          <div
            className="w-full bg-[#E4002B] transition-[height] duration-200"
            style={{ height: lineFill }}
          />
        </div>
        {CHAPTERS.map((ch, i) => {
          const on = i === active;
          return (
            <div
              key={ch.label}
              className="relative z-10 flex items-center gap-2"
              style={{
                opacity: on ? 1 : 0.25,
                transition: "opacity 400ms cubic-bezier(0.23,1,0.32,1)",
              }}
            >
              <span
                className="font-telemetry text-[10px] font-semibold"
                style={{ color: on ? "#E4002B" : "#9a9aa5" }}
              >
                {ch.label}
              </span>
              <span
                className={`${micro} hidden sm:block`}
                style={{ color: on ? "#F5F5F7" : "#9a9aa5" }}
              >
                {ch.title}
              </span>
              <span
                className="h-1.5 w-1.5 rounded-full transition-colors duration-200"
                style={{ backgroundColor: on ? "#E4002B" : "#3a3a44" }}
              />
            </div>
          );
        })}
      </div>

      {/* ─── Scroll hint ────────────────────────────────────── */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        style={{ opacity: sceneRamp(p, 0.0, 0.04) }}
      >
        <p className={micro} style={{ color: "#9a9aa5" }}>
          Scroll to drive the story ↓
        </p>
      </div>
    </div>
  );
}
