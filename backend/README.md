# Backend (Python)

All simulation logic lives in `simulation.py`. Two ways to run it:

## Dashboard (recommended)

```bash
pip install -r requirements.txt
streamlit run dashboard.py
```

## REST / WebSocket API

```bash
uvicorn app:app --reload --port 8000
```

The implementation covers the first eight PRD features. Emergency Mode and later roadmap items are intentionally out of scope for this pass.
