/* Telemetry Noir: Swiss-style operations desk with graphite surfaces, ivory hierarchy, and Guardian Red for action only. */
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Crosshair,
  Gauge,
  GitBranch,
  Info,
  MapPin,
  Pause,
  Play,
  Radar,
  Radio,
  Route,
  ShieldCheck,
  Siren,
  TriangleAlert,
  Users,
  X,
  Zap,
} from "lucide-react";
import "./index.css";

// Inline Guardian Shield SVG Mark (clean, no external proxy asset dependency)
const GuardianMark = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8 fill-current text-[#E4002B] inline-block mr-2">
    <path d="M16 2L4 7v9c0 7.5 5.2 14.5 12 16 6.8-1.5 12-8.5 12-16V7L16 2zm0 4.2l9.6 4v7.3c0 5.8-4 11.3-9.6 12.6-5.6-1.3-9.6-6.8-9.6-12.6V10.2L16 6.2z" />
    <polygon points="16,9 18.5,14.5 24.5,15.2 20,19.3 21.2,25.2 16,22.2 10.8,25.2 12,19.3 7.5,15.2 13.5,14.5" />
  </svg>
);

const zones = [
  ["gate_1", "Gate 1 · Le Rocher", 14, 64, "gate", 49],
  ["sainte", "Sainte Devote", 27, 51, "pinch", 78],
  ["zone_z", "Zone Z · General Admission", 19, 34, "field", 36],
  ["station", "Monaco Monte-Carlo Station", 69, 17, "station", 55],
  ["gate_8", "Gate 8 · Grandstand K1–K3", 75, 31, "gate", 82],
  ["gate_7", "Gate 7 · Grandstand K4–K6", 86, 47, "gate", 47],
  ["port", "Port Hercule Promenade", 64, 55, "corridor", 86],
  ["gate_2", "Gate 2 · Grandstands N, O, P, V", 83, 69, "gate", 45],
  ["casino", "Casino Square · Grandstand B", 41, 22, "field", 34],
  ["fan", "Fan Zone · Place d'Armes", 47, 38, "concession", 43],
  ["gate_3", "Gate 3 · Grandstands T1–T3", 55, 75, "gate", 29],
  ["gate_4", "Gate 4 · Grandstands X1–X2", 37, 82, "gate", 26],
  ["gate_5", "Gate 5 · Grandstand L", 18, 78, "gate", 32],
  ["fontvieille", "Fontvieille Egress", 68, 87, "exit", 23],
];

const lines = [
  [14, 64, 27, 51],
  [19, 34, 27, 51],
  [69, 17, 75, 31],
  [75, 31, 64, 55],
  [86, 47, 64, 55],
  [83, 69, 64, 55],
  [64, 55, 27, 51],
  [64, 55, 68, 87],
  [41, 22, 47, 38],
  [47, 38, 55, 75],
  [55, 75, 37, 82],
  [37, 82, 18, 78],
];

const events = [
  { time: "12:41:20", kind: "resolved", title: "Risk reduced 82 → 54", body: "Route recommendation accepted at Port Hercule." },
  { time: "12:41:12", kind: "route", title: "Safest route optimized", body: "Fontvieille path reduces exposure by 63%." },
  { time: "12:41:08", kind: "prediction", title: "Prediction issued · T−06:12", body: "Port Hercule will cross intervention threshold." },
  { time: "12:41:02", kind: "flow", title: "Density rising", body: "Gate 8 and station flow converging." },
];

const presets = [
  { id: "baseline", label: "Baseline", detail: "Current schedule and open gates", icon: Gauge, min: 8 },
  { id: "gate_8_closure", label: "Gate 8 closure", detail: "Rebalance K grandstand inflow", icon: GitBranch, min: 5 },
  { id: "metro_arrival", label: "Metro arrival", detail: "Station releases 1,200 people", icon: Radio, min: 3 },
];

