@echo off
echo ============================================
echo  AI Crowd Guardian — Monaco Operations Desk
echo ============================================

REM Start FastAPI backend
echo [1/2] Starting FastAPI backend on http://localhost:8000 ...
start "Guardian Backend" cmd /k "cd /d %~dp0backend && ..\backend\.venv\Scripts\python.exe -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload"

REM Wait a moment for backend to boot
timeout /t 3 /nobreak > nul

REM Start React frontend
echo [2/2] Starting React frontend on http://localhost:3000 ...
start "Guardian Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:3000
echo  API docs: http://localhost:8000/docs
echo.
