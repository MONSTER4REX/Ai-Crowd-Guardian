# Product Requirements Document

## AI Crowd Guardian
### A Predictive Crowd Safety & Rerouting System
Built for GrandPrix Hackathon — Problem Statement 3: Crowd Flow Optimiser

---

## 1. Summary

The brief asks for a system that simulates how crowds move through a venue, spots bottlenecks before they become dangerous, and suggests rerouting in real time. The brainstorm document you shared ("AI Crowd Guardian") already captures the right instinct — predict, don't just monitor — and lists twelve strong feature ideas plus a risk-scoring concept.

The gap is scope. Twelve fully-built features, a multi-persona behaviour model, a free-form what-if engine, and a natural-language commander is a multi-week product, not a hackathon build. This PRD keeps every idea (nothing is thrown away) but sorts it into what ships in the demo versus what you describe as roadmap. It also turns the visual language (emoji circles, colored gate labels) into a real design system that matches the GrandPrix branding, and adds the onboarding tour you asked for as a first-class requirement.

---

## 2. Problem Statement (as given)

Large venues — stadiums, railway stations, festivals — see people bunch up at gates, food counters, or exits without warning, and there is currently no easy way to spot these pile-ups before they turn into a safety risk.

**Input:** venue layout (gates, walkways, concession points, emergency exits), expected crowd size, event schedule.
**Output:** a map showing bottleneck zones and recommended rerouting paths, updated as conditions change.
**Frontend:** venue layout screen with crowded zones highlighted and alternate routes marked.
**Backend:** where the simulation runs and bottleneck/rerouting logic is calculated.

This matters because it fixes the scope question up front: inputs are a layout, a crowd size, and a schedule — not live camera feeds or sensor hardware. Anything built should stay demo-able from those three inputs alone.

---

## 3. Product Vision

Don't tell the operator "this area is crowded." Tell them "this area will be dangerously crowded in 6 minutes, and here's what to do about it."

Three shifts define the product:
- **Reactive → Predictive** — surface problems before they happen, with a time estimate.
- **Density → Risk** — a packed-but-flowing plaza can be safe; a smaller area with one narrow exit can be dangerous. Risk is density plus flow, exit capacity, and bottleneck probability, not density alone.
- **Monitoring → Decision support** — every alert comes with a recommended action, not just a status.

---

## 4. Primary User

**Venue Safety Operator** — sits in a control room or ops tent during the event, watches one or more screens, and has minutes (not hours) to act on an alert. They are not a data scientist; every number on screen needs to be immediately actionable. This is the only persona the MVP is designed for. An attendee-facing mobile app is explicitly out of scope (see Section 9).

---

## 5. Scope: What Ships vs. What's Roadmap

Everything below traces back to a feature in your original brainstorm. Nothing is cut — it's prioritized.

### Must Have (core demo — build these first)

| # | Feature | Source | Why it's core |
|---|---|---|---|
| 1 | Live Digital Twin | Feature 1 | Without a visual venue, nothing else has anywhere to show up |
| 2 | Congestion Prediction (time-to-threshold) | Feature 2 | This is the headline differentiator from the problem statement |
| 3 | Crowd Risk Score (multi-factor) | "the really interesting feature" | Directly answers the brief's safety framing, not just density |
| 4 | Safest-Route Recommendation | Feature 4 | The problem statement explicitly asks for rerouting suggestions |
| 5 | Bottleneck Explainability | Features 5 + 11 (merged) | Cheap to build, very high demo impact — "click to see why" |
| 6 | Decision Timeline | Feature 12 | Just a log of events already happening — low cost, high polish |

### Should Have (add once the six above work end-to-end)

| # | Feature | Source | Note |
|---|---|---|---|
| 7 | What-If Simulator | Feature 3 | Ship as 2–3 preset scenarios rather than fully free-form controls — far less to build, same demo payoff |
| 8 | Shock Events | Feature 6 | Fold into the What-If panel as an "inject event" button rather than a separate system |
| 9 | Emergency Mode | Feature 9 | Simplify to one exit-rebalancing view rather than the full evacuation-time model |
| — | First-time onboarding tour | (your requirement) | Not a "feature" of the product, but mandatory for the deliverable — see Section 7 |

