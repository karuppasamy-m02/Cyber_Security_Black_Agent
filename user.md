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

## 3. DUAL AUTONOMOUS AGENTS ARCHITECTURE (BLACK & DARK)

The Autonomous Agents Operations Center operates in two distinct, independently accessible routes:

### Navigation 1: Black Agent (`/agents/black`)
- **Role:** Perimeter Gateway Fortress & Zero-Trust Port Armor.
- **Scope:** Continuously monitors and protects all 9 core network ports (`:22, :80, :443, :8000, :5173, :3306, :5432, :8080, :53`).
- **Master Shield Toggle:** Manual ON/OFF switch. When switched ON, unauthorized traffic is dropped via 100% gateway firewall drops (`[ACCESS BLOCKED]`). When switched OFF, attacks penetrate and exfiltrate target data.
- **Standby Mode:** Automatically paused when Dark Agent is activated to lure adversaries into the deception honeypot.

### Navigation 2: Dark Agent (`/agents/dark`)
- **Role:** Autonomous Honeypot Deception, Target Exfiltration Containment, and Remote Device Browser Lock.
- **Dark Access Code:** `Mani02` (Required to activate, configure, or manage Dark Agent).
- **Ingress Honeypot:** When active, Black Agent stands down, allowing attackers to enter the honeypot container.
- **5 Exfiltration Files:** Decoy environment stores 5 target files (`recon_targets.txt`, `customer_records.csv`, `api_endpoints.conf`, `system_architecture.json`, `audit_log_2026.txt`).
- **Attacker Device Browser Lock:** Deploys automated reverse takeover that locks the attacker's browser viewport into full-screen **"YOUR SCREEN IS LOCKED BY DARK"** Red CRT display with retro television moving text animation and disabled inputs.
- **Remote Release:** The device remains locked until released by the operator from the laptop dashboard or until Dark Agent is turned OFF.

---

## 4. MULTI-DEVICE DEMO CONFIGURATION (LAPTOP + MOBILE PHONE)

| Device | Role | Access URL | Functions |
|---|---|---|---|
| **Main Device (Laptop)** | **SOC Command Center** | `http://localhost:5173/agents/dark` | Monitors Black Agent, controls Dark Agent with code `Mani02`, tracks attacker footprints, and clicks "RELEASE DEVICE" |
| **Attacker Device (Mobile Phone)** | **Offensive Adversary Terminal** | `http://<laptop-ip>:5173/attacks` | Interactive CLI (`ls`, `cd`, `cat`, `att-0` to `att-12`), sudo password `AWT-0211`, gets locked with Red CRT screen |

---

## 5. ADVERSARY TERMINAL COMMANDS & CREDENTIALS

The Adversary Simulation Terminal (`/attacks`) is a monochrome hacker terminal designed for live demonstrations:

- **Terminal URL:** `http://localhost:5173/attacks` (or `http://<laptop-ip>:5173/attacks` on mobile)
- **Terminal Sudo Password:** `AWT-0211` (for privileged commands; `ls`, `cd`, `cat` require no sudo)
- **Target Repository Location:** `/var/data/targets/exfil` (5 files stored)
- **Commands Available:**
  - `ls [-la]` : List the 5 target files with sizes and permissions.
  - `cat <filename>` : View the exact contents of any target file.
  - `cd <dir>` : Change current working directory.
  - `pwd` : Print current working location.
  - `att-0` : Exfiltrate all 5 files when Black Agent is OFF / disarmed.
  - `att-1` to `att-12` : Deploy simulated attack vectors 1 through 12.
  - `sudo <cmd>` : Execute privileged commands using password `AWT-0211`.
  - `clear` : Clear terminal screen.

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
