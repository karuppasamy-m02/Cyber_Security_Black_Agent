from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
import logging
from app.websocket.manager import ws_manager

logger = logging.getLogger("cybersentinel.agents")

# -------------------------------------------------------------
# DUMMY DATA DECEPTION TEMPLATES (FOR RED AGENT HONEYPOT)
# -------------------------------------------------------------
DECEPTION_DUMMY_DATA = {
    "ssh-brute-force": {
        "status": "ACCEPTED_HONEYPOT",
        "deception_type": "DECOY_CREDENTIAL_FEED",
        "fake_response": "Login accepted on decoy gateway node 3. Session token: DECOY-AUTH-77319-XF",
        "decoy_files": [
            "/etc/shadow.decoy (root:$6$decoy_salt$981hjasd7812kjh:19420:0:99999:7:::)",
            "/root/.ssh/authorized_keys (CANARY_TOKEN_9921_ACTIVATED)"
        ],
        "honey_trap_triggered": "CANARY_TOKEN_ACCESSED"
    },
    "internal-port-scan": {
        "status": "ACCEPTED_HONEYPOT",
        "deception_type": "VIRTUAL_HONEYNET_PORTS",
        "fake_response": "Port scan acknowledged. 19 virtual honeypot services spawned with synthetic banners.",
        "decoy_services": [
            {"port": 21, "banner": "ProFTPD 1.3.5 Decoy Honeypot"},
            {"port": 80, "banner": "Apache/2.4.41 Decoy Enterprise Portal"},
            {"port": 3306, "banner": "5.7.33-decoy-MySQL Canary Database"},
            {"port": 8080, "banner": "Jenkins 2.235 Decoy Automation"}
        ],
        "honey_trap_triggered": "NETWORK_SWEEP_GEO_TRAPPED"
    },
    "data-exfiltration": {
        "status": "ACCEPTED_HONEYPOT",
        "deception_type": "POISONED_TELEMETRY_INJECTION",
        "fake_response": "Exfiltration channel hijacked. Injected 24.8 MB of poisoned dummy records with digital watermarks.",
        "decoy_files": [
            "financial_q4_decoy_CANARY.xlsx (Contains tracking beacons)",
            "customer_database_dump_synthetic.sql (Watermarked fake PII)"
        ],
        "honey_trap_triggered": "WATERMARK_BEACON_DISPATCHED"
    },
    "privilege-escalation": {
        "status": "ACCEPTED_HONEYPOT",
        "deception_type": "SANDBOXED_ROOT_CONTAINMENT",
        "fake_response": "Sudo request granted inside sandboxed deception container. Attacker confined to virtual jail.",
        "decoy_shell": "root@prod-decoy-sandbox:~# (Jailed environment: UID 0 mock root)",
        "honey_trap_triggered": "CONTAINER_JAIL_ENGAGED"
    },
    "sql-injection": {
        "status": "ACCEPTED_HONEYPOT",
        "deception_type": "SYNTHETIC_DATABASE_DUMP",
        "fake_response": "SQL query returned 500 synthetic decoy records. Canary tokens embedded.",
        "decoy_tables": [
            {"username": "admin_honey", "password_hash": "$2b$12$decoyHashForAttackerTracer999", "role": "sysadmin"},
            {"username": "cfo_canary", "password_hash": "$2b$12$canaryHashBeaconTrigger100", "role": "finance"}
        ],
        "honey_trap_triggered": "SQL_CANARY_TRIPWIRE"
    },
    "ransomware-sim": {
        "status": "ACCEPTED_HONEYPOT",
        "deception_type": "SHADOW_CANARY_TRAP",
        "fake_response": "Simulated ransomware redirected to isolated shadow volume. 0 production assets affected.",
        "decoy_files": [
            "/decoy_shares/corporate_docs_canary.bin",
            "/decoy_shares/database_backups_canary.bak"
        ],
        "honey_trap_triggered": "RANSOM_SHADOW_LOCKDOWN"
    },
    "ddos-syn-flood": {
        "status": "ACCEPTED_HONEYPOT",
        "deception_type": "SINKHOLE_TRAFFIC_DEFLECTION",
        "fake_response": "Volumetric traffic absorbed by Red Agent scrubbing sinkhole. Origin socket mapped.",
        "sinkhole_node": "198.51.100.254 [BLACK_HOLE_SINKHOLE]",
        "honey_trap_triggered": "SYN_FLOOD_SINKHOLED"
    }
}

