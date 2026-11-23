#!/usr/bin/env bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# 1. Python & Database Setup
export PYTHONPATH="$DIR/backend"
PYTHON_CMD="python3"
$PYTHON_CMD scripts/init_db.py
$PYTHON_CMD scripts/train_initial_models.py

# 2. Local IP Detection for Mobile Attacker Device
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

# 3. Start Backend & Frontend (Host 0.0.0.0 for Mobile Phone Access)
echo "[*] Starting FastAPI Backend on 0.0.0.0:8000..."
$PYTHON_CMD -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "[*] Starting React Frontend on 0.0.0.0:5173..."
cd frontend
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo " [SUCCESS] CYBER BLACK ACTIVE"
echo " Laptop SOC Command Center: http://localhost:5173/dashboard"
echo " Black Agent Defense:       http://localhost:5173/agents/black"
echo " Dark Agent Deception Core: http://localhost:5173/agents/dark"
echo " Mobile Attacker Terminal:  http://${LOCAL_IP}:5173/attacks"
echo " Attacker Sudo Password:    AWT-0211"
echo " Dark Agent Code:           Mani02"
echo "=========================================================="
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait