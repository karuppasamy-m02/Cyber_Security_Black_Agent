# CYBER BLACK — OPERATOR & ACCESS DIRECTORY

```
================================================================================
                               CYBER BLACK
          Intelligent Defense. Explainable Intelligence. Local AI.
================================================================================
```

---

## 1. EXECUTIVE OVERVIEW

**CYBER BLACK** is an enterprise-grade AI cybersecurity intelligence and autonomous detection platform. It operates completely on-premise using local open-weight AI (Ollama) and a 5-layer multi-tier anomaly detection engine (AMTIE).

All demo telemetry, test accounts, and sample incidents have been completely purged. The database is initialized to a **Zero Baseline** (0 events, 0 active incidents) so that live attack scenarios can be demonstrated cleanly from real-time ingestion to containment.

---

## 2. OFFICIAL USER ACCOUNTS & CREDENTIALS

The following 4 canonical accounts are pre-configured, tested, and active in the database.

| # | Role & Title | Username | Enterprise Email | Master Password | Permissions & Access Scope |
|---|:---|:---|:---|:---|:---|
| **1** | **Chief Information Security Officer (CISO)** | `admin` | `admin@cyberblack.local` | `Admin@CyberBlack2026!` | **Full Policy Control (`all`)**<br>• User provisioning & role management<br>• Database maintenance & truncation<br>• Response action approvals & overrides<br>• Neural model lab & parameter tuning |
| **2** | **Lead SOC Security Analyst** | `analyst` | `analyst@cyberblack.local` | `Analyst@CyberBlack2026!` | **Triage & Operations (`investigate`, `respond`, `view`)**<br>• Live WebSocket telemetry monitoring<br>• Security event investigation & drilldown<br>• Incident triage & MITRE correlation<br>• AI Analyst copilot querying |
| **3** | **SOC Compliance Auditor** | `viewer` | `viewer@cyberblack.local` | `Viewer@CyberBlack2026!` | **Read-Only Compliance (`view`)**<br>• Security overview & executive KPIs<br>• Forensic audit log inspection<br>• Model evaluation benchmark review<br>• Compliance report generation |
| **4** | **Lead SOC Architect** | `mani02` | `karuppasamy.selvi02@gmail.com` | `Mani@CyberBlack2026!` | **Full Administrator Clearance (`all`)**<br>• Complete system access<br>• High-privilege SOC operator control |

---

## 3. RED TEAM ADVERSARY SIMULATION CREDENTIALS

The Red Team simulation portal is an independent adversarial console disconnected from the standard SOC menu, designed for live interactive demonstrations:

- **Adversary Simulation Portal URL:** `http://localhost:5173/attacks`
- **Adversary Auth Gateway URL:** `http://localhost:5173/attacks/login`
- **Operator Callsign:** `RED-OPERATOR-01`
- **Simulation Clearance Key:** `ADVERSARY-SIM-2026`
- **Available Attack Scenarios:** 12 enterprise attack scenarios (SSH Brute Force, Internal Port Scanning, Encrypted Data Exfiltration, Privilege Escalation, SQLi, Ransomware Pre-execution, Kerberoasting, DDoS SYN Flood, Stored XSS, PowerShell LotL, DNS Tunneling, and Insider Policy Tampering).

---

## 4. PERMISSIONS & CAPABILITIES MATRIX

```
Feature / Capability             | Administrator | Security Analyst | Compliance Viewer
---------------------------------|:-------------:|:----------------:|:----------------:
Command Center & Dashboards      |      Yes      |       Yes        |       Yes
Live Telemetry & Event Feed      |      Yes      |       Yes        |       Yes
Incident Investigation & Triage  |      Yes      |       Yes        |       Yes
Ollama Local AI Assistant        |      Yes      |       Yes        |     Read-Only
ML Model Training & Evaluation   |      Yes      |       Yes        |     Read-Only
Stage Response Containment       |      Yes      |       Yes        |        No
Approve / Execute Containment    |      Yes      |    Dual-Control  |        No
User Management & Provisioning   |      Yes      |        No        |        No
Database Truncation & Zero Reset |      Yes      |        No        |        No
Database Backup & Snapshots      |      Yes      |        No        |        No
```

---

## 5. DESIGN SYSTEM PALETTE (CYBER BLACK)

```
+-----------+-----------------------------------------+
| TOKEN     | HEX CODE   | PURPOSE                    |
+-----------+-----------------------------------------+
| Obsidian  | #0A0A0A    | Deepest canvas base        |
| Graphite  | #2B2B2B    | Borders, cards & dividers  |
| Ash       | #A8A8A3    | Subtext, metadata & badges |
| Ivory     | #F5F5F2    | Primary typography & active|
+-----------+-----------------------------------------+
```

---

## 6. DATABASE MAINTENANCE & TRUNCATION

To return the database to a zero baseline at any point during live presentations:

1. **Via UI:** Navigate to **Settings** (`/settings`), click **Truncate All Telemetry & Incidents**, and confirm.
2. **Via REST API:**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/v1/system/truncate
   ```
3. **Via Script:**
   ```bash
   python scripts/clean_and_truncate_db.py
   ```

---

## 7. SERVICE LAUNCH COMMANDS

```bash
# Windows 1-Click Launch (starts Backend on 8000 + Frontend on 5173)
start-dev.bat

# Manual Backend Launch
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Manual Frontend Launch
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
