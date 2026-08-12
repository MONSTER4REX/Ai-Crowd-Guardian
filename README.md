# AI Crowd Guardian

Predictive crowd-safety operations desk for venue operators. Built entirely in **Python** for straightforward setup and extension.

## Features (first eight PRD items)

1. **Live Digital Twin** — schematic venue map with zone risk markers
2. **Congestion Prediction** — countdown to intervention threshold per zone
3. **Crowd Risk Score** — multi-factor risk tier (safe → critical)
4. **Safest-Route Recommendation** — alternate path with exposure tradeoff
5. **Bottleneck Explainability** — weighted top factors per zone
6. **Decision Timeline** — live feed of flow, prediction, and route events
7. **What-If Simulator** — baseline vs gate closure vs metro arrival
8. **Shock Events** — inject scenarios into the live simulation

## Quick start

```bash
# From project root
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
streamlit run dashboard.py
```

Or double-click `run.bat` on Windows (creates the venv automatically).

Open **http://localhost:8501** in your browser.

## Optional REST API

The same simulation engine is exposed via FastAPI:

```bash
cd backend
uvicorn app:app --reload --port 8000
```

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Service health check |
| `GET /api/layout` | Venue zones and edges |
| `GET /api/simulation/tick?tick_number=0&shock=metro_arrival` | Single simulation tick |
| `GET /api/routes/recommendation?zone_id=port_hercule_promenade` | Safest route |
| `GET /api/what-if?tick_number=0` | What-if scenario comparison |
| `WS /ws/simulation` | Live tick stream |

## Project layout

```
backend/
  simulation.py      # Core crowd model (authoritative logic)
  dashboard.py       # Streamlit UI — main entry point
  app.py             # FastAPI adapter (optional)
  venue_layout.json  # Monaco GP demo venue graph
  requirements.txt
ideas.md             # Design direction (Telemetry Noir)
```

## Design

**Telemetry Noir** — dark control-room aesthetic, multi-factor risk with explanations, and action-first operator copy. See `ideas.md` for the full design brief.