class BlackAgentService:
    """
    AGENT 1: BLACK AGENT - The Autonomous Shield & Gateway Fortress.
    Protects all perimeter gateways, all core network ports, and detects/blocks attacks.
    """
    def __init__(self):
        self.status = "ONLINE & SHIELD ARMED"
        self.protected_ports = [
            {"port": 22, "service": "SSH / Remote Mgmt", "status": "SECURED", "policy": "DROP_UNAUTH"},
            {"port": 80, "service": "HTTP Web Traffic", "status": "SECURED", "policy": "WAF_INSPECT"},
            {"port": 443, "service": "HTTPS Secure Gateway", "status": "SECURED", "policy": "TLS_ZERO_TRUST"},
            {"port": 8000, "service": "Core API Gateway", "status": "SECURED", "policy": "RATE_LIMIT_STRICT"},
            {"port": 5173, "service": "SOC Command Console", "status": "SECURED", "policy": "RBAC_ENFORCED"},
            {"port": 3306, "service": "MySQL Database", "status": "SECURED", "policy": "INTERNAL_VLAN_ONLY"},
            {"port": 5432, "service": "PostgreSQL Analytics", "status": "SECURED", "policy": "LOCAL_SOCKET_ONLY"},
            {"port": 8080, "service": "Internal Proxy Gateway", "status": "SECURED", "policy": "ANOMALY_FILTER"},
            {"port": 53, "service": "DNS Threat Shield", "status": "SECURED", "policy": "DNS_SINKHOLE_ACTIVE"}
        ]
        self.total_attacks_blocked = 0
        self.recent_blocks: List[Dict[str, Any]] = []

    def record_defense(self, scenario: Dict[str, Any], client_ip: str) -> Dict[str, Any]:
        self.total_attacks_blocked += 1
        port = scenario.get("port", 80)
        action = {
            "id": str(uuid.uuid4())[:8],
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S UTC"),
            "target_port": port,
            "blocked_ip": client_ip or scenario.get("source_ip", "Unknown"),
            "attack_type": scenario.get("title", "Cyber Attack"),
            "mitre_id": scenario.get("mitre_id", "T1000"),
            "action": "GATEWAY_DROP_RULE_ENFORCED",
            "firewall_rule": f"IPTABLES -A INPUT -s {client_ip or scenario.get('source_ip')} -p tcp --dport {port} -j DROP",
            "defense_layer": "Black Agent Perimeter Gateway Shield"
        }
        self.recent_blocks.insert(0, action)
        if len(self.recent_blocks) > 20:
            self.recent_blocks.pop()
        return action

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": "BLACK AGENT",
            "role": "Autonomous Shield & Gateway Fortress",
            "status": self.status,
            "total_blocked": self.total_attacks_blocked,
            "protected_ports": self.protected_ports,
            "active_policies": [
                "PERIMETER_GATEWAY_LOCKDOWN",
                "REALTIME_IPTABLES_DROP",
                "PORT_ZERO_TRUST_VERIFICATION",
                "AMTIE_5_LAYER_AI_ENFORCEMENT"
            ],
            "recent_blocks": self.recent_blocks[:5]
        }


