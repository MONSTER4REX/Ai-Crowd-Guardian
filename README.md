# AI Crowd Guardian

> **Predictive crowd-safety operations desk for venue operators** — built for the Monaco Grand Prix, powered by AI.

A real-time crowd management system that combines a live Digital Twin venue map, multi-factor risk scoring, Dijkstra-based safest-route recommendations, and an AI-driven bottleneck prediction engine — all surfaced through a dark-mode "Telemetry Noir" operations dashboard.

---

## ✨ Features

### Must-Have (Core PRD)
| # | Feature | Description |
|---|---------|-------------|
| 1 | **Live Digital Twin Map** | Schematic Monaco GP circuit with zone risk markers, pedestrian edge paths colour-coded by live risk (green → red), and Port Hercule harbour overlay |
| 2 | **Congestion Prediction** | Per-zone countdown timer to intervention threshold using a rolling density model |
| 3 | **Crowd Risk Score** | Multi-factor risk tier — Safe / Monitor / Intervention / Critical — with weighted factor breakdown |
| 4 | **Safest-Route Recommendation** | Dijkstra shortest-path on the live venue graph with crowd-exposure tradeoff display |
| 5 | **Bottleneck Explainability** | Top contributing factors (density, flow rate, gate capacity, dwell time) per zone with bar charts |
| 6 | **Decision Timeline** | Chronological live feed of flow events, predictions, route activations, and shock injections |
| 7 | **What-If Simulator** | Side-by-side comparison of Baseline vs Gate Closure vs Metro Arrival scenarios |
| 8 | **Shock Events** | One-click injection of VIP movement, metro surge, medical emergency, and stage-end stampede events |

### Could-Have (Extended PRD)
| Feature | Description |
|---------|-------------|
| **Telemetry Commander** | Operator command panel — broadcast PA messages, close gates, dispatch stewards, and log actions to the decision timeline |
| **Accessibility Routing** | Step-free route toggle that automatically reroutes via accessible corridors, with clear accessibility indicators per zone |

---

## 🏗️ Architecture

```
ai-crowd-guardian/
├── backend/                  # Python simulation & API layer
│   ├── simulation.py         # Core crowd model — zone density, risk scoring, Dijkstra routing
│   ├── api.py                # FastAPI app — REST + WebSocket endpoints
│   ├── app.py                # FastAPI adapter (legacy)
│   ├── dashboard.py          # Streamlit dashboard (standalone, no frontend required)
│   ├── venue_layout.json     # Monaco GP venue graph (zones, edges, capacities)
│   ├── requirements.txt
│   └── tests/
│       └── test_simulation.py
├── front page/               # React + Vite 3D cinematic landing page & Operations Desk (Starting Point)
│   ├── client/               # Storyboard frontend application
│   │   └── src/              # Pages (Home & Operations Desk Dashboard) and 3D scenes
│   ├── server/               # Express proxy server
│   ├── package.json
│   └── vite.config.ts
├── frontend/                 # Direct React + Vite Operations Desk dashboard (standalone alternative)
│   ├── src/
│   │   ├── main.jsx          # Direct dashboard layout
│   │   └── index.css         # Telemetry Noir design system
│   ├── package.json
│   └── vite.config.ts
├── AI_Crowd_Guardian_PRD.md  # Full Product Requirements Document
├── ideas.md                  # Design direction — Telemetry Noir brief
├── run.bat                   # Windows one-click launcher (backend + front page)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**

### 1 — Clone & set up backend

```bash
git clone https://github.com/MONSTER4REX/Ai-Crowd-Guardian.git
cd Ai-Crowd-Guardian/backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate
# Activate (macOS / Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

### 2 — Start the React Front Page (Landing Page & Dashboard)

```bash
# In a new terminal, from the project root
cd "front page"
npm install
npm run dev
```
Open **http://localhost:3000** in your browser. This boots up the 3D cinematic interactive story. Scroll through the chapters and click **"Enter Operations Desk"** at Chapter 06 to access the full Operations Desk dashboard.

*(Alternative: If you want to launch directly into the Operations Desk dashboard without the landing page, run `npm run dev` in the `frontend/` directory instead.)*

### 3 — Hugging Face Integration Setup
To comply with the rule of utilizing Hugging Face Hub tools, this project integrates a zero-shot classification model (`facebook/bart-large-mnli`) to process and classify operator telemetry commands inside the AI Commander.

1. Obtain a free Hugging Face API token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
2. Create a `.env` file in the `backend/` directory:
   ```bash
   HF_TOKEN=your_hugging_face_token_here
   ```
This token will be automatically picked up by the FastAPI backend to authenticate requests to the Hugging Face Inference API.

### Windows one-click (alternative)
Double-click `run.bat` from the project root — it automatically sets up environment dependencies, starts the backend, and fires up the main front page.

### Streamlit dashboard (standalone alternative)
If you prefer a no-Node.js setup, run the Streamlit dashboard instead:
```bash
cd backend
streamlit run dashboard.py
```
Open **http://localhost:8501**.

---
## 🔌 REST API Reference

The FastAPI backend exposes the following endpoints (base URL: `http://localhost:8000`):

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/layout` | Full venue graph — all zones and edges |
| `GET` | `/api/simulation/tick` | Single simulation tick (`?tick_number=0&shock=metro_arrival`) |
| `GET` | `/api/routes/recommendation` | Safest route from a zone (`?zone_id=port_hercule_promenade`) |
| `GET` | `/api/routes/accessible` | Step-free accessible route (`?zone_id=...&step_free=true`) |
| `GET` | `/api/what-if` | What-if scenario comparison (`?tick_number=0`) |
| `WS` | `/ws/simulation` | Live WebSocket tick stream (1-second cadence) |

**Example — get safest route:**
```bash
curl "http://localhost:8000/api/routes/recommendation?zone_id=casino_square"
```

**Example — inject a shock event:**
```bash
curl "http://localhost:8000/api/simulation/tick?tick_number=5&shock=stage_end_stampede"
```

---

## 🗺️ Venue Layout

The demo venue is the **Circuit de Monaco** — the Monaco Formula 1 Grand Prix street circuit. The venue graph (`backend/venue_layout.json`) models:

- **12 zones** — grandstands, gates, fan zones, promenades, and egress points
- **17 edges** — pedestrian corridors with capacity, step-free flags, and base traversal time
- Zones positioned to match the real Monaco GP circuit geography (Sainte Devôte → Casino → Loews hairpin → Portier → Tunnel → Swimming Pool → La Rascasse → Fontvieille)

> ⚠️ The venue layout is a demonstration model built from publicly available spectator guides — not an official circuit document.

---

## 🧪 Tests

```bash
cd backend
python -m pytest tests/ -v
```

Tests cover the core simulation engine: zone loading, risk scoring, Dijkstra routing, and shock event propagation.

---

## 🎨 Design System — Telemetry Noir

The UI follows the **Telemetry Noir** design language:

- **Dark control-room aesthetic** — `#0d1117` base, `#161b22` panels, deep charcoal accents
- **Risk colour vocabulary** — green `#00c853` / yellow `#ffd600` / orange `#ff6d00` / red `#e4002b`
- **Typography** — JetBrains Mono for data readouts, Inter for copy
- **Micro-animations** — pulsing risk badges, glowing critical edges, scrolling ticker tape
- **Action-first operator copy** — status lines written for split-second decision making

---

## 👥 Team & Contributions

This project was built collaboratively:

- **Core simulation engine, API, and PRD features** — primary branch (`main`)
- **Could-Have features** (Telemetry Commander, Accessibility Routing) — merged from `Could-Have-Updations`
- **Monaco circuit map & UI refinements** — merged from `map`

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details (if applicable).

---
