@echo off
cd /d "%~dp0"

REM 1. Initialize Database and ML Models
set PYTHONPATH=%~dp0backend
python scripts\init_db.py
python scripts\train_initial_models.py

REM 2. Start Backend & Frontend (Host 0.0.0.0 for Mobile Attacker Access)
echo [*] Starting FastAPI Backend on 0.0.0.0:8000...
start "CYBER BLACK - Backend" cmd /k "set PYTHONPATH=%~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [*] Starting React Frontend on 0.0.0.0:5173...
start "CYBER BLACK - Frontend" cmd /k "cd frontend && npm run dev -- --host 0.0.0.0"

echo.
echo ==========================================================
echo  [SUCCESS] CYBER BLACK ACTIVE
echo  Laptop SOC Command Center: http://localhost:5173/dashboard
echo  Black Agent Defense:       http://localhost:5173/agents/black
echo  Dark Agent Deception Core: http://localhost:5173/agents/dark
echo  Mobile Attacker Terminal:  http://^<your-laptop-ip^>:5173/attacks
echo  Attacker Sudo Password:    AWT-0211
echo  Dark Agent Code:           Mani02
echo ==========================================================
echo.
