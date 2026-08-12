"""FastAPI adapter for the explainable simulation."""
from fastapi import FastAPI, Query
from simulation import recommend_route, simulate_tick

app = FastAPI(title="AI Crowd Guardian", version="0.1.0")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "ai-crowd-guardian"}


@app.get("/api/simulation/tick")
def tick(tick_number: int = Query(default=0, ge=0), shock: str | None = None) -> dict:
    return simulate_tick(tick_number, shock)


@app.get("/api/routes/recommendation")
def route(zone_id: str = "port_hercule_promenade") -> dict:
    return recommend_route(zone_id)
