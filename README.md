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

## Frontend (React + Vite)

The demo frontend is a lightweight React app (Vite) that connects to the FastAPI backend on `http://localhost:8000` by default.

Start the frontend from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` to view the Monaco demo.

## Running tests

The backend includes a small pytest suite. From the project root:

```powershell
cd backend
# activate the venv created during setup (Windows)
.venv\Scripts\activate
python -m pytest -q
```

This runs the unit tests in `backend/tests` (7 tests in the demo workspace).

## New/Experimental Features (added)

- **Persona Visuals (client-side only):** a toggle in the left rail shows small persona badges on zone markers for visual variety. These are illustrative only and do not change simulation behavior.
- **Persona distribution counts:** quick counts of persona assignments appear under the persona toggle.
- **Telemetry Commander quick prompts:** three clickable prompt chips (Highest risk / Why Port Hercule? / Safest route) in the Commander panel for fast queries.

These changes are visual enhancements implemented in `frontend/src/main.jsx` and styles in `frontend/src/index.css`.

## Running a quick smoke test (automated)

From the project root you can verify both servers are running by visiting the frontend and using the backend endpoints:

```powershell
# Backend
cd backend
.venv\\Scripts\\activate
uvicorn api:app --reload --port 8000

# Frontend (new shell)
cd frontend
npm run dev

# Smoke-check endpoints (PowerShell)
Invoke-WebRequest -Uri http://127.0.0.1:8000/api/health -UseBasicParsing
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/simulation/tick?tick=2" -UseBasicParsing | Select-Object -Expand Content
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/what-if?tick=2" -UseBasicParsing | Select-Object -Expand Content
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/routes/recommendation?zone_id=port_hercule_promenade&accessible_only=true" -UseBasicParsing | Select-Object -Expand Content
Invoke-WebRequest -Uri http://127.0.0.1:8000/api/commander -Method POST -Body (ConvertTo-Json @{ prompt = 'highest risk area?'; tick = 2 }) -ContentType 'application/json' -UseBasicParsing | Select-Object -Expand Content
```

---

If you'd like, I can now add a short section documenting the code changes (diffs) and a suggested demo script. Do you want that included next?

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
