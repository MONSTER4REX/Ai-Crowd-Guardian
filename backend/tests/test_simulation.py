"""Unit test suite for AI Crowd Guardian backend simulation engine."""
from __future__ import annotations

import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from simulation import (
    emergency_status,
    load_layout,
    query_commander,
    recommend_route,
    simulate_tick,
    what_if_scenarios,
)


def test_load_layout():
    layout = load_layout()
    assert layout["venue_id"] == "circuit_de_monaco"
    assert len(layout["zones"]) == 14
    assert len(layout["edges"]) == 13


def test_simulate_tick():
    tick0 = simulate_tick(0)
    assert tick0["tick"] == 0
    assert len(tick0["zone_states"]) == 14
    assert tick0["simulated_crowd"] == 28416
    assert 0.0 <= tick0["model_confidence"] <= 1.0


def test_recommend_route_standard():
    route = recommend_route("port_hercule_promenade")
    assert route["from_zone"] == "port_hercule_promenade"
    assert "fontvieille_egress" in route["recommended_path"]
    assert route["shortest_distance_m"] > 0


def test_recommend_route_accessibility_mode():
    route_standard = recommend_route("gate_1_le_rocher", accessible_only=False)
    route_accessible = recommend_route("gate_1_le_rocher", accessible_only=True)
    assert route_accessible["accessible_only"] is True
    assert "Wheelchair Accessible" in route_accessible["recommended"]


def test_what_if_scenarios():
    scenarios = what_if_scenarios(0)
    assert len(scenarios["scenarios"]) == 3
    assert scenarios["recommended_scenario_id"] in ["baseline", "gate_8_closure", "metro_arrival"]


def test_emergency_status():
    em = emergency_status(0)
    assert em["active"] is True
    assert len(em["exits"]) > 0
    assert "Redirect" in em["recommendation"] or "Maintain" in em["recommendation"]


def test_query_commander():
    q_risk = query_commander("What is the highest risk area?")
    assert "highest risk" in q_risk["answer"].lower()

    q_route = query_commander("Show me the safest route")
    assert "safest route" in q_route["answer"].lower()

    q_em = query_commander("evacuation status")
    assert "emergency evacuation status" in q_em["answer"].lower()


if __name__ == "__main__":
    test_load_layout()
    test_simulate_tick()
    test_recommend_route_standard()
    test_recommend_route_accessibility_mode()
    test_what_if_scenarios()
    test_emergency_status()
    test_query_commander()
    print("ALL 7 UNIT TESTS PASSED SUCCESSFULLY!")

