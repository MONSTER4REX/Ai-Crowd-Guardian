# AI Crowd Guardian — Design Direction

## Three initial approaches

### Theme Name: Telemetry Noir
Very Brief Intro: A dark, editorial control-room language that treats the venue as a live instrument panel: hard-edged cards, measured red accents, and quiet map texture. The mood is calm under pressure rather than theatrical.
Probability: 0.07

### Theme Name: Riviera Operations Desk
Very Brief Intro: A sunlit Monaco-inspired operations interface using chalk, sea-glass blue, and signal orange, with a more civic and public-facing tone. It makes the venue feel like a place people move through rather than a machine to monitor.
Probability: 0.03

### Theme Name: Circuit Poster Grid
Very Brief Intro: A graphic-design direction built from oversized route lines, cropped numerals, and modular poster-like panels. It is energetic and memorable, but less suitable for fast operational scanning.
Probability: 0.09

## Chosen approach: Telemetry Noir

### Design Movement
Swiss International Style translated into a high-contrast broadcast-telemetry control room: disciplined hierarchy, rational alignment, and purposeful asymmetry instead of decorative dashboard chrome.

### Core Principles
1. **Action before ornament.** Every prominent number answers what an operator should notice or do next.
2. **Risk is multi-factor.** Density never appears alone; risk tier, movement, capacity, and explanation travel together.
3. **Calm contrast.** Near-black surfaces and ivory text create a quiet field so the racing-red intervention signal has meaning.
4. **Spatial honesty.** The digital twin is schematic and legible, not falsely photorealistic or overloaded with map detail.

### Color Philosophy
The foundation is graphite rather than pure black so large control-room surfaces remain readable over long shifts. Ivory text carries the information layer, muted steel-blue provides orientation, and a single ownable racing red is reserved for active intervention and primary controls. Safety states use distinct green, amber, orange, and critical red tones, always paired with iconography and labels so color is never the sole signal.

### Layout Paradigm
Use a persistent command rail on the left, a wide twin canvas in the center, and a decision column on the right. The lower band becomes a horizontal decision surface for scenarios, emergency rebalancing, and bottleneck explanation. Avoid centering the whole application; let the map own the visual mass while the rails stay dense and inspectable.

### Signature Elements
1. **Telemetry ticks:** small time labels, route IDs, thin rules, and tabular numerals create the feeling of a live operations feed.
2. **Signal notch:** a compact red angled marker appears in the Guardian mark, active buttons, alert edges, and the route recommendation.
3. **Twin trace:** route lines and crowd dots use a shared visual grammar so the map and the explanation panels feel like one system.

### Interaction Philosophy
Interactions should feel like acknowledging an alert, not browsing a marketing site. Hover states reveal a little more context, clicking a zone opens its reasoned breakdown, and controls change the simulated state immediately with explicit status feedback. No action hides important context behind an unexplained animation.

### Animation
Use short, physically grounded transitions under 240ms for panels, markers, and button states. Crowd dots drift subtly on the live twin; alert changes use a restrained pulse on the perimeter rather than a flashing fill. The onboarding tour uses a clean focus ring and instant skip behavior. Respect `prefers-reduced-motion` and remove non-essential movement when requested.

### Typography System
Headings and telemetry labels use **Titillium Web** with semibold weight for a technical, slightly condensed silhouette. Body copy uses **IBM Plex Sans** for clarity. Numeric values use tabular figures with strong weight contrast, and no italics are used anywhere in the interface.

### Brand Essence
AI Crowd Guardian is a predictive crowd-safety desk for venue operators who need a clear action before a bottleneck becomes an incident; it is different because every risk state is paired with a reason, a countdown, and a safer move.

Personality adjectives: **composed, exacting, protective**.

### Brand Voice
Headlines are short and operational. CTAs are direct verbs. Microcopy names the consequence and the reason without hype or filler.

Example lines:

> Gate 8 will cross intervention threshold in 06:12.

> Open the twin. Find the pressure point. Move the flow.

### Wordmark & Logo
The mark is a shield cut by a single forward-moving route line, finished with a small racing-red signal notch. The wordmark is set in a custom-spaced uppercase treatment with a split in the “A” counter, but the interface primarily uses the symbol so it remains legible at small sizes.

### Signature Brand Color
**Guardian Red — `#E4002B`**. It is reserved for deliberate operator action, not reused as the critical risk color, so the interface can distinguish brand controls from danger states.

## First-eight feature contract

The implementation stops after these eight PRD items: **Live Digital Twin**, **Congestion Prediction**, **Crowd Risk Score**, **Safest-Route Recommendation**, **Bottleneck Explainability**, **Decision Timeline**, **What-If Simulator**, and **Shock Events**. Emergency Mode and later roadmap items are intentionally not implemented in this pass.
