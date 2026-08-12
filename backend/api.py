"""FastAPI backend for AI Crowd Guardian — exposes simulation state via REST."""
from __future__ import annotations

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from simulation import (
    emergency_status,
    query_commander,
    recommend_route,
    simulate_tick,
    what_if_scenarios,
)

app = FastAPI(title="AI Crowd Guardian API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/tick")
def tick(
    tick: int = Query(default=0, ge=0),
    shock: str | None = Query(default=None),
):
    return simulate_tick(tick, shock)


@app.get("/api/route")
def route(
    zone_id: str = Query(default="port_hercule_promenade"),
    accessible_only: bool = Query(default=False),
):
    return recommend_route(zone_id, accessible_only)


@app.get("/api/whatif")
def whatif(tick: int = Query(default=0, ge=0)):
    return what_if_scenarios(tick)


@app.get("/api/emergency")
def emergency(
    tick: int = Query(default=0, ge=0),
    shock: str | None = Query(default=None),
):
    return emergency_status(tick, shock)


@app.post("/api/commander")
def commander(body: dict):
    return query_commander(
        body.get("prompt", ""),
        body.get("tick", 0),
        body.get("shock"),
    )


@app.get("/health")
def health():
    return {"status": "ok"}
