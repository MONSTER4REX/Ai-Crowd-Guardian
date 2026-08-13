"""Explainable deterministic crowd simulation for AI Crowd Guardian."""
from __future__ import annotations

import json
import math
import os
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import requests

# Load .env file so HF_TOKEN is available
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass  # dotenv optional; set HF_TOKEN manually if not installed


ROOT = Path(__file__).parent

FACTOR_LIBRARY: dict[str, list[str]] = {
    "port_hercule_promenade": [
        "Crowd exiting grandstands",
        "Metro arrival pressure",
        "Narrow harbour spine",
        "Opposing flow from Gate 7",
    ],
    "gate_8_k1_k3": [
        "Station arrival wave",
        "Gate stair capacity",
        "Grandstand release pattern",
        "Reduced alternate access",
    ],
    "ste_devote": [
        "Single narrow approach",
        "Zone Z crossing flow",
        "Low wheelchair access",
        "Turn 1 pinch geometry",
    ],
    "monaco_train_station": [
        "Scheduled train arrival",
        "Tunnel throughput limit",
        "Gate 8 funnel pressure",
        "Peak inflow burst",
    ],
    "fontvieille_egress": [
        "Post-event release surge",
        "Harbour corridor backflow",
        "Exit lane width",
        "Accessible route demand",
    ],
}

DEFAULT_FACTORS = [
    "Crowd density",
    "Movement conflict",
    "Exit capacity deficit",
    "Bottleneck geometry",
]

WHAT_IF_PRESETS = [
    {
        "id": "baseline",
        "label": "Baseline",
        "detail": "Current schedule and open gates",
        "shock": None,
        "time_to_congestion_min": 8,
    },
    {
        "id": "gate_8_closure",
        "label": "Gate 8 closure",
        "detail": "Rebalance K grandstand inflow",
        "shock": "gate_8_closure",
        "time_to_congestion_min": 5,
    },
    {
        "id": "metro_arrival",
        "label": "Metro arrival",
        "detail": "Station releases 1,200 people",
        "shock": "metro_arrival",
        "time_to_congestion_min": 3,
    },
]


@dataclass
class ZoneState:
    zone_id: str
    density_norm: float
    flow_conflict_norm: float
    exit_capacity_deficit_norm: float
    bottleneck_probability: float
    accessibility_penalty: float

    @property
    def risk_score(self) -> int:
        score = (
            0.35 * self.density_norm
            + 0.20 * self.flow_conflict_norm
            + 0.20 * self.exit_capacity_deficit_norm
            + 0.15 * self.bottleneck_probability
            + 0.10 * self.accessibility_penalty
        )
        return round(max(0, min(100, score * 100)))

    @property
    def risk_tier(self) -> str:
        if self.risk_score <= 30:
            return "safe"
        if self.risk_score <= 60:
            return "monitor"
        if self.risk_score <= 80:
            return "intervention"
        return "critical"

    @property
    def predicted_congestion_in_sec(self) -> int:
        return round(
            max(120, 720 * (1 - self.density_norm) + 240 * (1 - self.bottleneck_probability))
        )


def load_layout() -> dict:
    with (ROOT / "venue_layout.json").open(encoding="utf-8") as file:
        return json.load(file)


def _zone_lookup() -> dict[str, dict]:
    return {zone["id"]: zone for zone in load_layout()["zones"]}


def _build_top_factors(zone_id: str, state: ZoneState) -> list[dict]:
    labels = FACTOR_LIBRARY.get(zone_id, DEFAULT_FACTORS)
    raw_weights = [
        state.density_norm * 0.42,
        state.flow_conflict_norm * 0.31,
        state.exit_capacity_deficit_norm * 0.17,
        state.bottleneck_probability * 0.10,
    ]
    total = sum(raw_weights) or 1.0
    factors = []
    for label, weight in zip(labels, raw_weights, strict=False):
        normalized = round(weight / total, 2)
        if normalized > 0:
            factors.append({"cause": label, "weight": normalized})
    factors.sort(key=lambda item: item["weight"], reverse=True)
    return factors[:4]


def _flow_rate(zone: dict, density: float) -> int:
    return round(zone["capacity_per_min"] * density)


def _density_per_sqm(density_norm: float) -> float:
    return round(1.2 + density_norm * 4.8, 1)


def _model_confidence(tick: int, shock: str | None) -> float:
    base = 0.914 if shock is None else 0.887
    oscillation = 0.012 * math.sin(tick / 3.5)
    return round(min(0.98, max(0.82, base + oscillation)), 3)


