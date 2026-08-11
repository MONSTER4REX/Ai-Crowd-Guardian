"""FastAPI adapter for the explainable simulation."""
import asyncio
import json

from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from simulation import (
    emergency_status,
    load_layout,
    recommend_route,
    simulate_tick,
    what_if_scenarios,
)

app = FastAPI(title="AI Crowd Guardian", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "ai-crowd-guardian"}


@app.get("/api/layout")
def layout() -> dict:
    data = load_layout()
    return {
        "venue_id": data["venue_id"],
        "venue_name": data["venue_name"],
        "zones": data["zones"],
        "edges": data["edges"],
    }


@app.get("/api/simulation/tick")
def tick(tick_number: int = Query(default=0, ge=0), shock: str | None = None) -> dict:
    return simulate_tick(tick_number, shock)


@app.get("/api/routes/recommendation")
def route(zone_id: str = "port_hercule_promenade") -> dict:
    return recommend_route(zone_id)


@app.get("/api/what-if")
def what_if(tick_number: int = Query(default=0, ge=0)) -> dict:
    return what_if_scenarios(tick_number)


@app.get("/api/emergency")
def emergency(tick_number: int = Query(default=0, ge=0), shock: str | None = None) -> dict:
    return emergency_status(tick_number, shock)


@app.websocket("/ws/simulation")
async def simulation_socket(websocket: WebSocket) -> None:
    await websocket.accept()
    tick = 0
    shock: str | None = None
    running = True
    interval_sec = 2.0

    try:
        while True:
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=0.05)
                payload = json.loads(message)
                if payload.get("type") == "config":
                    shock = payload.get("shock")
                    running = payload.get("running", True)
                    interval_sec = float(payload.get("interval_sec", 2.0))
                    if payload.get("reset"):
                        tick = 0
                    continue
                if payload.get("type") == "tick":
                    tick = int(payload.get("tick", tick))
                    shock = payload.get("shock", shock)
            except asyncio.TimeoutError:
                pass

            if running:
                await websocket.send_json(simulate_tick(tick, shock))
                tick += 1

            await asyncio.sleep(interval_sec)
    except WebSocketDisconnect:
        return
