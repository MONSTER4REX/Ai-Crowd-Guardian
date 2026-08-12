"""Explainable deterministic crowd simulation for AI Crowd Guardian."""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).parent


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
        score = (0.35 * self.density_norm + 0.20 * self.flow_conflict_norm +
                 0.20 * self.exit_capacity_deficit_norm +
                 0.15 * self.bottleneck_probability +
                 0.10 * self.accessibility_penalty)
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
        return round(max(120, 720 * (1 - self.density_norm) + 240 * (1 - self.bottleneck_probability)))


def load_layout() -> dict:
    with (ROOT / "venue_layout.json").open(encoding="utf-8") as file:
        return json.load(file)


def simulate_tick(tick: int = 0, shock: str | None = None) -> dict:
    """Return one deterministic tick for a UI or API consumer."""
    phase = tick % 24
    metro = 0.16 if shock == "metro_arrival" else 0.0
    closure = 0.18 if shock == "gate_8_closure" else 0.0
    base = {
        "gate_1_le_rocher": 0.51, "ste_devote": 0.76,
        "zone_z_general_admission": 0.38, "monaco_train_station": 0.52 + metro,
        "gate_8_k1_k3": 0.74 + metro + closure, "gate_7_k4_k6": 0.47,
        "port_hercule_promenade": 0.81 + metro * 0.5 + closure * 0.65,
        "gate_2_nopv": 0.43, "casino_square_gate_b": 0.34,
        "fan_zone_place_darmes": 0.42, "gate_3_t_stands": 0.29,
        "gate_4_x_stands": 0.25, "gate_5_grandstand_l": 0.31,
        "fontvieille_egress": 0.22,
    }
    states = []
    for index, zone in enumerate(load_layout()["zones"]):
        density = max(0.05, min(0.98, base.get(zone["id"], 0.3) + 0.035 * math.sin((phase + index) / 2.2)))
        flow = min(0.95, density * 0.74 + (0.14 if zone["type"] == "corridor" else 0.03))
        capacity = min(0.95, density * (0.72 if zone["type"] in {"gate", "exit"} else 0.84))
        bottleneck = min(0.96, density * (0.88 if zone["type"] == "corridor" else 0.55))
        accessibility = 0.18 if not zone["accessible"] and density > 0.48 else 0.04
        state = ZoneState(zone["id"], density, flow, capacity, bottleneck, accessibility)
        states.append({
            "zone_id": state.zone_id, "density_norm": round(density, 3),
            "flow_conflict_norm": round(flow, 3),
            "exit_capacity_deficit_norm": round(capacity, 3),
            "bottleneck_probability": round(bottleneck, 3),
            "risk_score": state.risk_score, "risk_tier": state.risk_tier,
            "predicted_congestion_in_sec": state.predicted_congestion_in_sec,
        })
    return {"tick": tick, "timestamp": "2026-08-22T18:41:08Z", "zone_states": states}


def recommend_route(zone_id: str = "port_hercule_promenade") -> dict:
    return {
        "from_zone": zone_id,
        "recommended": "Port Hercule → Fontvieille Egress",
        "tradeoff": "+18 sec walking time",
        "exposure_reduction": "−63% crowd exposure",
        "reason": "The harbour spine is forecast to conflict with incoming Gate 8 and station flow.",
    }
