/**
 * ACG — Venue data: Circuit de Monaco digital twin.
 * Schematic top-down representation per the PRD: recognizable but
 * stylized and clean. Landmark nodes are the PRD's bottleneck /
 * injection points: Sainte Devote, Port Hercule,
 * Monaco Monte-Carlo station.
 */

export interface VenueNode {
  id: string;
  name: string;
  x: number; // schematic coords (0-100)
  y: number;
  type: "landmark" | "gate" | "station" | "corridor" | "zone";
  risk?: number;
}

export const VENUE_NODES: VenueNode[] = [
  { id: "devote", name: "SAINTE DEVOTE", x: 74, y: 62, type: "landmark", risk: 82 },
  { id: "port", name: "PORT HERCULE", x: 26, y: 74, type: "landmark", risk: 41 },
  { id: "station", name: "MONTE-CARLO STATION", x: 62, y: 18, type: "station", risk: 67 },
  { id: "tunnel", name: "FAIRMONT TUNNEL", x: 38, y: 34, type: "corridor" },
  { id: "casino", name: "CASINO SQUARE", x: 55, y: 42, type: "landmark", risk: 55 },
  { id: "gate-a", name: "GATE A", x: 18, y: 46, type: "gate", risk: 24 },
  { id: "gate-b", name: "GATE B", x: 46, y: 68, type: "gate", risk: 82 },
  { id: "gate-c", name: "GATE C", x: 82, y: 34, type: "gate", risk: 33 },
];

export interface VenueEdge {
  from: string;
  to: string;
  flow: number; // 0-100 crowd flow weight
  safe?: boolean;
}

// The edges that form the routing graph; used both to draw
// pathways in the 3D twin and for the reroute comparison.
export const VENUE_EDGES: VenueEdge[] = [
  { from: "gate-a", to: "tunnel", flow: 35 },
  { from: "gate-a", to: "port", flow: 22 },
  { from: "tunnel", to: "port", flow: 40 },
  { from: "tunnel", to: "casino", flow: 48 },
  { from: "station", to: "casino", flow: 60 },
  { from: "station", to: "gate-c", flow: 30 },
  { from: "casino", to: "devote", flow: 66 },
  { from: "gate-b", to: "devote", flow: 74, safe: true },
  { from: "port", to: "gate-b", flow: 45 },
  { from: "gate-c", to: "devote", flow: 38 },
];

/** Explained contributing factors for the Gate B risk (PRD UNDERSTAND panel). */
export const BOTTLENECK_FACTORS = [
  { label: "Crowd exiting stadium", value: 42, color: "#FF3B30" },
  { label: "Metro arrival", value: 31, color: "#FF8C42" },
  { label: "Food concession", value: 17, color: "#F5C518" },
  { label: "Narrow corridor", value: 10, color: "#9A9AA5" },
];

/** Decision timeline (PRD ACT panel). */
export const DECISION_TIMELINE = [
  { time: "12:41:02", event: "DENSITY RISING", signal: "monitor" as const },
  { time: "12:41:08", event: "PREDICTION: T-6M", signal: "intervention" as const },
  { time: "12:41:12", event: "ROUTE OPTIMIZED", signal: "safe" as const },
  { time: "12:41:20", event: "RISK 82 → 54", signal: "safe" as const },
];
