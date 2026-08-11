@echo off
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
  echo Creating virtual environment...
  python -m venv .venv
  .venv\Scripts\pip install -r requirements.txt
)
".venv\Scripts\streamlit.exe" run dashboard.py