### Could Have (only if the Must + Should list is done early)

| # | Feature | Source | Note |
|---|---|---|---|
| 10 | Accessibility-Aware Routing | Feature 8 | Strong differentiator for a "public safety" brief, but needs real constraint data to look credible |
| 11 | Crowd persona visuals | Feature 7 | Ship as visual variety only (different marker colors/shapes on the twin) — skip independent behaviour logic per persona, it's not verifiable in a live demo anyway |
| 12 | Natural-Language Commander | Feature 10 | High wow factor, real risk of the LLM inventing numbers under demo pressure — only add once the underlying data is solid, and constrain it to paraphrasing pre-computed values, never generating its own |

### Won't Have (this hackathon)

- Full independent multi-agent behaviour simulation (social-force modelling) — visually convincing shortcuts exist; a physics-accurate crowd model does not fit the timeline.
- Live camera or sensor-based crowd counting — the brief's stated inputs are layout, expected size, and schedule, not video feeds.
- Attendee-facing mobile app.
- Multi-venue / multi-tenant account system.

---

## 6. Feature Details (Must + Should)

### 6.1 Live Digital Twin
A schematic (not photorealistic) top-down view of the venue: gates, corridors, concessions, field/stands, exits. Each zone is shaded by its current risk tier (see 6.3). Density is represented by marker clustering or heatmap intensity inside each zone, driven by the simulation tick, not real video.

### 6.2 Congestion Prediction
For each zone, the simulation projects forward and flags when a zone is expected to cross its risk threshold. Displayed as: zone name, predicted time-to-threshold (e.g. "6 min"), and projected density at that point. This is the single most important number on the screen — it should be the largest, highest-contrast element in any alert.

### 6.3 Crowd Risk Score
Replaces raw density as the primary signal. Composite 0–100 score per zone, built from:

- Crowd density
- Flow conflict (opposing movement directions in the same corridor)
- Exit capacity vs. current throughput
- Bottleneck probability
- Accessibility constraint penalty (if Feature 10 is in scope)

Illustrative weighting for the hackathon build (tune against your demo dataset):

```
risk_score = 0.35 * density_norm
           + 0.20 * flow_conflict_norm
           + 0.20 * exit_capacity_deficit_norm
           + 0.15 * bottleneck_probability
           + 0.10 * accessibility_penalty
```

Tiers:

| Score | Tier | Meaning |
|---|---|---|
| 0–30 | Safe | No action needed |
| 31–60 | Monitor | Watch, no action yet |
| 61–80 | Intervention | Recommend action now |
| 81–100 | Critical | Immediate action required |

### 6.4 Safest-Route Recommendation
When a zone crosses into Intervention or Critical, the system compares the shortest path out against alternate paths and recommends the one that minimizes crowd exposure, not distance. Show the trade-off explicitly, e.g. "+18 sec walking time, −63% crowd exposure" — this comparison is more convincing to judges than the route alone.

### 6.5 Bottleneck Explainability
Clicking any at-risk zone opens a breakdown panel showing the contributing factors as a ranked, weighted list (e.g. crowd exiting stadium 42%, metro arrival 31%, food concession 17%, narrow corridor 10%), plus a confidence percentage for the prediction. This is what turns "the AI says so" into something an operator can trust and act on.

### 6.6 Decision Timeline
A chronological, timestamped feed of everything the system has noticed and recommended — density rising, prediction issued, route optimized, recommendation accepted/dismissed, risk reduced. Purely a log of events your other features already generate; no new logic required, just a UI panel.

