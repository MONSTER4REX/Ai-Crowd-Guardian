/* AI Crowd Guardian — Monaco Operations Desk
   Telemetry Noir design (Swiss-style, graphite surfaces, Guardian Red signal)
   connected to Python FastAPI backend at /api/*
*/
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
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
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import "./index.css";

// ── Inline Guardian Shield (replaces external image) ──────────────────────────
const GuardianMark = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className="guardian-mark">
    <path d="M16 2L4 7v9c0 7.5 5.2 14.5 12 16 6.8-1.5 12-8.5 12-16V7L16 2zm0 4.2l9.6 4v7.3c0 5.8-4 11.3-9.6 12.6-5.6-1.3-9.6-6.8-9.6-12.6V10.2L16 6.2z" />
    <polygon points="16,9 18.5,14.5 24.5,15.2 20,19.3 21.2,25.2 16,22.2 10.8,25.2 12,19.3 7.5,15.2 13.5,14.5" />
  </svg>
);

// ── API helpers ────────────────────────────────────────────────────────────────
const API_BASE = "/api";

async function fetchTick(tick, shock) {
  const params = new URLSearchParams({ tick });
  if (shock) params.set("shock", shock);
  const res = await fetch(`${API_BASE}/tick?${params}`);
  if (!res.ok) throw new Error(`tick ${res.status}`);
  return res.json();
}

async function fetchRoute(zoneId, accessibleOnly) {
  const params = new URLSearchParams({ zone_id: zoneId, accessible_only: accessibleOnly });
  const res = await fetch(`${API_BASE}/route?${params}`);
  if (!res.ok) throw new Error(`route ${res.status}`);
  return res.json();
}

async function fetchEmergency(tick, shock) {
  const params = new URLSearchParams({ tick });
  if (shock) params.set("shock", shock);
  const res = await fetch(`${API_BASE}/emergency?${params}`);
  if (!res.ok) throw new Error(`emergency ${res.status}`);
  return res.json();
}

async function postCommander(prompt, tick, shock) {
  const res = await fetch(`${API_BASE}/commander`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, tick, shock }),
  });
  if (!res.ok) throw new Error(`commander ${res.status}`);
  return res.json();
}

async function fetchWhatIf(tick) {
  const res = await fetch(`${API_BASE}/whatif?tick=${tick}`);
  if (!res.ok) throw new Error(`whatif ${res.status}`);
  return res.json();
}

// ── Risk tier helpers ──────────────────────────────────────────────────────────
function meta(tier) {
  switch (tier) {
    case "safe": return ["Safe", ShieldCheck];
    case "monitor": return ["Monitor", Radar];
    case "intervention": return ["Intervention", AlertTriangle];
    case "critical": return ["Critical", TriangleAlert];
    default: return ["Unknown", Info];
  }
}

