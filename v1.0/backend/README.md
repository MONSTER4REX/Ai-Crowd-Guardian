# Python simulation service

The authoritative simulation logic lives in `simulation.py`. Run the optional
adapter with `uvicorn app:app --reload --port 8000` from this directory. The
static dashboard contains a deterministic browser mirror so the demo remains
runnable without a separate process.

The implementation stops at the first eight PRD features: live twin,
congestion prediction, multi-factor risk, safest route, explainability,
timeline, presets, and shock injection. Emergency Mode and later roadmap items
are intentionally not implemented in this pass.
