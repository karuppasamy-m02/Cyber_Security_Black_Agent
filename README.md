# CYBERSENTINEL AI

> **Intelligent Defense. Explainable Intelligence. Local AI.**

CyberSentinel AI is a production-grade, enterprise cybersecurity intelligence and incident response platform. It combines deterministic rule matching, machine learning (Isolation Forest & XGBoost), deep learning autoencoders, SHAP explainability, and a local offline LLM security analyst powered by Ollama.

---

## 🛡️ Key Features

- **SOC Command Center:** Real-time metrics, event ingestion rates, incident severity breakdowns, and detection model health.
- **AMTIE Detection Engine (5 Layers):**
  - **Layer 1:** Rule-based detection for brute-force, privilege escalation, and blacklists.
  - **Layer 2:** Unsupervised anomaly detection via Isolation Forest.
  - **Layer 3:** Supervised multi-class attack classification using XGBoost (Benign, Brute Force, Port Scan, Privilege Escalation, Data Exfiltration).
  - **Layer 4:** Temporal and entity-based correlation clustering across sliding 15-minute windows.
  - **Layer 5:** Calibrated 0–100 risk scoring with anti-double-counting logic and automatic incident escalation.
- **Deep Learning Laboratory:** Autoencoder reconstruction error analysis for zero-day behavioral anomalies.
- **Explainable AI (XAI):** SHAP feature attribution waterfall charts displaying exact positive and negative factors driving detection scores.
- **Local AI Security Analyst:** Offline RAG-powered reasoning assistant powered by Ollama (`qwen3:8b` / `llama3.1:8b`). Zero third-party cloud API dependencies; strict prompt-injection guardrails.
- **Real-Time Monitoring:** Live WebSocket telemetry streams (`/ws/events`, `/ws/incidents`, `/ws/system`) with automatic reconnection.
- **Incident Lifecycle Management:** Automated ticket creation, MITRE ATT&CK mapping, timeline correlation, and analyst investigation workflows.
- **Response & Automation Center:** Simulation-first containment workflows (IP blocking, host isolation) requiring explicit cryptographic analyst approval.
- **Threat Intelligence Center:** Local Indicator of Compromise (IoC) matching for IPs, domains, and SHA-256 hashes.

---

## 💻 Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui palette, Zustand, Recharts, Lucide React |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, Alembic, SQLite (WAL mode), WebSockets, Pydantic v2 |
| **Machine Learning** | Scikit-learn, XGBoost, PyTorch, Joblib, SHAP, NumPy, Pandas |
| **Local AI Brain** | Ollama (`qwen3:8b`, `llama3.1:8b`, `nomic-embed-text`), Local SQLite RAG, Strict Security Guardrails |
| **Testing & Tooling**| Pytest, Pytest-Asyncio, Argon2id, Docker Compose |

---

## 📁 Repository Structure

```
d:\Mozhli\
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST endpoints (auth, dashboard, events, detection, incidents, etc.)
│   │   ├── ai/              # Ollama client, security guardrails, RAG retriever
│   │   ├── core/            # JWT, Argon2id security helpers
│   │   ├── database/        # SQLite WAL session & SQLAlchemy base
│   │   ├── detection/       # AMTIE 5-layer detection engine
│   │   ├── ml/              # Autoencoder, metrics, trainer, SHAP explainer
│   │   ├── models/          # 23 SQLAlchemy ORM database models
│   │   ├── schemas/         # Pydantic v2 request/response schemas
│   │   ├── services/        # Ingestion, normalization, event lifecycle
│   │   └── websocket/       # Real-time WebSocket connection manager
│   ├── tests/               # 20 Automated Pytest test cases
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Design system (SeverityBadge, StatusPill, Charts, Modals)
│   │   ├── pages/           # 18 SOC views (Dashboard, Monitoring, Incidents, AI Analyst, etc.)
│   │   ├── services/        # Axios API client
│   │   └── stores/          # Zustand authentication & telemetry stores
│   ├── package.json
│   └── tailwind.config.js
├── database/                # SQLite persistent database (cybersentinel.db)
├── ml-engine/models/        # Trained model artifacts (.joblib)
├── knowledge-base/          # MITRE ATT&CK & incident playbooks
├── docker/                  # Dockerfiles and Nginx reverse proxy configuration
├── docs/                    # Technical architecture & engine documentation
├── scripts/
│   ├── init_db.py           # Database schema & enterprise seeds
│   ├── train_initial_models.py # Model training & registry initialization
│   └── seed_demo_data.py    # Simulated cybersecurity attack telemetry
├── docker-compose.yml       # Production container orchestration
├── start-dev.bat            # One-click Windows development launcher
├── start-dev.sh             # Unix development launcher
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+** & npm
- **Ollama** (optional for AI assistant: `ollama run qwen3:8b`)

### 2. Automated Launch (Windows 11)
Simply double-click or run:
```cmd
start-dev.bat
```
*This script verifies your Python and Node environments, checks Ollama connectivity, initializes the database and ML models, and starts both the FastAPI backend and Vite frontend.*

### 3. Manual Launch

#### Backend Setup
```powershell
# Set Python Path & activate venv
$env:PYTHONPATH="d:\Mozhli\backend;d:\Mozhli\.venv\Lib\site-packages"