def simulate_tick(tick: int = 0, shock: str | None = None) -> dict:
    """Return one deterministic tick for a UI or API consumer."""
    layout = load_layout()
    lookup = {zone["id"]: zone for zone in layout["zones"]}
    phase = tick % 24
    metro = 0.16 if shock == "metro_arrival" else 0.0
    closure = 0.18 if shock == "gate_8_closure" else 0.0
    base = {
        "gate_1_le_rocher": 0.51,
        "ste_devote": 0.76,
        "zone_z_general_admission": 0.38,
        "monaco_train_station": 0.52 + metro,
        "gate_8_k1_k3": 0.74 + metro + closure,
        "gate_7_k4_k6": 0.47,
        "port_hercule_promenade": 0.81 + metro * 0.5 + closure * 0.65,
        "gate_2_nopv": 0.43,
        "casino_square_gate_b": 0.34,
        "fan_zone_place_darmes": 0.42,
        "gate_3_t_stands": 0.29,
        "gate_4_x_stands": 0.25,
        "gate_5_grandstand_l": 0.31,
        "fontvieille_egress": 0.22,
    }

    zone_states = []
    for index, zone in enumerate(layout["zones"]):
        density = max(
            0.05,
            min(
                0.98,
                base.get(zone["id"], 0.3) + 0.035 * math.sin((phase + index) / 2.2),
            ),
        )
        flow = min(0.95, density * 0.74 + (0.14 if zone["type"] == "corridor" else 0.03))
        capacity = min(
            0.95, density * (0.72 if zone["type"] in {"gate", "exit"} else 0.84)
        )
        bottleneck = min(
            0.96, density * (0.88 if zone["type"] == "corridor" else 0.55)
        )
        accessibility = 0.18 if not zone["accessible"] and density > 0.48 else 0.04
        state = ZoneState(zone["id"], density, flow, capacity, bottleneck, accessibility)
        zone_states.append(
            {
                "zone_id": state.zone_id,
                "zone_name": zone["name"],
                "zone_type": zone["type"],
                "map_x": zone.get("map_x", 50),
                "map_y": zone.get("map_y", 50),
                "density_norm": round(density, 3),
                "density_per_sqm": _density_per_sqm(density),
                "flow_rate": _flow_rate(zone, density),
                "flow_conflict_norm": round(flow, 3),
                "exit_capacity_deficit_norm": round(capacity, 3),
                "bottleneck_probability": round(bottleneck, 3),
                "accessibility_penalty": round(accessibility, 3),
                "risk_score": state.risk_score,
                "risk_tier": state.risk_tier,
                "predicted_congestion_in_sec": state.predicted_congestion_in_sec,
                "top_factors": _build_top_factors(zone["id"], state),
                "prediction_confidence": round(
                    min(0.97, max(0.78, 0.86 + density * 0.08)), 3
                ),
            }
        )

    highest = max(zone_states, key=lambda item: item["risk_score"])
    aggregate_flow = sum(item["flow_rate"] for item in zone_states)
    zones_at_risk = sum(1 for item in zone_states if item["risk_score"] > 60)

    return {
        "tick": tick,
        "timestamp": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "shock": shock,
        "model_confidence": _model_confidence(tick, shock),
        "aggregate_flow_per_min": aggregate_flow,
        "simulated_crowd": 28416,
        "zones_at_risk": zones_at_risk,
        "highest_risk_zone_id": highest["zone_id"],
        "zone_states": zone_states,
        "layout": {
            "venue_id": layout["venue_id"],
            "venue_name": layout["venue_name"],
            "edges": layout["edges"],
        },
    }


