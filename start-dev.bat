@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo                      CYBER BLACK - SOC LAUNCH ENVIRONMENT
echo            Intelligent Defense. Explainable Intelligence. Local AI.
echo ==============================================================================
echo.

cd /d "%~dp0"

REM 1. Verify and Select Python Runtime (Prioritize .venv with Python 3.11)
echo [*] Checking Python runtime...
set PYTHON_BIN=

if exist "%~dp0.venv\Scripts\python.exe" (
    set PYTHON_BIN="%~dp0.venv\Scripts\python.exe"
    echo [OK] Using dedicated project virtual environment (.venv)
) else if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set PYTHON_BIN="%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    echo [OK] Using Python 3.11 installation: %PYTHON_BIN%
) else (
    where python >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        set PYTHON_BIN=python
        echo [!] Using default system python.
    ) else (
        echo [!] Python 3.11+ is not found. Please install Python 3.11.
        pause
        exit /b 1
    )
)

REM 2. Check Node.js runtime
echo [*] Checking Node.js runtime...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [!] Node.js is not found on PATH. Please install Node.js 18+ for the frontend.
    pause
    exit /b 1
)

REM 3. Check Local Ollama Status
echo [*] Checking Local Ollama AI service status (http://localhost:11434)...
curl -s --connect-timeout 2 http://localhost:11434/api/version >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Local Ollama service is ONLINE and active.
) else (
    echo [INFO] Local Ollama service is not running on localhost:11434.
    echo        CYBER BLACK will run in Safe Offline Mode for AI features.
    echo        To enable Ollama, run 'ollama serve' in a separate terminal.
)
echo.

REM 4. Initialize Database and ML Models
echo [*] Initializing SQLite database schema and enterprise seeds...
set PYTHONPATH=%~dp0backend;%~dp0.venv\Lib\site-packages
%PYTHON_BIN% scripts\init_db.py
if %ERRORLEVEL% neq 0 (
    echo [!] Database initialization failed. Check error log.
    pause
    exit /b 1
)

echo [*] Verifying ML model artifacts (Isolation Forest, XGBoost, Autoencoder)...
%PYTHON_BIN% scripts\train_initial_models.py
if %ERRORLEVEL% neq 0 (
    echo [!] ML models verification failed. Check error log.
    pause
    exit /b 1
)
echo.

REM 5. Start Backend Server
echo [*] Starting CYBER BLACK FastAPI Backend on http://127.0.0.1:8000...
start "CYBER BLACK - Backend [Port 8000]" cmd /k "cd /d %~dp0 && set PYTHONPATH=%~dp0backend;%~dp0.venv\Lib\site-packages && %PYTHON_BIN% -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

REM 6. Start Frontend Server
echo [*] Starting CYBER BLACK React SOC Interface on http://localhost:5173...
start "CYBER BLACK - Frontend [Port 5173]" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==============================================================================
echo [SUCCESS] CYBER BLACK is starting up!
echo.
echo    SOC Command Center:       http://localhost:5173
echo    Red Team Attack Portal:   http://localhost:5173/attacks
echo    REST & WS API Docs:       http://127.0.0.1:8000/docs
echo.
echo Default Verified Credentials:
echo    Administrator:    admin    / Admin@CyberBlack2026!
echo    Security Analyst: analyst  / Analyst@CyberBlack2026!
echo    Compliance Viewer: viewer  / Viewer@CyberBlack2026!
echo    Lead Architect:   mani02   / Mani@CyberBlack2026!
echo    Red Team Key:     ADVERSARY-SIM-2026
echo ==============================================================================
echo.
pause
