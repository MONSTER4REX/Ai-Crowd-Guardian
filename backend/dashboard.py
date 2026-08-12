"""AI Crowd Guardian — Streamlit operations dashboard (Python)."""
from __future__ import annotations

import time
from datetime import UTC, datetime

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from simulation import (
    emergency_status,
    load_layout,
    recommend_route,
    simulate_tick,
    what_if_scenarios,
)

RISK_COLORS = {
    "safe": "#2ecc71",
    "monitor": "#f5c518",
    "intervention": "#ff8c42",
    "critical": "#ff3b30",
}
GUARDIAN_RED = "#E4002B"
TICK_SECONDS = 2

TOUR_STEPS = [
    {
        "title": "Digital Twin Map",
        "copy": "This is your live venue view — each zone updates as crowd conditions change.",
    },
    {
        "title": "Risk Tier Legend",
        "copy": "Color here means risk, not just crowd size. A busy area can be safer than a smaller blocked one.",
    },
    {
        "title": "Prediction Alert Banner",
        "copy": "When trouble is coming, you'll see it here with a countdown before it happens.",
    },
    {
        "title": "Zone / Bottleneck Marker",
        "copy": "Click any zone to see exactly why it's at risk.",
    },
    {
        "title": "Decision Timeline Panel",
        "copy": "Every recommendation the system makes is logged here, in order.",
    },
    {
        "title": "What-If / Emergency Controls",
        "copy": "Test a scenario or trigger Emergency Mode from here.",
    },
]