def recommend_route(
    zone_id: str = "port_hercule_promenade", accessible_only: bool = False
) -> dict:
    layout = load_layout()
    lookup = _zone_lookup()
    if zone_id not in lookup:
        zone_id = "port_hercule_promenade"
    zone = lookup[zone_id]

    # Shortest path by distance through the venue graph to Fontvieille egress.
    graph: dict[str, list[tuple[str, float]]] = {}
    for edge in layout["edges"]:
        if accessible_only and not edge.get("accessible", True):
            continue
        graph.setdefault(edge["from"], []).append((edge["to"], edge["distance_m"]))
        graph.setdefault(edge["to"], []).append((edge["from"], edge["distance_m"]))

    target = "fontvieille_egress"
    distances: dict[str, float] = {zone_id: 0.0}
    previous: dict[str, str | None] = {zone_id: None}
    visited: set[str] = set()

    while len(visited) < len(graph):
        current = min(
            (node for node in distances if node not in visited),
            key=lambda node: distances[node],
            default=None,
        )
        if current is None or current == target:
            break
        visited.add(current)
        for neighbor, weight in graph.get(current, []):
            alt = distances[current] + weight
            if neighbor not in distances or alt < distances[neighbor]:
                distances[neighbor] = alt
                previous[neighbor] = current

    path: list[str] = []
    node: str | None = target if target in previous else None
    while node:
        path.append(node)
        node = previous.get(node)
    path.reverse()

    if not path or path[0] != zone_id:
        path = [zone_id, "port_hercule_promenade", target]

    edge_map: dict[tuple[str, str], float] = {}
    for edge in layout["edges"]:
        edge_map[(edge["from"], edge["to"])] = edge["distance_m"]
        edge_map[(edge["to"], edge["from"])] = edge["distance_m"]

    total_dist = sum(edge_map.get((u, v), 0.0) for u, v in zip(path[:-1], path[1:]))
    shortest_distance = round(total_dist) if total_dist > 0 else 400

    alternate_distance = shortest_distance + (120 if accessible_only else 80)
    exposure_reduction = 74 if accessible_only else (63 if zone_id == "port_hercule_promenade" else 48)
    walking_delta = 28 if accessible_only else (18 if zone_id == "port_hercule_promenade" else 24)

    readable = " -> ".join(lookup[n]["name"].split(" - ")[0] for n in path)

    access_note = " (Wheelchair Accessible Path)" if accessible_only else ""
    return {
        "from_zone": zone_id,
        "from_zone_name": zone["name"],
        "accessible_only": accessible_only,
        "recommended_path": path,
        "recommended": readable + access_note,
        "tradeoff": f"+{walking_delta} sec walking time",
        "exposure_reduction": f"-{exposure_reduction}% crowd exposure",
        "shortest_distance_m": shortest_distance,
        "recommended_distance_m": alternate_distance,
        "reason": (
            f"{zone['name']} is forecast to conflict with converging gate and station flow. "
            f"The alternate path minimizes crowd exposure {'and guarantees step-free wheelchair access' if accessible_only else 'despite slightly longer walking time'}."
        ),
    }


def what_if_scenarios(tick: int = 0) -> dict:
    scenarios = []
    for preset in WHAT_IF_PRESETS:
        snapshot = simulate_tick(tick, preset["shock"])
        highest = max(snapshot["zone_states"], key=lambda item: item["risk_score"])
        scenarios.append(
            {
                "id": preset["id"],
                "label": preset["label"],
                "detail": preset["detail"],
                "shock": preset["shock"],
                "time_to_congestion_min": preset["time_to_congestion_min"],
                "peak_risk_score": highest["risk_score"],
                "peak_zone_id": highest["zone_id"],
                "peak_zone_name": highest["zone_name"],
                "recommended": preset["id"] == "baseline",
            }
        )

    recommended = min(scenarios, key=lambda item: item["peak_risk_score"])
    recommended["recommended"] = True
    for scenario in scenarios:
        if scenario["id"] != recommended["id"]:
            scenario["recommended"] = False

    return {"tick": tick, "scenarios": scenarios, "recommended_scenario_id": recommended["id"]}


def emergency_status(tick: int = 0, shock: str | None = None) -> dict:
    snapshot = simulate_tick(tick, shock)
    lookup = _zone_lookup()
    exits = []

    for state in snapshot["zone_states"]:
        zone = lookup[state["zone_id"]]
        if zone["type"] != "exit":
            continue
        capacity = zone["capacity_per_min"]
        throughput = state["flow_rate"]
        utilization = round(throughput / capacity, 2) if capacity else 0
        exits.append(
            {
                "zone_id": state["zone_id"],
                "name": zone["name"],
                "capacity_per_min": capacity,
                "current_throughput": throughput,
                "utilization": utilization,
                "risk_score": state["risk_score"],
                "risk_tier": state["risk_tier"],
            }
        )

    # Gates also act as egress points during emergency.
    for state in snapshot["zone_states"]:
        zone = lookup[state["zone_id"]]
        if zone["type"] != "gate" or state["risk_score"] < 55:
            continue
        capacity = zone["capacity_per_min"]
        throughput = state["flow_rate"]
        exits.append(
            {
                "zone_id": state["zone_id"],
                "name": zone["name"],
                "capacity_per_min": capacity,
                "current_throughput": throughput,
                "utilization": round(throughput / capacity, 2) if capacity else 0,
                "risk_score": state["risk_score"],
                "risk_tier": state["risk_tier"],
            }
        )

    exits.sort(key=lambda item: item["utilization"], reverse=True)
    overloaded = exits[0] if exits else None
    underused = min(exits, key=lambda item: item["utilization"]) if exits else None

    redirect_pct = 23
    if overloaded and underused and overloaded["zone_id"] != underused["zone_id"]:
        recommendation = (
            f"Redirect {redirect_pct}% of {overloaded['name'].split(' - ')[0]} traffic "
            f"to {underused['name'].split(' - ')[0]}."
        )
    else:
        recommendation = "Maintain current exit balance — no rebalancing required."

    return {
        "active": True,
        "tick": tick,
        "exits": exits,
        "recommendation": recommendation,
        "redirect_percent": redirect_pct if overloaded and underused else 0,
        "from_exit_id": overloaded["zone_id"] if overloaded else None,
        "to_exit_id": underused["zone_id"] if underused else None,
    }