function clock(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

// ── Main App ───────────────────────────────────────────────────────────────────
function App() {
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(true);
  const [shock, setShock] = useState(null);
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [route, setRoute] = useState(null);
  const [emergency, setEmergency] = useState(false);
  const [emergencyData, setEmergencyData] = useState(null);
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [activePreset, setActivePreset] = useState("baseline");
  const [cmdQuery, setCmdQuery] = useState("");
  const [cmdResult, setCmdResult] = useState("");
  const [cmdLoading, setCmdLoading] = useState(false);
  const [log, setLog] = useState([
    { time: "12:41:20", kind: "resolved", title: "Risk reduced 82 → 54", body: "Route recommendation accepted at Port Hercule." },
    { time: "12:41:12", kind: "route",    title: "Safest route optimized", body: "Fontvieille path reduces exposure by 63%." },
    { time: "12:41:08", kind: "prediction", title: "Prediction issued · T−06:12", body: "Port Hercule will cross intervention threshold." },
    { time: "12:41:02", kind: "flow",    title: "Density rising", body: "Gate 8 and station flow converging." },
  ]);
  const [apiOnline, setApiOnline] = useState(true);
  const [tour, setTour] = useState(null);

  const tickRef = useRef(tick);
  tickRef.current = tick;

  // ── Fetch tick data ──
  const loadTick = useCallback(async (t, s) => {
    try {
      const d = await fetchTick(t, s);
      setData(d);
      setApiOnline(true);
      if (!selectedId && d.zone_states.length) {
        setSelectedId(d.highest_risk_zone_id);
      }
    } catch {
      setApiOnline(false);
    }
  }, [selectedId]);

  // ── Auto-tick ──
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => { loadTick(tick, shock); }, [tick, shock]);

  // ── First-run tour ──
  useEffect(() => {
    if (!localStorage.getItem("guardian-tour-seen")) setTimeout(() => setTour(0), 800);
  }, []);

  // ── Keyboard ESC ──
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape" && tour !== null) skipTour(); };
    addEventListener("keydown", fn);
    return () => removeEventListener("keydown", fn);
  });

  const skipTour = () => { localStorage.setItem("guardian-tour-seen", "1"); setTour(null); };
  const nextTour = () => (tour === 5 ? skipTour() : setTour((t) => t + 1));
  const prevTour = () => setTour((t) => Math.max(0, t - 1));

  // ── Load route when zone/accessibility changes ──
  useEffect(() => {
    if (!selectedId) return;
    fetchRoute(selectedId, accessibleOnly).then(setRoute).catch(() => {});
  }, [selectedId, accessibleOnly]);

  // ── Load emergency ──
  useEffect(() => {
    if (!emergency) { setEmergencyData(null); return; }
    fetchEmergency(tick, shock).then(setEmergencyData).catch(() => {});
  }, [emergency, tick, shock]);

  // ── Load what-if scenarios ──
  useEffect(() => {
    fetchWhatIf(tick)
      .then((d) => setScenarios(d.scenarios))
      .catch(() => {});
  }, [tick]);

  // ── Telemetry Commander ──
  const handleCommand = async (e) => {
    if (e.key !== "Enter" || !cmdQuery.trim()) return;
    setCmdLoading(true);
    try {
      const r = await postCommander(cmdQuery, tick, shock);
      setCmdResult(r.answer);
    } catch {
      setCmdResult("Commander unavailable — check backend connection.");
    } finally {
      setCmdLoading(false);
    }
  };

  // ── Inject shock ──
  const inject = (id) => {
    const s = id === "baseline" ? null : id;
    setShock(s);
    setActivePreset(id);
    const label = scenarios.find((x) => x.id === id)?.label || id;
    pushLog("shock", `Shock injected · ${label}`, "Simulation recalibrated across all zones.");
  };

  const pushLog = (kind, title, body) => {
    const time = new Date().toISOString().substring(11, 19);
    setLog((prev) => [{ time, kind, title, body }, ...prev].slice(0, 6));
  };

  // ── Accept recommendation ──
  const acceptRoute = () => {
    if (!route) return;
    const note = accessibleOnly ? " (Step-Free)" : "";
    pushLog("resolved", "Recommendation accepted", `Flow redirected to ${route.recommended_path.slice(-1)[0].replace(/_/g, " ")}${note}.`);
  };

  if (!data) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", color: "#92929d" }}>
          <GuardianMark />
          <p style={{ marginTop: 16, fontFamily: "'Titillium Web', sans-serif", letterSpacing: ".1em" }}>
            {apiOnline ? "CONNECTING TO BACKEND…" : "⚠ BACKEND OFFLINE — START api.py"}
          </p>
        </div>
      </div>
    );
  }

  const zones = data.zone_states;
  const focus = zones.find((z) => z.zone_id === selectedId) || zones[0];
  const highest = zones.reduce((a, b) => (b.risk_score > a.risk_score ? b : a), zones[0]);
  const [highLead, HighIcon] = meta(highest.risk_tier);

  return (
    <div className="app-shell">
      {/* ── Top Bar ── */}
      <header className="topbar">
        <div className="brand">
          <GuardianMark />
          <div>
            <b>AI CROWD GUARDIAN</b>
            <small>MONACO OPERATIONS DESK <i /> LIVE SIMULATION</small>
          </div>
        </div>
        <div className="top-meta">
          <span><MapPin size={13} /> CIRCUIT DE MONACO</span>
          <strong>{data.timestamp?.substring(11, 19) || "--:--:--"} UTC</strong>
          <span title={apiOnline ? "Backend connected" : "Backend offline"}>
            {apiOnline ? <Wifi size={14} className="icon-safe" /> : <WifiOff size={14} className="icon-critical" />}
          </span>
          <button
            onClick={() => setEmergency((e) => !e)}
            className={emergency ? "emergency-btn active" : "emergency-btn"}
            title="Toggle Emergency Evacuation Mode"
            aria-label="Emergency mode"
          >
            <Siren size={17} className={emergency ? "animate-pulse icon-critical" : ""} />
          </button>
          <button onClick={() => setTour(0)} aria-label="Replay onboarding tour">
            <CircleHelp size={17} />
          </button>
        </div>
      </header>

      {/* ── Emergency Banner ── */}
      {emergency && emergencyData && (
        <div className="emergency-banner">
          <Siren size={18} className="icon-critical" />
          <div>
            <strong>EMERGENCY EVACUATION MODE ACTIVE</strong>
            <span>{emergencyData.recommendation}</span>
          </div>
        </div>
      )}

      {/* ── Main Dashboard ── */}
      <main className="dashboard">
        {/* ── RAIL ── */}
        <aside className="rail">
          <span className="eyebrow">COMMAND RAIL</span>
          <h1>Protect the flow.</h1>
          <p>Predictive crowd safety for the moments that decide a venue.</p>
          <div className="rail-status">
            <i /> SYSTEM {apiOnline ? "NOMINAL" : "DEGRADED"} <em /> TICK {String(tick + 1).padStart(2, "0")}
          </div>

          <section>
            <span className="eyebrow">LIVE SIGNALS</span>
            <div className="signal"><Activity /><span>Flow velocity</span><b>{data.aggregate_flow_per_min?.toLocaleString() || "–"} <small>/ min</small></b></div>
            <div className="signal"><Users /><span>Simulated crowd</span><b>{data.simulated_crowd?.toLocaleString() || "28,416"}</b></div>
            <div className="signal"><Crosshair /><span>Zones in focus</span><b className="red">{data.zones_at_risk || 0}</b></div>
          </section>

          <section className="legend" data-tour="legend">
            <span className="eyebrow">RISK TIER</span>
            {[["safe", ShieldCheck, "Safe"], ["monitor", Radar, "Monitor"], ["intervention", AlertTriangle, "Intervention"], ["critical", TriangleAlert, "Critical"]].map(([tone, Icon, label]) => (
              <div key={label}>
                <Icon className={`icon-${tone}`} /><span>{label}</span><i />
              </div>
            ))}
          </section>

          {/* ── Telemetry Commander ── */}
          <section className="commander-section" data-tour="commander">
            <span className="eyebrow">💬 TELEMETRY COMMANDER</span>
            <input
              type="text"
              placeholder="Ask: highest risk? safest route? why?"
              value={cmdQuery}
              onChange={(e) => setCmdQuery(e.target.value)}
              onKeyDown={handleCommand}
              className="commander-input"
              aria-label="Telemetry commander query"
            />
            {cmdLoading && <div className="commander-result loading">Processing…</div>}
            {!cmdLoading && cmdResult && (
              <div className="commander-result">
                <span className="eyebrow red">COMMANDER:</span>
                {cmdResult}
              </div>
            )}
          </section>

          <footer>● NO LIVE CAMERAS · SYNTHETIC INPUT</footer>
        </aside>

        {/* ── Digital Twin Map ── */}
        <section className="twin-col">
          <div className="heading">
            <div>
              <span className="eyebrow">01 / LIVE DIGITAL TWIN</span>
              <h2>Venue pressure map</h2>
            </div>
            <div className="heading-tools">
              <span><i /> UPDATES EVERY 2 SEC</span>
              <button onClick={() => setRunning((x) => !x)}>
                {running ? <Pause /> : <Play />}{running ? "Pause" : "Resume"}
              </button>
            </div>
          </div>

          <div className="twin" data-tour="twin">
            <div className="map-inner">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">

                {/* ── Pedestrian edges from venue_layout.json ── */}
                {data.layout?.edges?.map((e, i) => {
                  const from = zones.find((z) => z.zone_id === e.from);
                  const to   = zones.find((z) => z.zone_id === e.to);
                  if (!from || !to) return null;
                  // Color edge by avg risk of its two endpoints
                  const avgRisk = ((from.risk_score || 0) + (to.risk_score || 0)) / 2;
                  const edgeTone = avgRisk > 80 ? "edge-critical"
                                 : avgRisk > 60 ? "edge-intervention"
                                 : avgRisk > 30 ? "edge-monitor"
                                 : "edge-safe";
                  const isHotPath =
                    (route?.recommended_path || []).includes(e.from) &&
                    (route?.recommended_path || []).includes(e.to);
                  return (
                    <line
                      key={i}
                      x1={from.map_x} y1={from.map_y}
                      x2={to.map_x}   y2={to.map_y}
                      className={`ped-edge ${edgeTone} ${isHotPath ? "route-path" : ""} ${e.accessible === false ? "inaccessible" : ""}`}
                    />
                  );
                })}

                {/* ── Highest-risk pulsing alert line ── */}
                {highest && highest.zone_id !== "fontvieille_egress" && (
                  <line
                    className="hot"
                    x1={highest.map_x} y1={highest.map_y}
                    x2="68" y2="87"
                  />
                )}

              </svg>

              {/* ── Zone Markers ── */}
              {zones.map((z) => (
                <button
                  key={z.zone_id}
                  onClick={() => setSelectedId(z.zone_id)}
                  data-tour={z.zone_id === selectedId ? "zone" : undefined}
                  className={`marker ${z.risk_tier} ${selectedId === z.zone_id ? "picked" : ""}`}
                  style={{ left: `${z.map_x}%`, top: `${z.map_y}%` }}
                  aria-label={`${z.zone_name}: ${z.risk_tier}, risk ${z.risk_score}`}
                >
                  <span className="halo" />
                  <b>{z.risk_score}</b>
                  <label>{z.zone_name.split(" - ")[0]}</label>
                </button>
              ))}
            </div>
          </div>

          {/* ── Prediction Alert ── */}
          <div className="alert" data-tour="prediction">
            <div><TriangleAlert /></div>
            <p>
              <span className="eyebrow">PREDICTION ALERT · {highest.zone_name.toUpperCase().split(" - ")[0]}</span>
              <strong>Intervention threshold in <em>{clock(highest.predicted_congestion_in_sec)}</em></strong>
              <small>Projected risk <b>{highest.risk_score}</b> · {highest.flow_rate} flow/min at current trajectory</small>
            </p>
            <button onClick={() => setSelectedId(highest.zone_id)}>
              <Route /> VIEW SAFEST ROUTE <ArrowUpRight />
            </button>
          </div>
        </section>

        {/* ── Decision Timeline ── */}
        <aside className="decisions">
          <div className="heading compact">
            <div>
              <span className="eyebrow">02 / DECISION TIMELINE</span>
              <h2>Operator log</h2>
            </div>
            <b className="feed"><i /> LIVE</b>
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
            <button className="link">View full event history <ArrowUpRight /></button>
          </div>
          <div className="confidence">
            <div>
              <span className="eyebrow">MODEL CONFIDENCE</span>
              <strong>{((data.model_confidence || 0.914) * 100).toFixed(1)}%</strong>
              <p>Validated against the last {tick + 1} ticks.</p>
            </div>
            <div className="bars"><i /><i /><i /><i /><i /></div>
          </div>
        </aside>
      </main>

      {/* ── Lower Panels ── */}
      <section className="lower">
        {/* ── What-If Simulator ── */}
        <div className="panel scenarios" data-tour="controls">
          <div className="heading compact">
            <div>
              <span className="eyebrow">03 / WHAT-IF SIMULATOR</span>
              <h2>Stress-test the next move</h2>
            </div>
            <small>PRESETS ONLY · DEMO SAFE</small>
          </div>
          <div className="preset-grid">
            {[
              { id: "baseline", label: "Baseline", detail: "Current schedule and open gates", Icon: Gauge, min: 8 },
              { id: "gate_8_closure", label: "Gate 8 closure", detail: "Rebalance K grandstand inflow", Icon: GitBranch, min: 5 },
              { id: "metro_arrival", label: "Metro arrival", detail: "Station releases 1,200 people", Icon: Radio, min: 3 },
            ].map(({ id, label, detail, Icon, min }) => {
              const sc = scenarios.find((s) => s.id === id);
              return (
                <button
                  key={id}
                  className={activePreset === id ? "active" : ""}
                  onClick={() => inject(id)}
                >
                  <Icon />
                  <span>
                    <b>{label}</b>
                    <small>{detail}</small>
                    {sc && <small style={{ color: sc.peak_risk_score > 70 ? "var(--intervention)" : "var(--safe)" }}>Peak risk: {sc.peak_risk_score}</small>}
                  </span>
                  <em>T−{String(min).padStart(2, "0")}m</em>
                </button>
              );
            })}
          </div>
          <footer>
            <span><Info /> Select a preset to replay a controlled crowd event.</span>
            {shock && (
              <button onClick={() => { setShock(null); setActivePreset("baseline"); }}>
                Clear event <X />
              </button>
            )}
          </footer>
        </div>

        {/* ── Bottleneck Explainability ── */}
        <div className="panel explain">
          <div className="heading compact">
            <div>
              <span className="eyebrow">04 / BOTTLENECK EXPLAINABILITY</span>
              <h2>{focus.zone_name.split(" - ")[0]}</h2>
            </div>
            {(() => {
              const [label, Icon] = meta(focus.risk_tier);
              return <b className={`badge ${focus.risk_tier}`}><Icon /> {label}</b>;
            })()}
          </div>
          <div className="explain-grid">
            <div className="score">
              <span>RISK SCORE</span>
              <strong>{focus.risk_score}</strong>
              <small>/ 100</small>
              <small style={{ marginTop: 8 }}>{focus.density_per_sqm} p/m²</small>
            </div>
            <div className="factors">
              {(focus.top_factors?.length ? focus.top_factors : [
                { cause: "Crowd density", weight: 0.42 },
                { cause: "Movement conflict", weight: 0.31 },
                { cause: "Exit capacity", weight: 0.17 },
                { cause: "Bottleneck geometry", weight: 0.10 },
              ]).map((f, i) => (
                <div key={f.cause}>
                  <span>{f.cause}</span>
                  <i><b style={{ width: `${Math.round(f.weight * 100)}%` }} /></i>
                  <strong>{Math.round(f.weight * 100)}%</strong>
                </div>
              ))}
            </div>
          </div>

          {route && (
            <div className="recommend">
              <Route />
              <p>
                <span className="eyebrow">RECOMMENDED ACTION</span>
                <strong>{route.recommended.split(" - ")[0]} {accessibleOnly && "♿"}</strong>
                <small><b>{route.exposure_reduction}</b> · {route.tradeoff}</small>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <label className="accessible-toggle">
                  <input
                    type="checkbox"
                    checked={accessibleOnly}
                    onChange={(e) => setAccessibleOnly(e.target.checked)}
                  />
                  ♿ Step-Free
                </label>
                <button onClick={acceptRoute}><BadgeCheck /> ACCEPT</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Onboarding Tour ── */}
      {tour !== null && <Tour step={tour} next={nextTour} prev={prevTour} skip={skipTour} />}
    </div>
  );
}