### 6.7 What-If Simulator (Should Have)
Operator picks from a small set of adjustable inputs (crowd size, a gate open/closed toggle, weather, an injected shock event) and runs 2–3 pre-modelled scenarios side by side, each showing projected time-to-congestion. The system highlights the recommended scenario. Keep the input set small and the scenarios pre-computed rather than fully generative — reliability matters more than flexibility in a live demo.

### 6.8 Emergency Mode (Should Have)
One control that switches the dashboard into an evacuation view: each exit shown with capacity vs. current throughput, and a single rebalancing recommendation (e.g. "redirect 23% of Exit B traffic to Exit C"). Keep this to one clear recommendation, not a full evacuation-time model.

---

## 7. Onboarding Tour — Requirements

This applies to the whole interface, not any one feature, and is a hard requirement for the deliverable.

**Behaviour**

- Triggers automatically on a user's first visit only. Store completion/skip state (e.g. `localStorage`) so it never auto-shows again after being seen or skipped.
- A manual "Help" control (icon in the top nav) lets a user replay the tour at any time, resetting it from step one.
- Each step dims the rest of the interface and places a highlight ring around one real UI element — never a fake screenshot or mock element.
- Each step shows a short (one to two sentence) tooltip anchored next to the highlighted element, a step counter (e.g. "3 of 6"), Previous and Next controls, and a Skip Tour control. Previous is disabled on step one; Next becomes "Finish" on the last step.
- **Skip must be instant and total.** The moment Skip is pressed, the overlay, highlight ring, tooltip, step counter, and Previous/Next/Skip controls all unmount immediately — no lingering cursor, no residual highlight, no fade-out state left on screen.
- Tour copy stays plain and short. No filler, no more than two sentences per step.

**Suggested step sequence (maps to the Must Have screen elements):**

| Step | Highlighted element | Copy |
|---|---|---|
| 1 | Digital Twin map | This is your live venue view — each zone updates as crowd conditions change. |
| 2 | Risk tier legend | Color here means risk, not just crowd size. A busy area can be safer than a smaller blocked one. |
| 3 | Prediction alert banner | When trouble is coming, you'll see it here with a countdown before it happens. |
| 4 | A zone / bottleneck marker | Click any zone to see exactly why it's at risk. |
| 5 | Decision Timeline panel | Every recommendation the system makes is logged here, in order. |
| 6 | What-If / Emergency controls | Test a scenario or trigger Emergency Mode from here. |

---

## 8. Design System

### 8.1 Principles
Clean and control-room-legible over decorative. No emoji anywhere in the shipped UI — status is communicated with icon + color + text label together, never color alone (this is also an accessibility requirement, see 10). No italicized numerals or body text; use weight (medium/semibold) for emphasis instead.

### 8.2 Color Palette
Derived from the GrandPrix event branding (dark ground, racing red, white, high-contrast telemetry feel), adapted for a control-room dashboard rather than a marketing page.

| Token | Hex | Usage |
|---|---|---|
| Background | `#0A0A0D` | App background, map canvas base |
| Surface | `#16161B` | Panels, cards, sidebar, modals |
| Border | `#2A2A32` | Panel borders, dividers |
| Brand Red | `#E4002B` | Primary buttons, active nav state, key CTAs — chrome only |
| Text Primary | `#F5F5F7` | Headings, primary values |
| Text Muted | `#9A9AA5` | Secondary labels, timestamps |
| Risk — Safe | `#2ECC71` | Tier 0–30 |
| Risk — Monitor | `#F5C518` | Tier 31–60 |
| Risk — Intervention | `#FF8C42` | Tier 61–80 |
| Risk — Critical | `#FF3B30` | Tier 81–100 |

Note: Brand Red and Critical Red are intentionally different hues. Reusing the exact brand red for "danger" would make every primary button look like an alert. Keep them visually distinct, and always pair Critical status with the AlertTriangle icon and the word "Critical" — never rely on the red alone.