const factors = {
  port: ["Crowd exiting grandstands", "Metro arrival pressure", "Narrow harbour spine", "Opposing flow from Gate 7"],
  gate_8: ["Station arrival wave", "Gate stair capacity", "Grandstand release pattern", "Reduced alternate access"],
  sainte: ["Single narrow approach", "Zone Z crossing flow", "Low wheelchair access", "Turn 1 pinch geometry"],
};

function meta(n) {
  return n <= 30
    ? ["Safe", "safe", ShieldCheck]
    : n <= 60
    ? ["Monitor", "monitor", Radar]
    : n <= 80
    ? ["Intervention", "intervention", AlertTriangle]
    : ["Critical", "critical", TriangleAlert];
}

function states(t, shock) {
  let metro = shock === "metro_arrival" ? 14 : 0,
    close = shock === "gate_8_closure" ? 16 : 0;
  return zones.map((z, i) => {
    let n = Math.max(
        8,
        Math.min(
          98,
          z[5] +
            Math.round(3.5 * Math.sin((t + i) / 2.2)) +
            (z[0] === "station" ? metro : 0) +
            (z[0] === "gate_8" ? metro + close : 0) +
            (z[0] === "port" ? Math.round(metro * 0.55 + close * 0.65) : 0)
        )
      ),
      m = meta(n);
    return {
      id: z[0],
      name: z[1],
      x: z[2],
      y: z[3],
      kind: z[4],
      score: n,
      lead: m[0],
      tone: m[1],
      Icon: m[2],
      prediction: Math.max(3, Math.round((100 - n) / 8)),
      flow: Math.min(99, n + (z[4] === "corridor" ? 14 : 5)),
    };
  });
}

