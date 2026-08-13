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
  DoorClosed,
  DoorOpen,
  Gauge,
  GitBranch,
  Info,
  LogOut,
  MapPin,
  Pause,
  Play,
  Radar,
  Radio,
  Route,
  ShieldCheck,
  Siren,
  Store,
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
  const TIER_COLORS = {
    safe: "#2ECC71",
    monitor: "#F5C518",
    intervention: "#FF8C42",
    critical: "#FF3B30"
  };

  const getZoneIcon = (type, zoneId) => {
    if (type === "gate") {
      const isClosed = zoneId === "gate_8_k1_k3" && shock === "gate_8_closure";
      return isClosed ? DoorClosed : DoorOpen;
    }
    if (type === "exit") return LogOut;
    if (type === "concession") return Store;
    if (type === "field") return Users;
    return Route;
  };

  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(true);
  const [shock, setShock] = useState(null);
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [route, setRoute] = useState(null);
  const [emergency, setEmergency] = useState(false);
  const [emergencyData, setEmergencyData] = useState(null);
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [showPersonas, setShowPersonas] = useState(true);
  const [scenarios, setScenarios] = useState([]);
  const [activePreset, setActivePreset] = useState("baseline");
  const [cmdQuery, setCmdQuery] = useState("");
  const [cmdResult, setCmdResult] = useState("");
  const [cmdLoading, setCmdLoading] = useState(false);

  // ── Persona definitions (Feature 11) ──
  const personaList = [
    { id: "general", label: "General", color: "#2ECC71" },
    { id: "fan", label: "Fan Zone", color: "#F5C518" },
    { id: "vip", label: "VIP / Hospitality", color: "#9B59B6" },
    { id: "family", label: "Family", color: "#3498DB" },
    { id: "operations", label: "Staff / Ops", color: "#E67E22" },
  ];

  const getPersonaForZone = (z) => {
    const seed = (z.zone_id || "").split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const idx = Math.abs((seed + Math.round((z.density_norm || 0) * 100) + tick) % personaList.length);
    return personaList[idx];
  };
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
  const runCommand = async (q) => {
    setCmdQuery(q);
    setCmdLoading(true);
    try {
      const r = await postCommander(q, tick, shock);
      setCmdResult(r.answer);
    } catch {
      setCmdResult("Commander unavailable — check backend connection.");
    } finally {
      setCmdLoading(false);
    }
  };

  const handleCommand = async (e) => {
    if (e.key !== "Enter" || !cmdQuery.trim()) return;
    runCommand(cmdQuery);
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

  const COORDINATE_OVERRIDES = {
    ste_devote: { map_x: 20.0, map_y: 46.0 },
    fan_zone_place_darmes: { map_x: 44.0, map_y: 33.0 },
    port_hercule_promenade: { map_x: 60.0, map_y: 56.0 }
  };

  const zones = data.zone_states.map((z) => {
    const override = COORDINATE_OVERRIDES[z.zone_id];
    return override ? { ...z, ...override } : z;
  });
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

<<<<<<< HEAD
          <section className="legend-shapes">
            <span className="eyebrow">ZONE SYMBOLS</span>
            <div className="shape-legend-item">
              <span className="legend-shape-svg-wrapper">
                <svg viewBox="0 0 16 16" width="12" height="12">
                  <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="#6e6e77" strokeWidth="1.5" />
                </svg>
              </span>
              <span>Gate (Square)</span>
            </div>
            <div className="shape-legend-item">
              <span className="legend-shape-svg-wrapper">
                <svg viewBox="0 0 16 16" width="12" height="12">
                  <rect x="0.5" y="2.5" width="15" height="11" rx="5" fill="none" stroke="#6e6e77" strokeWidth="1.5" />
                </svg>
              </span>
              <span>Corridor (Pill)</span>
            </div>
            <div className="shape-legend-item">
              <span className="legend-shape-svg-wrapper">
                <svg viewBox="0 0 16 16" width="12" height="12">
                  <circle cx="8" cy="8" r="7" fill="none" stroke="#6e6e77" strokeWidth="1.5" />
                </svg>
              </span>
              <span>Concession (Circle)</span>
            </div>
            <div className="shape-legend-item">
              <span className="legend-shape-svg-wrapper">
                <svg viewBox="0 0 16 16" width="12" height="12">
                  <polygon points="8,1.5 14,5 14,11 8,14.5 2,11 2,5" fill="none" stroke="#6e6e77" strokeWidth="1.5" />
                </svg>
              </span>
              <span>Exit (Hexagon)</span>
            </div>
            <div className="shape-legend-item">
              <span className="legend-shape-svg-wrapper">
                <svg viewBox="0 0 16 16" width="12" height="12">
                  <polygon points="8,1 15,8 8,15 1,8" fill="none" stroke="#6e6e77" strokeWidth="1.5" />
                </svg>
              </span>
              <span>Field / Area (Diamond)</span>
=======
          {/* ── Persona Visuals ── */}
          <section className="personas" style={{ marginTop: 14 }}>
            <span className="eyebrow">PERSONA VISUALS</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              <label className="accessible-toggle" style={{ fontSize: 11 }}>
                <input type="checkbox" checked={showPersonas} onChange={(e) => setShowPersonas(e.target.checked)} />
                Show personas
              </label>
              <div className="persona-legend-items">
                {personaList.map((p) => (
                  <div key={p.id} className="persona-legend-item">
                    <span className="persona-swatch" style={{ background: p.color }} />
                    <small className="persona-label">{p.label}</small>
                  </div>
                ))}
              </div>
              <div className="persona-counts" aria-hidden style={{ marginTop: 4 }}>
                {(function () {
                  const map = {};
                  zones?.forEach((z) => {
                    const p = getPersonaForZone(z).id;
                    map[p] = (map[p] || 0) + 1;
                  });
                  return (
                    <div className="persona-counts-inner">
                      {personaList.map((p) => (
                        <div key={p.id} className="persona-count-item">
                          <span className="persona-swatch" style={{ background: p.color }} />
                          <small className="persona-count-number">{map[p.id] || 0}</small>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
>>>>>>> origin/Could-Have-Updations
            </div>
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
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {[
                { q: "highest risk area?", label: "Highest risk" },
                { q: "why is Port Hercule at risk?", label: "Why Port Hercule?" },
                { q: "safest route from highest risk?", label: "Safest route" },
              ].map((c) => (
                <button
                  key={c.q}
                  onClick={() => runCommand(c.q)}
                  style={{
                    background: "#15151a",
                    border: "1px solid var(--line)",
                    padding: "4px 7px",
                    fontSize: 10,
                    color: "#9f9fa8",
                    borderRadius: 3,
                    cursor: "pointer",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
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
              <svg viewBox="0 0 1000 571" preserveAspectRatio="xMidYMid meet">
                <defs>
                  {zones.map((z) => (
                    <radialGradient
                      key={`glow-grad-${z.zone_id}`}
                      id={`glow-grad-${z.zone_id}`}
                      cx="50%" cy="50%" r="50%"
                    >
                      <stop offset="0%" stopColor={TIER_COLORS[z.risk_tier]} stopOpacity={z.density_norm * 0.75} />
                      <stop offset="50%" stopColor={TIER_COLORS[z.risk_tier]} stopOpacity={z.density_norm * 0.3} />
                      <stop offset="100%" stopColor={TIER_COLORS[z.risk_tier]} stopOpacity="0" />
                    </radialGradient>
                  ))}
                </defs>

                {/* ── Dynamic Heatmap Glows ── */}
                {zones.map((z) => {
                  const cx = z.map_x * 10;
                  const cy = z.map_y * 5.71;
                  const glowSize = 25 + z.density_norm * 70;
                  return (
                    <circle
                      key={`glow-${z.zone_id}`}
                      cx={cx}
                      cy={cy}
                      r={glowSize}
                      fill={`url(#glow-grad-${z.zone_id})`}
                      className="heatmap-glow"
                    />
                  );
                })}

                {/* ── Pedestrian edges (corridors) ── */}
                {data.layout?.edges?.map((e, i) => {
                  const from = zones.find((z) => z.zone_id === e.from);
                  const to   = zones.find((z) => z.zone_id === e.to);
                  if (!from || !to) return null;
                  const path = route?.recommended_path || [];
                  const idxFrom = path.indexOf(e.from);
                  const idxTo = path.indexOf(e.to);
                  const isHotPath =
                    idxFrom !== -1 &&
                    idxTo !== -1 &&
                    Math.abs(idxFrom - idxTo) === 1;
                  return (
                    <line
                      key={i}
                      x1={from.map_x * 10} y1={from.map_y * 5.71}
                      x2={to.map_x * 10}   y2={to.map_y * 5.71}
                      className={`ped-edge ${isHotPath ? "route-path" : "edge-normal"} ${e.accessible === false ? "inaccessible" : ""}`}
                      strokeWidth={e.width_m ? e.width_m * 0.8 : 2}
                    />
                  );
                })}

                {/* ── Zone Nodes (Geometric shapes, badges, labels) ── */}
                {zones.map((z) => {
                  const cx = z.map_x * 10;
                  const cy = z.map_y * 5.71;
                  const IconComponent = getZoneIcon(z.zone_type, z.zone_id);
                  const isSelected = selectedId === z.zone_id;
                  const riskColor = TIER_COLORS[z.risk_tier];
                  const shapeFill = riskColor + "20"; // 12% opacity tint
                  const shapeStroke = isSelected ? riskColor : "#2A2A32";

                  let shapeElement = null;
                  if (z.zone_type === "gate") {
                    shapeElement = (
                      <rect
                        x={cx - 21}
                        y={cy - 21}
                        width={42}
                        height={42}
                        rx={6}
                        ry={6}
                        fill={shapeFill}
                        stroke={shapeStroke}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="zone-shape"
                      />
                    );
                  } else if (z.zone_type === "corridor") {
                    shapeElement = (
                      <rect
                        x={cx - 28}
                        y={cy - 16}
                        width={56}
                        height={32}
                        rx={16}
                        ry={16}
                        fill={shapeFill}
                        stroke={shapeStroke}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="zone-shape"
                      />
                    );
                  } else if (z.zone_type === "concession") {
                    shapeElement = (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={21}
                        fill={shapeFill}
                        stroke={shapeStroke}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="zone-shape"
                      />
                    );
                  } else if (z.zone_type === "exit") {
                    const pts = [
                      `${cx + 22},${cy}`,
                      `${cx + 11},${cy - 19}`,
                      `${cx - 11},${cy - 19}`,
                      `${cx - 22},${cy}`,
                      `${cx - 11},${cy + 19}`,
                      `${cx + 11},${cy + 19}`
                    ].join(" ");
                    shapeElement = (
                      <polygon
                        points={pts}
                        fill={shapeFill}
                        stroke={shapeStroke}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="zone-shape"
                      />
                    );
                  } else {
                    const pts = `${cx},${cy - 22} ${cx + 22},${cy} ${cx},${cy + 22} ${cx - 22},${cy}`;
                    shapeElement = (
                      <polygon
                        points={pts}
                        fill={shapeFill}
                        stroke={shapeStroke}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="zone-shape"
                      />
                    );
                  }

                  return (
                    <g
                      key={z.zone_id}
                      onClick={() => setSelectedId(z.zone_id)}
                      className={`zone-group ${isSelected ? "picked" : ""}`}
                      data-tour={isSelected ? "zone" : undefined}
                    >
                      {/* Active selection rotating dashed ring */}
                      {isSelected && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={28}
                          fill="none"
                          stroke={riskColor}
                          strokeWidth={1.2}
                          strokeDasharray="4 2"
                          pointerEvents="none"
                          style={{ pointerEvents: "none" }}
                        >
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from={`0 ${cx} ${cy}`}
                            to={`360 ${cx} ${cy}`}
                            dur="10s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}

                      {/* Geometric Node Shape */}
                      {shapeElement}

                      <foreignObject
                        x={cx - 10}
                        y={cy - 10}
                        width={20}
                        height={20}
                        pointerEvents="none"
                        style={{ pointerEvents: "none" }}
                      >
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "100%",
                          color: riskColor,
                          pointerEvents: "none"
                        }}>
                          <IconComponent size={14} strokeWidth={2.2} style={{ pointerEvents: "none" }} />
                        </div>
                      </foreignObject>

                      {/* Persona badge (top-left of the zone node) */}
                      {showPersonas && (() => {
                        const p = getPersonaForZone(z);
                        return (
                          <g pointerEvents="none" style={{ pointerEvents: "none" }}>
                            <circle
                              cx={cx - 17}
                              cy={cy - 17}
                              r={6}
                              fill={p.color}
                              stroke="#0a0a0d"
                              strokeWidth={1.5}
                              style={{ filter: "drop-shadow(0 1px 2px #0008)" }}
                            />
                            <title>{p.label} Persona</title>
                          </g>
                        );
                      })()}

                      {/* Tabular risk score badge in top right corner */}
                      <g pointerEvents="none" style={{ pointerEvents: "none" }}>
                        <circle
                          cx={cx + 17}
                          cy={cy - 17}
                          r={9}
                          fill={riskColor}
                          className="badge-circle"
                        />
                        <text
                          x={cx + 17}
                          y={cy - 17}
                          className="badge-text"
                          fill={z.risk_tier === "safe" || z.risk_tier === "monitor" ? "#0A0A0D" : "#FFFFFF"}
                        >
                          {z.risk_score}
                        </text>
                      </g>

                      {/* Dynamic name labels below node */}
                      <text x={cx} y={cy + 33} className="zone-text-label" pointerEvents="none" style={{ pointerEvents: "none" }}>
                        {z.zone_name.split(" - ")[0]}
                      </text>
                      <text x={cx} y={cy + 43} className="zone-text-sublabel" pointerEvents="none" style={{ pointerEvents: "none" }}>
                        {z.zone_type.toUpperCase()}
                      </text>
                    </g>
                  );
                })}
              </svg>
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