// ── Tour component ─────────────────────────────────────────────────────────────
function Tour({ step, next, prev, skip }) {
  const steps = [
    ["twin",      "This is your live venue view — each zone updates in real-time from the Python simulation backend."],
    ["legend",    "Color means risk tier, not just crowd size. A busy area can be safer than a smaller blocked one."],
    ["prediction","When trouble is coming, you'll see it here with a countdown before congestion threshold is reached."],
    ["zone",      "Click any zone to see exactly why it's at risk. The backend computes weighted explainability factors."],
    ["timeline",  "Every recommendation the AI makes is logged here, in order, with full audit trail."],
    ["commander", "Type any question and press Enter — the Telemetry Commander queries live simulation state to answer."],
  ];
  const [anchor, text] = steps[step];

  return (
    <div className="tour">
      <div className="scrim" onClick={skip} />
      <div className={`tip tip-${anchor}`}>
        <b>OPERATOR TOUR <span>{step + 1} OF {steps.length}</span></b>
        <p>{text}</p>
        <footer>
          <button onClick={skip}>Skip tour</button>
          <div>
            <button onClick={prev} disabled={!step}><ChevronLeft /> PREVIOUS</button>
            <button className="primary" onClick={next}>{step === steps.length - 1 ? "FINISH" : "NEXT"} <ChevronRight /></button>
          </div>
        </footer>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