st.set_page_config(
    page_title="AI Crowd Guardian",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Titillium+Web:wght@600;700&display=swap');
html, body, [class*="css"] { font-family: 'IBM Plex Sans', sans-serif; }
h1, h2, h3 { font-family: 'Titillium Web', sans-serif; letter-spacing: 0.02em; }
.block-container { padding-top: 1.2rem; max-width: 1500px; }
div[data-testid="stMetric"] {
  background: #16161b; border: 1px solid #2a2a32; padding: 0.6rem 0.9rem;
}
div[data-testid="stMetric"] label { color: #92929d; font-size: 0.72rem; letter-spacing: 0.08em; }
div[data-testid="stMetric"] [data-testid="stMetricValue"] {
  font-family: 'Titillium Web', sans-serif; font-size: 1.45rem;
}
.stAlert { border-left: 3px solid #E4002B; }
.tour-card {
  background: #16161b; border: 2px solid #E4002B; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;
}
.emergency-panel {
  background: #250e12; border: 2px solid #FF3B30; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;
}
</style>
""",
    unsafe_allow_html=True,
)


def _init_state() -> None:
    defaults = {
        "tick": 0,
        "running": True,
        "shock": None,
        "selected_zone_id": "port_hercule_promenade",
        "timeline": [],
        "last_highest_risk": None,
        "last_shock": None,
        "emergency_mode": False,
        "tour_step": 0,
        "tour_seen": False,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def _format_countdown(total_sec: int) -> str:
    minutes, seconds = divmod(total_sec, 60)
    return f"{minutes:02d}:{seconds:02d}"


def _risk_label(tier: str) -> str:
    return tier.replace("_", " ").title()


def _append_timeline(snapshot: dict, route: dict) -> None:
    highest = max(snapshot["zone_states"], key=lambda z: z["risk_score"])
    now = datetime.now(UTC).strftime("%H:%M:%S")
    events: list[dict] = []

    if st.session_state.last_shock != snapshot["shock"]:
        shock_label = snapshot["shock"] or "baseline"
        events.append(
            {
                "time": now,
                "kind": "shock",
                "title": f"Scenario: {shock_label.replace('_', ' ').title()}",
                "body": "Simulation shock preset applied to crowd model.",
            }
        )
        st.session_state.last_shock = snapshot["shock"]

    if st.session_state.last_highest_risk != highest["zone_id"]:
        events.append(
            {
                "time": now,
                "kind": "prediction",
                "title": f"Highest risk: {highest['zone_name'].split(' - ')[0]}",
                "body": (
                    f"Risk score {highest['risk_score']} — "
                    f"congestion in {_format_countdown(highest['predicted_congestion_in_sec'])}."
                ),
            }
        )
        st.session_state.last_highest_risk = highest["zone_id"]

    if snapshot["tick"] % 5 == 0:
        events.append(
            {
                "time": now,
                "kind": "flow",
                "title": f"Aggregate flow {snapshot['aggregate_flow_per_min']:,}/min",
                "body": f"{snapshot['zones_at_risk']} zones above intervention threshold.",
            }
        )

    if snapshot["tick"] % 7 == 0:
        events.append(
            {
                "time": now,
                "kind": "route",
                "title": "Safest route refreshed",
                "body": route["recommended"],
            }
        )

    for event in events:
        st.session_state.timeline.insert(0, event)
    st.session_state.timeline = st.session_state.timeline[:12]


def _build_twin_figure(snapshot: dict, selected_zone_id: str, route: dict) -> go.Figure:
    layout = load_layout()
    zone_lookup = {zone["id"]: zone for zone in layout["zones"]}
    states = snapshot["zone_states"]

    fig = go.Figure()

    for edge in layout["edges"]:
        from_zone = zone_lookup[edge["from"]]
        to_zone = zone_lookup[edge["to"]]
        path_ids = set(route.get("recommended_path", []))
        is_hot = {edge["from"], edge["to"]}.issubset(path_ids) and len(path_ids) > 1
        fig.add_trace(
            go.Scatter(
                x=[from_zone["map_x"], to_zone["map_x"]],
                y=[from_zone["map_y"], to_zone["map_y"]],
                mode="lines",
                line=dict(
                    color=GUARDIAN_RED if is_hot else "#4a4a55",
                    width=3 if is_hot else 1,
                    dash="dash" if is_hot else "dot",
                ),
                hoverinfo="skip",
                showlegend=False,
            )
        )

    xs, ys, sizes, colors, texts, ids = [], [], [], [], [], []
    for state in states:
        xs.append(state["map_x"])
        ys.append(state["map_y"])
        sizes.append(12 + state["risk_score"] * 0.35)
        colors.append(RISK_COLORS.get(state["risk_tier"], "#92929d"))
        short_name = state["zone_name"].split(" - ")[0]
        texts.append(
            f"<b>{short_name}</b><br>"
            f"Risk: {state['risk_score']} ({_risk_label(state['risk_tier'])})<br>"
            f"Density: {state['density_per_sqm']} /m²<br>"
            f"Congestion in: {_format_countdown(state['predicted_congestion_in_sec'])}"
        )
        ids.append(state["zone_id"])

    fig.add_trace(
        go.Scatter(
            x=xs,
            y=ys,
            mode="markers+text",
            marker=dict(size=sizes, color=colors, line=dict(width=2, color="#0a0a0d")),
            text=[state["risk_score"] for state in states],
            textposition="middle center",
            textfont=dict(size=9, color="#0a0a0d"),
            hovertext=texts,
            hoverinfo="text",
            customdata=ids,
            showlegend=False,
        )
    )

    selected = next((s for s in states if s["zone_id"] == selected_zone_id), states[0])
    fig.add_trace(
        go.Scatter(
            x=[selected["map_x"]],
            y=[selected["map_y"]],
            mode="markers",
            marker=dict(size=28, color="rgba(228,0,43,0.15)", line=dict(width=2, color=GUARDIAN_RED)),
            hoverinfo="skip",
            showlegend=False,
        )
    )

    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="#101015",
        plot_bgcolor="#101015",
        height=470,
        margin=dict(l=10, r=10, t=30, b=10),
        title=dict(text="Live Digital Twin — Circuit de Monaco", font=dict(size=14), x=0.01),
        xaxis=dict(showgrid=False, zeroline=False, visible=False, range=[0, 100]),
        yaxis=dict(showgrid=False, zeroline=False, visible=False, range=[0, 100], scaleanchor="x"),
        hovermode="closest",
    )
    return fig


def main() -> None:
    _init_state()

    col_title, col_controls = st.columns([2.5, 2.5])
    with col_title:
        st.title("AI Crowd Guardian")
        st.caption("Predictive crowd-safety desk — Monaco Grand Prix venue")

    with col_controls:
        ctrl1, ctrl2, ctrl3, ctrl4, ctrl5 = st.columns([1, 1, 1.2, 1, 1])
        with ctrl1:
            running = st.toggle("Live", value=st.session_state.running)
            st.session_state.running = running
        with ctrl2:
            if st.button("Reset"):
                st.session_state.tick = 0
                st.session_state.timeline = []
                st.session_state.last_highest_risk = None
                st.rerun()
        with ctrl3:
            shock_choice = st.selectbox(
                "Shock event",
                options=["baseline", "gate_8_closure", "metro_arrival"],
                index=["baseline", "gate_8_closure", "metro_arrival"].index(
                    st.session_state.shock or "baseline"
                ),
                label_visibility="collapsed",
            )
            st.session_state.shock = None if shock_choice == "baseline" else shock_choice
        with ctrl4:
            em_active = st.session_state.emergency_mode
            if st.button("🚨 Emergency", type="primary" if em_active else "secondary"):
                st.session_state.emergency_mode = not em_active
                st.rerun()
        with ctrl5:
            if st.button("❓ Help"):
                st.session_state.tour_step = 1
                st.rerun()

    # Onboarding Tour step render (PRD Section 7)
    if st.session_state.tour_step > 0:
        step_idx = st.session_state.tour_step - 1
        step_info = TOUR_STEPS[step_idx]
        st.markdown(
            f"""
<div class="tour-card">
  <div style="font-weight:700; color:#E4002B; font-size:1.1rem">
    Onboarding Tour — Step {st.session_state.tour_step} of {len(TOUR_STEPS)}: {step_info['title']}
  </div>
  <div style="color:#F5F5F7; margin-top:0.4rem; font-size:0.95rem">
    {step_info['copy']}
  </div>
</div>
""",
            unsafe_allow_html=True,
        )
        tc1, tc2, tc3, _ = st.columns([1, 1, 1, 5])
        with tc1:
            if st.button("Previous", disabled=(st.session_state.tour_step == 1)):
                st.session_state.tour_step -= 1
                st.rerun()
        with tc2:
            next_label = "Finish" if st.session_state.tour_step == len(TOUR_STEPS) else "Next"
            if st.button(next_label):
                if st.session_state.tour_step == len(TOUR_STEPS):
                    st.session_state.tour_step = 0
                    st.session_state.tour_seen = True
                else:
                    st.session_state.tour_step += 1
                st.rerun()
        with tc3:
            if st.button("Skip Tour"):
                st.session_state.tour_step = 0
                st.session_state.tour_seen = True
                st.rerun()

    tick = st.session_state.tick
    shock = st.session_state.shock
    snapshot = simulate_tick(tick, shock)
    route = recommend_route(st.session_state.selected_zone_id)
    scenarios = what_if_scenarios(tick)
    _append_timeline(snapshot, route)

    highest = max(snapshot["zone_states"], key=lambda z: z["risk_score"])

    # Emergency Mode Panel (PRD Section 6.8 & 8.5)
    if st.session_state.emergency_mode:
        em_data = emergency_status(tick, shock)
        st.markdown(
            f"""
<div class="emergency-panel">
  <div style="font-weight:700; color:#FF3B30; font-size:1.1rem; display:flex; align-items:center; gap:0.5rem">
    🚨 EMERGENCY EVACUATION MODE ACTIVE
  </div>
  <div style="color:#F5F5F7; margin-top:0.4rem; font-size:1rem; font-weight:600">
    Recommendation: {em_data['recommendation']}
  </div>
</div>
""",
            unsafe_allow_html=True,
        )
        em_cols = pd.DataFrame(
            [
                {
                    "Exit / Egress Point": e["name"],
                    "Capacity/min": f"{e['capacity_per_min']:,}",
                    "Throughput/min": f"{e['current_throughput']:,}",
                    "Capacity Utilization": f"{int(e['utilization'] * 100)}%",
                    "Risk Tier": _risk_label(e["risk_tier"]),
                }
                for e in em_data["exits"]
            ]
        )
        st.dataframe(em_cols, hide_index=True, use_container_width=True)

    m1, m2, m3, m4, m5 = st.columns(5)
    m1.metric("Simulated crowd", f"{snapshot['simulated_crowd']:,}")
    m2.metric("Zones at risk", snapshot["zones_at_risk"])
    m3.metric("Model confidence", f"{snapshot['model_confidence']:.1%}")
    m4.metric("Tick", snapshot["tick"])
    m5.metric("Timestamp", snapshot["timestamp"][11:19])

    if highest["risk_tier"] in {"intervention", "critical"}:
        st.error(
            f"**{highest['zone_name'].split(' - ')[0]}** will cross intervention threshold in "
            f"**{_format_countdown(highest['predicted_congestion_in_sec'])}** "
            f"(risk score **{highest['risk_score']}**)."
        )

    left, center, right = st.columns([1.1, 2.4, 1.2])

    with left:
        st.subheader("Command rail")
        st.markdown(
            f"**Highest pressure:** {highest['zone_name'].split(' - ')[0]}  \n"
            f"**Risk tier:** {_risk_label(highest['risk_tier'])}  \n"
            f"**Flow:** {snapshot['aggregate_flow_per_min']:,}/min"
        )
        st.markdown("##### Risk legend")
        for tier, color in RISK_COLORS.items():
            st.markdown(
                f"<span style='color:{color}'>●</span> {_risk_label(tier)}",
                unsafe_allow_html=True,
            )

    with center:
        fig = _build_twin_figure(snapshot, st.session_state.selected_zone_id, route)
        st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

        zone_names = {
            z["zone_id"]: z["zone_name"].split(" - ")[0] for z in snapshot["zone_states"]
        }
        picked = st.selectbox(
            "Inspect zone",
            options=list(zone_names.keys()),
            format_func=lambda zid: zone_names[zid],
            index=list(zone_names.keys()).index(st.session_state.selected_zone_id),
        )
        st.session_state.selected_zone_id = picked

    with right:
        st.subheader("Decision timeline")
        for event in st.session_state.timeline[:8]:
            st.markdown(
                f"**{event['time']}** — {event['title']}  \n"
                f"<span style='color:#85858f;font-size:0.85rem'>{event['body']}</span>",
                unsafe_allow_html=True,
            )
        if not st.session_state.timeline:
            st.caption("Timeline fills as the simulation runs.")

        st.markdown("---")
        st.markdown(f"##### Model confidence: **{snapshot['model_confidence']:.1%}**")

    st.markdown("---")
    lower_left, lower_right = st.columns([1.3, 1])

    with lower_left:
        st.subheader("What-if simulator")
        scenario_rows = []
        for scenario in scenarios["scenarios"]:
            scenario_rows.append(
                {
                    "Scenario": scenario["label"] + (" ★" if scenario["recommended"] else ""),
                    "Detail": scenario["detail"],
                    "Time to congestion": f"{scenario['time_to_congestion_min']} min",
                    "Peak risk": scenario["peak_risk_score"],
                    "Peak zone": scenario["peak_zone_name"].split(" - ")[0],
                }
            )
        st.dataframe(pd.DataFrame(scenario_rows), hide_index=True, use_container_width=True)

        preset_cols = st.columns(3)
        presets = [
            ("baseline", "Baseline"),
            ("gate_8_closure", "Gate 8 closure"),
            ("metro_arrival", "Metro arrival"),
        ]
        for col, (preset_id, label) in zip(preset_cols, presets, strict=True):
            active = (st.session_state.shock or "baseline") == preset_id
            if col.button(label, type="primary" if active else "secondary", use_container_width=True):
                st.session_state.shock = None if preset_id == "baseline" else preset_id
                st.rerun()

    with lower_right:
        selected = next(
            z for z in snapshot["zone_states"] if z["zone_id"] == st.session_state.selected_zone_id
        )
        st.subheader("Bottleneck explainability")
        tier_color = RISK_COLORS.get(selected["risk_tier"], "#92929d")
        st.markdown(
            f"##### {selected['zone_name'].split(' - ')[0]}  \n"
            f"<span style='color:{tier_color};font-weight:600'>"
            f"Risk {selected['risk_score']} — {_risk_label(selected['risk_tier'])}</span>",
            unsafe_allow_html=True,
        )

        for factor in selected["top_factors"]:
            pct = int(factor["weight"] * 100)
            st.progress(factor["weight"], text=f"{factor['cause']} ({pct}%)")

        st.markdown("---")
        st.subheader("Safest-route recommendation")
        st.markdown(f"**{route['recommended']}**")
        st.caption(route["reason"])
        c1, c2 = st.columns(2)
        c1.metric("Tradeoff", route["tradeoff"])
        c2.metric("Exposure", route["exposure_reduction"])

    st.markdown("---")
    st.subheader("Zone risk table")
    table = pd.DataFrame(
        [
            {
                "Zone": z["zone_name"].split(" - ")[0],
                "Risk": z["risk_score"],
                "Tier": _risk_label(z["risk_tier"]),
                "Density (/m²)": z["density_per_sqm"],
                "Flow/min": z["flow_rate"],
                "Congestion in": _format_countdown(z["predicted_congestion_in_sec"]),
                "Top factor": z["top_factors"][0]["cause"] if z["top_factors"] else "—",
            }
        for z in sorted(snapshot["zone_states"], key=lambda item: -item["risk_score"])
        ]
    )
    st.dataframe(table, hide_index=True, use_container_width=True)

    if st.session_state.running:
        time.sleep(TICK_SECONDS)
        st.session_state.tick += 1
        st.rerun()


if __name__ == "__main__":
    main()