### 8.3 Typography
A geometric sans-serif for headings (something with a technical/telemetry feel reads well against the racing theme — e.g. Titillium Web or similar), and a standard system sans (e.g. Inter) for body copy. All numeric readouts use tabular figures so columns of numbers align. No italics anywhere in the interface — use font weight or the Text Muted color for de-emphasis instead.

### 8.4 Iconography
Use the lucide icon set throughout, matched consistently to concept, e.g.:

| Concept | Icon |
|---|---|
| Risk / warning | `AlertTriangle` |
| Prediction | `TrendingUp` |
| Recommended route | `Route` |
| Crowd count | `Users` |
| Gate open / closed | `DoorOpen` / `DoorClosed` |
| Accessible route | `Accessibility` |
| Emergency mode | `Siren` |
| Help / replay tour | `HelpCircle` |
| Close / skip | `X` |
| Tour navigation | `ChevronLeft` / `ChevronRight` |

### 8.5 Layout Reference (low-fidelity)

```
+--------------------------------------------------------------+
| AI CROWD GUARDIAN         [Emergency Mode]   [Help] [Settings]|
+---------------------------------+----------------------------+
|                                 |  DECISION TIMELINE          |
|        DIGITAL TWIN MAP         |  12:41:02  Density rising   |
|                                  |  12:41:08  Prediction: T-6m |
|   [zone markers, risk-tinted]   |  12:41:12  Route optimized  |
|                                  |  12:41:20  Risk 82 -> 54    |
|                                 |                              |
+---------------------------------+----------------------------+
| [Prediction Alert Banner: Gate B — congestion in 6 min]       |
+---------------------------------+----------------------------+
| WHAT-IF SIMULATOR (collapsible) | BOTTLENECK DETAIL (on click) |
+--------------------------------------------------------------+
```

---

## 9. Non-Functional Requirements

- **Update cadence:** simulation advances on a fixed tick (1–2 seconds) so the map visibly moves without overloading the browser.
- **Accessibility:** WCAG AA contrast minimums on the dark theme; every risk-tier color is paired with an icon and a text label; tour is fully keyboard-navigable (Tab/Enter/Escape).
- **Target surface:** designed for a large control-room monitor or laptop screen first; mobile is not a target for this build.
- **Out of scope confirmation:** no live video/sensor ingestion, no persistent database — venue layout and simulation parameters can be config files or in-memory state for the hackathon build.

---

## 10. Simplified Data Model

```json
// Venue layout (input)
{
  "venue_id": "string",
  "zones": [
    {
      "id": "gate_b",
      "name": "Gate B",
      "type": "gate | corridor | concession | exit | field",
      "capacity_per_min": 2000,
      "accessible": true,
      "path": "coordinates for rendering on the twin"
    }
  ],
  "edges": [
    { "from": "gate_b", "to": "corridor_2", "distance_m": 40, "width_m": 4, "accessible": true }
  ]
}
```

```json
// Simulation tick (output, sent to frontend each tick)
{
  "timestamp": "2026-08-22T18:41:08Z",
  "zone_states": [
    {
      "zone_id": "gate_b",
      "density_per_sqm": 3.1,
      "flow_rate": 1900,
      "risk_score": 82,
      "risk_tier": "critical",
      "predicted_congestion_in_sec": 372,
      "top_factors": [
        { "cause": "crowd exiting stadium", "weight": 0.42 },
        { "cause": "metro arrival", "weight": 0.31 }
      ]
    }
  ]
}
```

---

## 11. Suggested Tech Stack

| Layer | Recommendation | Why |
|---|---|---|
| Frontend | React + Vite, Tailwind CSS, lucide-react icons | Fast to build, matches the design system directly |
| Map / Twin rendering | SVG or Canvas, hand-authored venue layout | A full mapping library is overkill for a fixed venue |
| Realtime updates | WebSocket from backend to frontend | Needed for the "live" feel of the twin and timeline |
| Backend / simulation | Python (FastAPI) with the venue modeled as a graph (e.g. via NetworkX) | A queueing/flow-based approximation is enough — skip full agent-based social-force modeling |
| NL Commander (Could Have) | Hugging Face or an LLM API, constrained to paraphrasing pre-computed values | Prevents the model from inventing its own numbers under demo pressure |
| Storage | In-memory / JSON config | No persistence needed for a hackathon build |