class RedAgentService:
    """
    AGENT 2: RED AGENT - Autonomous Deception, Footprint Tracker & Reverse Counter-Strike.
    Accepts attacks into honeypot, feeds realistic dummy data, traces the attacker's footprint,
    and executes an autonomous Counter-Strike payload back to the attacker!
    """
    def __init__(self):
        self.status = "HONEYPOT & COUNTER-STRIKE ARMED"
        self.total_deceptions_served = 0
        self.total_counter_strikes = 0
        self.tracked_footprints: List[Dict[str, Any]] = []
        self.counter_strikes: List[Dict[str, Any]] = []

    def execute_deception_and_counter_strike(
        self,
        scenario: Dict[str, Any],
        client_ip: str,
        user_agent: str
    ) -> Dict[str, Any]:
        self.total_deceptions_served += 1
        self.total_counter_strikes += 1

        scenario_id = scenario.get("id", "generic-attack")
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")

        # 1. Fetch or generate dummy data response
        dummy_info = DECEPTION_DUMMY_DATA.get(scenario_id, {
            "status": "ACCEPTED_HONEYPOT",
            "deception_type": "SYNTHETIC_CANARY_PAYLOAD",
            "fake_response": "Attack payload accepted into decoy honeypot. Synthetic data stream returned.",
            "decoy_files": ["decoy_system_log.canary", "mock_telemetry_dump.enc"],
            "honey_trap_triggered": "CANARY_TOKEN_ACTIVATED"
        })

        # 2. Extract and record Attacker Footprint
        device_type = "Mobile Device" if any(k in user_agent.lower() for k in ["android", "iphone", "mobile"]) else "Desktop Workstation"
        footprint = {
            "id": str(uuid.uuid4())[:8],
            "timestamp": now_str,
            "attacker_ip": client_ip or scenario.get("source_ip", "192.168.1.8"),
            "target_port": scenario.get("port", 80),
            "target_asset": scenario.get("target_asset", "Core Infrastructure"),
            "user_agent": user_agent or "Mozilla/5.0 (Mobile Offensive Client)",
            "device_type": device_type,
            "attack_vector": scenario.get("title", "Host Exploit"),
            "mitre_id": scenario.get("mitre_id", "T1000"),
            "trace_status": "100% IDENTIFIED & PINPOINTED",
            "fingerprint_hash": f"FP-{uuid.uuid4().hex[:12].upper()}"
        }
        self.tracked_footprints.insert(0, footprint)
        if len(self.tracked_footprints) > 20:
            self.tracked_footprints.pop()

        # 3. Formulate Counter-Strike
        counter_exploit = {
            "id": str(uuid.uuid4())[:8],
            "timestamp": now_str,
            "target_attacker_ip": client_ip or scenario.get("source_ip", "192.168.1.8"),
            "counter_technique": f"REVERSE-T{scenario.get('mitre_id', 'T1059')}",
            "counter_vector": f"Active Counter-Offensive: Reverse Socket Hijack & Screen Override",
            "payload_injected": f"REVERSE_PAYLOAD_DEPLOY: Mirroring {scenario.get('category')} vector back to origin port {scenario.get('port', 80)}",
            "execution_status": "COUNTER_EXPLOIT_DEPLOYED",
            "screen_takeover_triggered": True,
            "attacker_device": device_type
        }
        self.counter_strikes.insert(0, counter_exploit)
        if len(self.counter_strikes) > 20:
            self.counter_strikes.pop()

        return {
            "dummy_data": dummy_info,
            "footprint": footprint,
            "counter_strike": counter_exploit
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": "RED AGENT",
            "role": "Autonomous Honeypot, Deception & Counter-Strike",
            "status": self.status,
            "total_deceptions": self.total_deceptions_served,
            "total_counter_strikes": self.total_counter_strikes,
            "recent_footprints": self.tracked_footprints[:5],
            "recent_counter_strikes": self.counter_strikes[:5]
        }


# Singleton instances
black_agent = BlackAgentService()
red_agent = RedAgentService()