# Initialize database schema and default seeds
python scripts\init_db.py

# Train baseline ML models
python scripts\train_initial_models.py

# Optional: Ingest simulated attack telemetry
python scripts\seed_demo_data.py

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```

The SOC Command Center will be accessible at:
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Interactive REST API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **WebSocket Feeds:** `ws://127.0.0.1:8000/ws/events`, `/ws/incidents`, `/ws/system`

---

## 🔑 Default Credentials

The platform is pre-seeded with three default role accounts:

| Role | Username | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin` | `Admin@CyberSentinel2026!` | Full SOC access, model training, response approvals |
| **Security Analyst** | `analyst` | `Analyst@CyberSentinel2026!` | Event ingestion, incident investigations, AI queries |
| **Viewer** | `viewer` | `Viewer@CyberSentinel2026!` | Read-only dashboards and telemetry feeds |

---

## 🤖 Local Ollama Setup Guide

CyberSentinel AI operates **100% locally** with zero external cloud dependencies.

1. Install Ollama from [ollama.com](https://ollama.com).
2. Pull the recommended security reasoning and embedding models:
   ```bash
   ollama pull qwen3:8b
   ollama pull llama3.1:8b
   ollama pull nomic-embed-text
   ```
3. Start the Ollama background daemon:
   ```bash
   ollama serve
   ```
*If Ollama is not running, the application gracefully flags the AI assistant as offline while all detection, correlation, and response capabilities continue uninterrupted.*

---

## 🧪 Automated Test Suite

Run the full automated test suite covering authentication, detection, event parsing, threat intelligence, and AI guardrails:

```powershell
$env:PYTHONPATH="d:\Mozhli\backend;d:\Mozhli\.venv\Lib\site-packages"
python -m pytest backend\tests -v
```

### Test Results
```
backend/tests/test_auth.py::test_password_hashing_and_verification PASSED      [  5%]
backend/tests/test_auth.py::test_jwt_token_generation_and_decoding PASSED      [ 10%]
backend/tests/test_auth.py::test_login_admin_success PASSED                   [ 15%]
backend/tests/test_auth.py::test_login_invalid_password PASSED                [ 20%]
backend/tests/test_auth.py::test_user_registration_and_duplicate_check PASSED  [ 25%]
backend/tests/test_detection.py::test_layer2_isolation_forest_inference PASSED  [ 30%]
backend/tests/test_detection.py::test_layer3_xgboost_classifier_inference PASSED [ 35%]
backend/tests/test_detection.py::test_layer5_risk_intelligence_scoring PASSED  [ 40%]
backend/tests/test_detection.py::test_amtie_engine_event_processing PASSED    [ 45%]
backend/tests/test_events.py::test_parse_linux_auth PASSED                    [ 50%]
backend/tests/test_events.py::test_parse_windows_event PASSED                 [ 55%]
backend/tests/test_events.py::test_parse_network_flow PASSED                  [ 60%]
backend/tests/test_events.py::test_compute_event_hash_deterministic PASSED    [ 65%]
backend/tests/test_events.py::test_ingest_and_amtie_processing_pipeline PASSED [ 70%]
backend/tests/test_system.py::test_ai_security_guard_benign_text PASSED       [ 75%]
backend/tests/test_system.py::test_ai_security_guard_injection_detection PASSED [ 80%]
backend/tests/test_system.py::test_ai_security_guard_wrap_evidence PASSED     [ 85%]
backend/tests/test_system.py::test_threat_intelligence_indicators PASSED      [ 90%]
backend/tests/test_system.py::test_incident_management_persistence PASSED     [ 95%]
backend/tests/test_system.py::test_model_registry_entries PASSED              [100%]
======================= 20 passed in 6.93s =======================
```

---

## 🐳 Docker Deployment

To launch the containerized production stack using Docker Compose:

```bash
docker-compose up -d --build
```
- Frontend Nginx Proxy: [http://localhost](http://localhost)
- Backend API Container: [http://localhost:8000](http://localhost:8000)

---

## 📜 License

Enterprise Cybersecurity Platform - Built for sovereign, local, and explainable AI operations.
