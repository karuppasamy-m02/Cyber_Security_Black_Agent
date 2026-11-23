#!/usr/bin/env bash
# ==============================================================================
# CYBERSENTINEL AI - UNIX LAUNCH SCRIPT
# Intelligent Defense. Explainable Intelligence. Local AI.
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=============================================================================="
echo "                 CYBERSENTINEL AI - SOC LAUNCH ENVIRONMENT"
echo "           Intelligent Defense. Explainable Intelligence. Local AI."
echo "=============================================================================="
echo ""

# 1. Check Python (Prioritize .venv)
PYTHON_CMD=""
if [ -f "$DIR/.venv/bin/python" ]; then
    PYTHON_CMD="$DIR/.venv/bin/python"
    echo "[OK] Using dedicated project virtual environment (.venv)"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
fi

if [ -z "$PYTHON_CMD" ]; then
    echo "[!] Python 3.11+ is required but not found."
    exit 1
fi

# 2. Check Node
if ! command -v node &> /dev/null; then
    echo "[!] Node.js 18+ is required for frontend dev server."
    exit 1
fi

# 3. Check Ollama
echo "[*] Checking Local Ollama AI service status (http://localhost:11434)..."
if curl -s --connect-timeout 2 http://localhost:11434/api/version &> /dev/null; then
    echo "[OK] Local Ollama service is ONLINE and active."
else
    echo "[INFO] Local Ollama service is not running on localhost:11434."
    echo "       CyberSentinel AI will run in Safe Offline Mode for AI features."
    echo "       Run 'ollama serve' in a separate terminal to enable local AI assistant."
fi
echo ""

# 4. Database & Models
export PYTHONPATH="$DIR/backend"
echo "[*] Initializing SQLite database schema and enterprise seeds..."
$PYTHON_CMD scripts/init_db.py

echo "[*] Verifying ML model artifacts..."
$PYTHON_CMD scripts/train_initial_models.py
echo ""

# 5. Start servers
echo "[*] Starting FastAPI Backend on http://127.0.0.1:8000..."
$PYTHON_CMD -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

echo "[*] Starting React SOC Interface on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=============================================================================="
echo "[SUCCESS] CyberSentinel AI is active!"
echo "   SOC Command Center:  http://localhost:5173"
echo "   API & Swagger Docs:  http://127.0.0.1:8000/docs"
echo ""
echo "Default Credentials:"
echo "   Administrator:    admin    / Admin@CyberSentinel2026!"
echo "   Security Analyst: analyst  / Analyst@CyberSentinel2026!"
echo "   Read-Only Viewer: viewer   / Viewer@CyberSentinel2026!"
echo "=============================================================================="

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
