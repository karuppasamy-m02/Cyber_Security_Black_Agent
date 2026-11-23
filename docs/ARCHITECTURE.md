# CyberSentinel AI: Architectural Specification & System Blueprint

## 1. Overview & Core Philosophy

**CYBERSENTINEL AI** is an enterprise-grade Security Operations Center (SOC) intelligence and incident management platform designed with three core axioms:
1. **Intelligent Defense:** Multi-layer hybrid detection engine (deterministic rules, unsupervised behavioral baseline deviation, supervised multi-class gradient-boosted classification, temporal entity correlation, and calibrated risk intelligence).
2. **Explainable Intelligence:** Every alert and incident produces transparent evidence trails, primary feature importance, and SHAP-based attributions.
3. **Local AI:** Zero dependency on paid cloud LLMs (OpenAI, Anthropic, Gemini). All natural language intelligence, RAG security assistant reasoning, and response generation run strictly on locally hosted Ollama instances (`http://localhost:11434`) with automated graceful fallback when offline.

---

## 2. High-Level System Architecture

```mermaid
graph TD
    subgraph Data Sources
        DS1[Linux auth.log / Syslog]
        DS2[Windows Security EVTX / JSON]
        DS3[Network Flow / Suricata]
        DS4[REST API Ingestion / Batch]
    end

    subgraph Ingestion & Normalization
        NORM[EventNormalizer Service]
        HASH[SHA-256 Deduplication Hash]
        VAL[Pydantic Schema Validation]
    end

    subgraph AMTIE AI Detection Pipeline
        L1[Layer 1: Rule Engine]
        L2[Layer 2: Unsupervised Anomaly - Isolation Forest]
        L3[Layer 3: Supervised Classifier - XGBoost]
        L4[Layer 4: Entity & Temporal Correlation]
        L5[Layer 5: Multi-Signal Risk Intelligence]
    end

    subgraph Storage & Persistence
        DB[(SQLite WAL Database)]
        MODELS[(Joblib Model Artifacts)]
        KB[(Local RAG Knowledge Base)]
    end

    subgraph Local AI Brain
        OL[Ollama Local Daemon :11434]
        GUARD[AI Security Guardrail & Injection Filter]
        RAG[Local Knowledge Retriever]
    end

    subgraph SOC User Interface
        UI[React 18 + Vite + Tailwind + shadcn/ui]
        WS[FastAPI WebSocket Channels]
        REST[FastAPI REST API v1]
    end

    DS1 --> NORM
    DS2 --> NORM
    DS3 --> NORM
    DS4 --> NORM
    NORM --> HASH --> VAL --> DB
    VAL --> L1
    VAL --> L2
    VAL --> L3
    L1 & L2 & L3 --> L4 --> L5
    L5 --> DB
    L5 -. Auto-Escalate (Risk >= 70) .-> DB
    DB --> REST & WS
    REST & WS --> UI
    UI --> GUARD --> OL
    KB --> RAG --> OL
```

---

## 3. Module Breakdown

### 3.1 Authentication & Access Control (RBAC)
- **Algorithm:** Argon2id password hashing via Passlib.
- **Tokens:** RFC 7519 JSON Web Tokens (JWT) signed with HMAC-SHA256.
- **Roles:**
  - `Administrator`: Full system control, user management, model retraining, response approval.
  - `Security Analyst`: Event ingestion, incident lifecycle, threat hunting, AI assistant queries.
  - `Viewer`: Read-only access to monitoring telemetry and dashboard metrics.

### 3.2 Real-Time Event Telemetry & WebSockets
- **Protocols:** FastAPI WebSockets (`/ws/events`, `/ws/incidents`, `/ws/system`).
- **Heartbeats:** Bi-directional keep-alive pings with automatic reconnection in Zustand store.
- **Deduplication:** Windowed SHA-256 hashing across `raw_log`, `timestamp`, and `source_ip`.

### 3.3 Deep Learning Laboratory & Model Registry
- **Autoencoder Architecture:** Multi-layer PyTorch/scikit-learn reconstruction model trained on benign network baseline flows. Reconstruction error exceeding threshold ($\epsilon > \tau$) triggers behavioral anomaly alerts.
- **Metrics Tracked:** Precision, Recall, F1-Score, ROC-AUC, PR-AUC, False Positive Rate (FPR), Inference Latency (ms).
- **Model Registry:** Model versioning, hyperparameter persistence, activation toggling.