---

## 12. Demo Venue: Circuit de Monaco

**Decision:** the demo case study is the Circuit de Monaco (Monaco Grand Prix). Of every F1 venue, Monaco is the one recognized even outside motorsport circles — a street circuit through Monte Carlo, part of the sport's unofficial Triple Crown alongside the Indy 500 and Le Mans. It's also a strong stress-test case for this exact product: it's a public street circuit, not a purpose-built stadium, so pedestrian flow genuinely competes with narrow streets, a harbourfront promenade, and a live train station feeding foot traffic straight into the grandstands. That's a more convincing bottleneck story than a generic stadium bowl.

**Who builds the layout data:** a first-pass layout is included with this PRD (`monaco_gp_venue_layout.json`), built from public spectator guides — grandstand locations, entrance gates, and general-admission zones as published by the circuit's official grandstand map and independent spectator-guide sites. It is not an official circuit document, and gate counts vary slightly between sources (9 vs. 10 listed entrances), so treat the zone list as a solid starting skeleton, not ground truth. Before the demo, the team should:

- Sanity-check gate-to-grandstand mappings against the current year's official ticket holder guide, since gate assignments can shift year to year.
- Fill in the `capacity_per_min` and `distance_m` / `width_m` values — these are illustrative placeholders in the file and are what actually drive the simulation's realism.
- Decide whether to model the full 10-zone layout or trim it to 5–6 zones for a cleaner live demo; fewer zones with confident numbers will read better on stage than a dense map with guessed capacities.

**Known real-world bottleneck points worth simulating** (these make good scripted "shock events" for the What-If Simulator):
- Sainte Devote (Turn 1) — the circuit's narrowest, most accident-prone point, and the pinch point between the Gate 1 / Zone Z general-admission crowd and the harbour-side grandstands.
- The harbour promenade around Port Hercule — the single pedestrian spine connecting Gates 2, 7, and 8 and the K, N, O, P, V grandstands; realistically the most demo-worthy congestion point.
- Monaco Monte-Carlo train station — the circuit's largest single crowd-injection point, feeding directly into Gate 8 and the K grandstands via a pedestrian tunnel; a strong candidate for the "metro arrival" shock event already named in the original brainstorm.

---

## 13. Demo Script (for judging)

1. Normal state — show the live twin with all zones in Safe/Monitor.
2. Trigger a scheduled event (e.g. metro arrival) — a prediction alert appears with a countdown.
3. Click the flagged zone — the explainability panel breaks down why.
4. Open What-If, run the gate-closure preset — compare scenarios, show the recommended one.
5. Trigger Emergency Mode — show the exit-rebalancing recommendation.

Roughly two to three minutes, narrated.

---

## 14. Risks & Assumptions

- **Assumption:** the demo runs on simulated/synthetic data driven by layout + crowd size + schedule, matching the brief's stated inputs — not live video.
- **Risk:** a fully free-form What-If engine is a large build. Mitigation: ship 2–3 hardcoded scenario presets.
- **Risk:** an NL commander can fabricate numbers under pressure. Mitigation: restrict it to paraphrasing values the simulation already computed.
- **Risk:** multi-persona behaviour modeling is easy to over-scope. Mitigation: vary marker appearance only; don't build independent behaviour logic per persona for this build.

---

## 15. Open Questions for the Team

- ~~Which venue will be used as the demo case study, and who builds its layout data?~~ Resolved — Circuit de Monaco, see Section 12 and `monaco_gp_venue_layout.json`.
- Is Accessibility-Aware Routing (Could Have) worth the build time given the judging rubric, or does it get cut first if time runs short?
- Who owns the risk-score weighting — should it be tuned live against the demo dataset before presenting?