# ---------------------------------------------------------------------------
# Hugging Face Inference API — zero-shot intent classification
# Model: facebook/bart-large-mnli  (Hugging Face Hub)
# ---------------------------------------------------------------------------
_HF_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
_HF_CANDIDATE_LABELS = [
    "highest risk zone",
    "emergency evacuation",
    "safest route",
    "risk causes and factors",
    "general status",
]


def _classify_intent_via_hf(prompt: str) -> tuple[str, float]:
    """Call Hugging Face Inference API to classify prompt intent.

    Returns (label, confidence_score). Falls back to 'general status' on error.
    Requires HF_TOKEN env var for authenticated access (free tier is fine).
    """
    token = os.environ.get("HF_TOKEN", "")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        resp = requests.post(
            _HF_API_URL,
            headers=headers,
            json={"inputs": prompt, "parameters": {"candidate_labels": _HF_CANDIDATE_LABELS}},
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
        # bart-large-mnli returns {labels: [...], scores: [...]}
        label: str = data["labels"][0]
        score: float = round(data["scores"][0], 3)
        return label, score
    except Exception:  # noqa: BLE001
        return "general status", 0.0


def query_commander(prompt: str, tick: int = 0, shock: str | None = None) -> dict:
    """Natural-Language Telemetry Commander constrained to simulation state.

    Intent is classified by the Hugging Face Inference API
    (facebook/bart-large-mnli) rather than brittle keyword matching.
    Falls back gracefully if the HF call is unavailable.
    """
    snapshot = simulate_tick(tick, shock)
    states = snapshot["zone_states"]
    highest = max(states, key=lambda z: z["risk_score"])
    at_risk = [z for z in states if z["risk_score"] > 60]

    # --- AI intent classification via Hugging Face Hub ---
    intent, confidence = _classify_intent_via_hf(prompt)

    if intent == "highest risk zone":
        answer = (
            f"The highest risk area is {highest['zone_name'].split(' - ')[0]} "
            f"with a risk score of {highest['risk_score']} ({highest['risk_tier'].upper()}). "
            f"Projected congestion threshold in {round(highest['predicted_congestion_in_sec']/60, 1)} minutes."
        )
    elif intent == "emergency evacuation":
        em = emergency_status(tick, shock)
        answer = f"Emergency Evacuation Status: {em['recommendation']}"
    elif intent == "safest route":
        rec = recommend_route(highest["zone_id"])
        answer = (
            f"Safest route from {highest['zone_name'].split(' - ')[0]}: {rec['recommended']}. "
            f"Tradeoff: {rec['tradeoff']}, {rec['exposure_reduction']} exposure."
        )
    elif intent == "risk causes and factors":
        factors = ", ".join(f"{f['cause']} ({int(f['weight']*100)}%)" for f in highest["top_factors"])
        answer = f"Top risk drivers for {highest['zone_name'].split(' - ')[0]}: {factors}."
    else:  # general status
        answer = (
            f"AI Guardian Status: Venue simulating {snapshot['simulated_crowd']:,} attendees across 14 zones. "
            f"{len(at_risk)} zones above intervention threshold. "
            f"Highest pressure: {highest['zone_name'].split(' - ')[0]} (Risk {highest['risk_score']})."
        )

    return {
        "query": prompt,
        "answer": answer,
        "hf_model": "facebook/bart-large-mnli",
        "hf_intent": intent,
        "hf_confidence": confidence,
    }