function clock(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function queryCommander(prompt, highest, atRiskCount) {
  const p = prompt.toLowerCase().strip ? prompt.toLowerCase().strip() : prompt.toLowerCase().trim();
  if (p.includes("highest") || p.includes("worst") || p.includes("peak") || p.includes("risk")) {
    return `The highest risk area is ${highest.name} with a risk score of ${highest.score} (${highest.lead.toUpperCase()}). Projected congestion threshold in ${highest.prediction} minutes.`;
  }
  if (p.includes("emergency") || p.includes("evac") || p.includes("rebalance")) {
    return "Emergency Status: Redirect 23% of Gate 8 inflow to Fontvieille Egress to prevent corridor overload.";
  }
  if (p.includes("route") || p.includes("path") || p.includes("safest")) {
    return `Safest route from ${highest.name}: Fontvieille Egress path. Tradeoff: +18s walking time, -63% crowd exposure.`;
  }
  if (p.includes("why") || p.includes("cause") || p.includes("reason")) {
    return `Top risk drivers for ${highest.name}: Crowd exiting grandstands (42%), Metro arrival pressure (31%), Narrow harbour spine (17%).`;
  }
  return `AI Guardian Status: Venue simulating 28,416 attendees across 14 zones. ${atRiskCount} zones above intervention threshold. Highest pressure: ${highest.name} (Risk ${highest.score}).`;
}

function App() {
  const [tick, setTick] = useState(0),
    [running, setRunning] = useState(true),
    [shock, setShock] = useState(null),
    [selected, setSelected] = useState("port"),
    [preset, setPreset] = useState("baseline"),
    [tour, setTour] = useState(null),
    [log, setLog] = useState(events),
    [emergency, setEmergency] = useState(false),
    [accessibleOnly, setAccessibleOnly] = useState(false),
    [cmdQuery, setCmdQuery] = useState(""),
    [cmdResult, setCmdResult] = useState("");

  const data = useMemo(() => states(tick, shock), [tick, shock]),
    focus = data.find((z) => z.id === selected) || data[0],
    highest = [...data].sort((a, b) => b.score - a.score)[0];

  useEffect(() => {
    if (!running) return;
    let i = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(i);
  }, [running]);

  useEffect(() => {
    if (!localStorage.getItem("guardian-tour-seen")) setTimeout(() => setTour(0), 500);
  }, []);

  useEffect(() => {
    let fn = (e) => e.key === "Escape" && tour !== null && skip();
    addEventListener("keydown", fn);
    return () => removeEventListener("keydown", fn);
  });

  const skip = () => {
      localStorage.setItem("guardian-tour-seen", "1");
      setTour(null);
    },
    next = () => (tour === 5 ? skip() : setTour((t) => t + 1)),
    prev = () => setTour((t) => Math.max(0, t - 1));

  const inject = (id) => {
    setShock(id);
    setPreset(id);
    let p = presets.find((x) => x.id === id);
    setLog(
      [
        {
          time: new Date().toISOString().substring(11, 19),
          kind: "shock",
          title: `Shock injected · ${p.label}`,
          body: "Simulation tick recalibrated across connected zones.",
        },
        ...log,
      ].slice(0, 5)
    );
  };

  const handleCommand = (e) => {
    if (e.key === "Enter" && cmdQuery.trim()) {
      setCmdResult(queryCommander(cmdQuery, highest, data.filter((z) => z.score > 60).length));
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <GuardianMark />
          <div>
            <b>AI CROWD GUARDIAN</b>
            <small>
              MONACO OPERATIONS DESK <i /> LIVE SIMULATION
            </small>
          </div>
        </div>
        <div className="top-meta">
          <span>
            <MapPin size={13} /> CIRCUIT DE MONACO
          </span>
          <strong>18:41:20 UTC</strong>
          <button
            onClick={() => setEmergency((e) => !e)}
            className={`top-btn ${emergency ? "bg-red-900 border-red-600 text-red-400" : ""}`}
            title="Toggle Emergency Evacuation Mode"
          >
            <Siren size={17} className={emergency ? "text-red-500 animate-pulse" : ""} />
          </button>
          <button onClick={() => setTour(0)} aria-label="Replay onboarding tour">
            <CircleHelp size={17} />
          </button>
        </div>
      </header>

      {emergency && (
        <div className="mx-8 mt-4 p-4 bg-[#250e12] border-2 border-[#FF3B30] rounded-md text-white">
          <div className="flex items-center gap-2 font-bold text-[#FF3B30]">
            <Siren size={20} className="animate-pulse" /> EMERGENCY EVACUATION MODE ACTIVE
          </div>
          <p className="mt-1 text-sm text-gray-200">
            Recommendation: Redirect 23% of Gate 8 traffic to Fontvieille Egress.
          </p>
        </div>
      )}

      <main className="dashboard">
        <aside className="rail">
          <span className="eyebrow">COMMAND RAIL</span>
          <h1>Protect the flow.</h1>
          <p>Predictive crowd safety for the moments that decide a venue.</p>
          <div className="rail-status">
            <i /> SYSTEM NOMINAL <em /> TICK {String(tick + 1).padStart(2, "0")}
          </div>

          <section>
            <span className="eyebrow">LIVE SIGNALS</span>
            <div className="signal">
              <Activity /> <span>Flow velocity</span>
              <b>
                1,842 <small>/ min</small>
              </b>
            </div>
            <div className="signal">
              <Users /> <span>Simulated crowd</span>
              <b>28,416</b>
            </div>
            <div className="signal">
              <Crosshair /> <span>Zones in focus</span>
              <b className="red">{data.filter((z) => z.score > 60).length}</b>
            </div>
          </section>

          <section className="legend" data-tour="legend">
            <span className="eyebrow">RISK TIER</span>
            {[
              [20, "Safe"],
              [50, "Monitor"],
              [70, "Intervention"],
              [90, "Critical"],
            ].map(([n, label]) => {
              let [, tone, Icon] = meta(n);
              return (
                <div key={label}>
                  <Icon className={`icon-${tone}`} />
                  <span>{label}</span>
                  <i />
                </div>
              );
            })}
          </section>

          <section className="mt-4 pt-4 border-t border-[#2a2a32]">
            <span className="eyebrow">💬 TELEMETRY COMMANDER</span>
            <input
              type="text"
              placeholder="Ask AI Commander..."
              value={cmdQuery}
              onChange={(e) => setCmdQuery(e.target.value)}
              onKeyDown={handleCommand}
              className="w-full mt-2 p-2 bg-[#121217] border border-[#2a2a32] rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E4002B]"
            />
            {cmdResult && (
              <div className="mt-2 p-2 bg-[#16161b] border border-[#E4002B] rounded text-xs text-gray-200">
                <span className="text-[#E4002B] font-bold block mb-1">COMMANDER:</span>
                {cmdResult}
              </div>
            )}
          </section>

          <footer>● NO LIVE CAMERAS · SYNTHETIC INPUT</footer>
        </aside>

        <section className="twin-col">
          <div className="heading">
            <div>
              <span className="eyebrow">01 / LIVE DIGITAL TWIN</span>
              <h2>Venue pressure map</h2>
            </div>
            <div className="heading-tools">
              <span>
                <i /> UPDATES EVERY 2 SEC
              </span>
              <button onClick={() => setRunning((x) => !x)}>
                {running ? <Pause /> : <Play />}
                {running ? "Pause" : "Resume"}
              </button>
            </div>
          </div>

          <div className="twin" data-tour="twin">
            <div className="map-label top">
              MONACO GP / PEDESTRIAN FLOW <b>LIVE</b>
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              {lines.map((l, i) => (
                <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} />
              ))}
              <line className="hot" x1="64" y1="55" x2="68" y2="87" />
            </svg>
            {data.map((z) => (
              <button
                key={z.id}
                onClick={() => setSelected(z.id)}
                data-tour={z.id === selected ? "zone" : undefined}
                className={`marker ${z.tone} ${selected === z.id ? "picked" : ""}`}
                style={{ left: `${z.x}%`, top: `${z.y}%` }}
                aria-label={`${z.name}: ${z.lead}, risk ${z.score}`}
              >
                <span className="halo" />
                <b>{z.score}</b>
                <label>{z.name.replace(" · ", " ").split(" ").slice(0, 2).join(" ")}</label>
              </button>
            ))}
            <div className="map-label bottom">
              NORTH ↑ <b>SCHEMATIC VIEW · v1.0.0</b>
            </div>
          </div>

          <div className="alert" data-tour="prediction">
            <div>
              <TriangleAlert />
            </div>
            <p>
              <span className="eyebrow">PREDICTION ALERT · {highest.name.toUpperCase()}</span>
              <strong>
                Intervention threshold in <em>{clock(highest.prediction * 60)}</em>
              </strong>
              <small>
                Projected risk <b>{highest.score}</b> · {highest.flow}% flow load at current trajectory
              </small>
            </p>
            <button onClick={() => setSelected(highest.id)}>
              <Route /> VIEW SAFEST ROUTE <ArrowUpRight />
            </button>
          </div>
        </section>

        <aside className="decisions">
          <div className="heading compact">
            <div>
              <span className="eyebrow">02 / DECISION TIMELINE</span>
              <h2>Operator log</h2>
            </div>
            <b className="feed">
              <i /> LIVE
            </b>
          </div>
          <div className="timeline" data-tour="timeline">
            {log.map((e, i) => (
              <div className="event" key={e.time + i}>
                <i className={e.kind} />
                <p>
                  <time>{e.time}</time>
                  <strong>{e.title}</strong>
                  <span>{e.body}</span>
                </p>
              </div>
            ))}
            <button className="link">
              View full event history <ArrowUpRight />
            </button>
          </div>
          <div className="confidence">
            <div>
              <span className="eyebrow">MODEL CONFIDENCE</span>
              <strong>91.4%</strong>
              <p>Validated against the last 24 ticks.</p>
            </div>
            <div className="bars">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        </aside>
      </main>

      <section className="lower">
        <div className="panel scenarios" data-tour="controls">
          <div className="heading compact">
            <div>
              <span className="eyebrow">03 / WHAT-IF SIMULATOR</span>
              <h2>Stress-test the next move</h2>
            </div>
            <small>PRESETS ONLY · DEMO SAFE</small>
          </div>
          <div className="preset-grid">
            {presets.map((p) => {
              let Icon = p.icon;
              return (
                <button className={preset === p.id ? "active" : ""} key={p.id} onClick={() => inject(p.id)}>
                  <Icon />
                  <span>
                    <b>{p.label}</b>
                    <small>{p.detail}</small>
                  </span>
                  <em>T−{String(p.min).padStart(2, "0")}m</em>
                </button>
              );
            })}
          </div>
          <footer>
            <span>
              <Info /> Select a preset to replay a controlled crowd event.
            </span>
            {shock && (
              <button
                onClick={() => {
                  setShock(null);
                  setPreset("baseline");
                }}
              >
                Clear event <X />
              </button>
            )}
          </footer>
        </div>

        <div className="panel explain">
          <div className="heading compact">
            <div>
              <span className="eyebrow">04 / BOTTLENECK EXPLAINABILITY</span>
              <h2>{focus.name}</h2>
            </div>
            <b className={`badge ${focus.tone}`}>
              <focus.Icon /> {focus.lead}
            </b>
          </div>
          <div className="explain-grid">
            <div className="score">
              <span>RISK SCORE</span>
              <strong>{focus.score}</strong>
              <small>/ 100</small>
            </div>
            <div className="factors">
              {(factors[focus.id] || ["Crowd density", "Movement conflict", "Exit capacity", "Bottleneck geometry"]).map(
                (f, i) => (
                  <div key={f}>
                    <span>{f}</span>
                    <i>
                      <b style={{ width: `${[84, 68, 53, 35][i]}%` }} />
                    </i>
                    <strong>{[42, 31, 17, 10][i]}%</strong>
                  </div>
                )
              )}
            </div>
          </div>
          <div className="recommend">
            <Route />
            <p>
              <span className="eyebrow">RECOMMENDED ACTION</span>
              <strong>Redirect to Fontvieille Egress {accessibleOnly && " (Step-Free)"}</strong>
              <small>
                <b>{accessibleOnly ? "−74% crowd exposure" : "−63% crowd exposure"}</b> ·{" "}
                {accessibleOnly ? "+28 sec walking time" : "+18 sec walking time"}
              </small>
            </p>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[9px] text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accessibleOnly}
                  onChange={(e) => setAccessibleOnly(e.target.checked)}
                  className="accent-[#E4002B]"
                />
                ♿ Step-Free
              </label>
              <button
                onClick={() =>
                  setLog(
                    [
                      {
                        time: new Date().toISOString().substring(11, 19),
                        kind: "resolved",
                        title: "Recommendation accepted",
                        body: `Flow redirected toward Fontvieille Egress ${accessibleOnly ? "(Wheelchair Step-Free)" : ""}.`,
                      },
                      ...log,
                    ].slice(0, 5)
                  )
                }
              >
                <BadgeCheck /> ACCEPT
              </button>
            </div>
          </div>
        </div>
      </section>

      {tour !== null && <Tour step={tour} next={next} prev={prev} skip={skip} />}
    </div>
  );
}

function Tour({ step, next, prev, skip }) {
  const s = [
    ["twin", "This is your live venue view — each zone updates as crowd conditions change."],
    ["legend", "Color here means risk, not just crowd size. A busy area can be safer than a smaller blocked one."],
    ["prediction", "When trouble is coming, you'll see it here with a countdown before it happens."],
    ["zone", "Click any zone to see exactly why it's at risk."],
    ["timeline", "Every recommendation the system makes is logged here, in order."],
    ["controls", "Test a preset scenario or inject a shock event from here."],
  ][step];

  return (
    <div className="tour">
      <div className="scrim" />
      <div className={`tip tip-${s[0]}`}>
        <b>
          OPERATOR TOUR <span>{step + 1} OF 6</span>
        </b>
        <p>{s[1]}</p>
        <footer>
          <button onClick={skip}>Skip tour</button>
          <div>
            <button onClick={prev} disabled={!step}>
              <ChevronLeft /> PREVIOUS
            </button>
            <button className="primary" onClick={next}>
              {step === 5 ? "FINISH" : "NEXT"} <ChevronRight />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
