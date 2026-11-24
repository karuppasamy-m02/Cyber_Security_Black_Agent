from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
import logging
from app.websocket.manager import ws_manager

logger = logging.getLogger("cybersentinel.agents")

# -------------------------------------------------------------
# DEMO DATA DECEPTION TEMPLATES (5 TOTAL TARGET FILES)
# -------------------------------------------------------------
DARK_DEMO_DATA = {
    "status": "ACCEPTED_HONEYPOT",
    "deception_type": "SYNTHETIC_CANARY_DECOY",
    "message": "Decoy container active",
    "target_files_count": 5,
    "decoy_files": [
        "recon_targets.txt",
        "customer_records.csv",
        "api_endpoints.conf",
        "system_architecture.json",
        "audit_log_2026.txt"
    ]
}

class BlackAgentService:
    """
    AGENT 1: BLACK AGENT - The Autonomous Shield & Perimeter Guardian.
    Only protects all perimeter gateways and monitors all security details.
    """
    def __init__(self):
        self.is_active = True
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

    def toggle_shield(self, activate: Optional[bool] = None) -> Dict[str, Any]:
        if activate is None:
            self.is_active = not self.is_active
        else:
            self.is_active = bool(activate)

        self.status = "ONLINE & SHIELD ARMED" if self.is_active else "OFFLINE (PERIMETER SHIELD DOWN)"
        return {
            "success": True,
            "is_active": self.is_active,
            "status": self.status,
            "message": "Black Agent perimeter shield activated." if self.is_active else "Black Agent perimeter shield deactivated. Attacks will succeed and demo data will be served."
        }

    def record_defense(self, scenario: Dict[str, Any], client_ip: str, bypassed_by_dark: bool = False) -> Dict[str, Any]:
        port = scenario.get("port", 80)
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")

        if bypassed_by_dark:
            action = {
                "id": str(uuid.uuid4())[:8],
                "timestamp": now_str,
                "target_port": port,
                "blocked_ip": client_ip or scenario.get("source_ip", "Unknown"),
                "attack_type": scenario.get("title", "Cyber Attack"),
                "mitre_id": scenario.get("mitre_id", "T1000"),
                "action": "GATEWAY_BYPASS_AUTHORIZED_BY_DARK_AGENT",
                "firewall_rule": f"ALLOW_IN_TO_DECOY_HONEYPOT (Port {port})",
                "defense_layer": "Dark Agent Honey-Net Routing (Black Agent Suppressed)"
            }
            return action

        self.total_attacks_blocked += 1
        action = {
            "id": str(uuid.uuid4())[:8],
            "timestamp": now_str,
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

    def get_status(self, is_dark_active: bool = False) -> Dict[str, Any]:
        if not self.is_active:
            effective_status = "OFFLINE (PERIMETER SHIELD DOWN)"
        elif is_dark_active:
            effective_status = "STANDBY / SUPPRESSED BY DARK AGENT"
        else:
            effective_status = "ONLINE & SHIELD ARMED"

        return {
            "name": "BLACK AGENT",
            "role": "Autonomous Defensive Shield & Perimeter Guardian",
            "is_active": self.is_active,
            "status": effective_status,
            "is_suppressed": is_dark_active,
            "total_blocked": self.total_attacks_blocked,
            "protected_ports": self.protected_ports,
            "active_policies": [
                "PERIMETER_GATEWAY_LOCKDOWN",
                "REALTIME_IPTABLES_DROP",
                "PORT_ZERO_TRUST_VERIFICATION",
                "AMTIE_5_LAYER_AI_ENFORCEMENT"
            ] if self.is_active and not is_dark_active else [
                "STANDBY: GATEWAY DEFENSES DIVERTED TO DARK HONEYPOT" if is_dark_active else "SHIELD DOWN: UNAUTHORIZED INGRESS PERMITTED",
                "ZERO-TRUST CANARY ROUTING ENGAGED"
            ],
            "recent_blocks": self.recent_blocks[:5]
        }


class DarkAgentService:
    """
    AGENT 2: DARK AGENT (Formerly Red Agent).
    Secured by Dark Code: Mani02.
    When activated:
      1. Stops/suppresses Black Agent defenses to allow attackers into the decoy honey-net.
      2. Serves synthetic decoy target files to contained attackers.
      3. Traces attacker footprint and path (IP, user agent, mobile/laptop device, ports).
      4. Deploys mini-attack counter-strike: LOCKS the attacker device's browser.
      5. Device browser remains locked until manually released by operator (Mani02) or Dark Agent is turned OFF.
    """
    DARK_CODE = "Mani02"

    def __init__(self):
        self.is_active = False
        self.status = "OFFLINE & DORMANT"
        self.total_deceptions_served = 0
        self.total_counter_strikes = 0
        self.locked_devices: Dict[str, Dict[str, Any]] = {}
        self.tracked_footprints: List[Dict[str, Any]] = []
        self.counter_strikes: List[Dict[str, Any]] = []

    def verify_code(self, code: str) -> bool:
        return code.strip() == self.DARK_CODE

    def toggle_activation(self, code: str, activate: Optional[bool] = None) -> Dict[str, Any]:
        if not self.verify_code(code):
            return {
                "success": False,
                "error": "INVALID_DARK_CODE",
                "message": "Access Denied: Invalid Dark Agent Authorization Code."
            }

        if activate is None:
            self.is_active = not self.is_active
        else:
            self.is_active = bool(activate)

        if self.is_active:
            self.status = "DARK AGENT ACTIVE (Black Agent Suppressed - Honey Decoy Engaged)"
        else:
            self.status = "OFFLINE & DORMANT (Black Agent Resumed Shield)"
            # Automatically release all locked devices when Dark Agent is turned off
            self.release_all_devices()

        return {
            "success": True,
            "is_active": self.is_active,
            "status": self.status,
            "message": "Dark Agent activated. Black Agent defenses paused." if self.is_active else "Dark Agent deactivated. Black Agent perimeter shield restored and all attacker devices released."
        }

    def lock_attacker_device(
        self,
        scenario: Dict[str, Any],
        client_ip: str,
        user_agent: str
    ) -> Dict[str, Any]:
        self.total_deceptions_served += 1
        self.total_counter_strikes += 1

        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")
        is_mobile = any(k in user_agent.lower() for k in ["android", "iphone", "mobile", "ipad"])
        device_type = "Mobile Device (ARM/Android/iOS)" if is_mobile else "Laptop / Workstation Client"
        port = scenario.get("port", 80)
        mitre_id = scenario.get("mitre_id", "T1059.004")
        attack_title = scenario.get("title", "Offensive Exploitation")

        fingerprint_hash = f"FP-DARK-{uuid.uuid4().hex[:10].upper()}"
        trace_path = f"{client_ip} -> Gateway Firewall (Bypassed) -> Honeypot Node :{port} -> Dark Agent Trap Core"

        # Honeypot decoy demo data
        dummy_info = {
            **DARK_DEMO_DATA,
            "timestamp": now_str,
            "target_port": port,
            "status": "HONEYPOT_SYNTHETIC_DATA_SERVED"
        }

        # Attacker Footprint
        footprint = {
            "id": str(uuid.uuid4())[:8],
            "timestamp": now_str,
            "attacker_ip": client_ip or "192.168.1.8",
            "target_port": port,
            "target_asset": scenario.get("target_asset", "Core Infrastructure"),
            "user_agent": user_agent or "Mozilla/5.0 (Mobile Offensive Client)",
            "device_type": device_type,
            "attack_vector": attack_title,
            "mitre_id": mitre_id,
            "trace_status": "LOCKED & CONTROLLED BY DARK AGENT",
            "fingerprint_hash": fingerprint_hash,
            "trace_path": trace_path
        }
        self.tracked_footprints.insert(0, footprint)
        if len(self.tracked_footprints) > 25:
            self.tracked_footprints.pop()

        # Mini Attack Device Lock Record
        device_key = client_ip or "192.168.1.8"
        device_lock_entry = {
            "device_key": device_key,
            "client_ip": device_key,
            "device_type": device_type,
            "user_agent": user_agent,
            "locked_at": now_str,
            "target_port": port,
            "attack_vector": attack_title,
            "mitre_id": mitre_id,
            "fingerprint_hash": fingerprint_hash,
            "trace_path": trace_path,
            "is_locked": True,
            "status": "LOCKED_BY_DARK_AGENT"
        }
        self.locked_devices[device_key] = device_lock_entry

        # Counter-Strike Record
        counter_strike = {
            "id": str(uuid.uuid4())[:8],
            "timestamp": now_str,
            "target_attacker_ip": device_key,
            "counter_technique": f"DARK-LOCK-{mitre_id}",
            "counter_vector": "Mini Attack: Remote Browser Takeover & Lock",
            "payload_injected": "LOCK_DEVICE_BROWSER: Screen Takeover Active",
            "execution_status": "DEVICE_CONTROLLED",
            "screen_takeover_triggered": True,
            "attacker_device": device_type,
            "device_locked": True
        }
        self.counter_strikes.insert(0, counter_strike)
        if len(self.counter_strikes) > 25:
            self.counter_strikes.pop()

        return {
            "dummy_data": dummy_info,
            "footprint": footprint,
            "counter_strike": counter_strike,
            "device_lock": device_lock_entry
        }

    def release_device(self, device_key: str, code: Optional[str] = None) -> Dict[str, Any]:
        if code and not self.verify_code(code):
            return {"success": False, "error": "INVALID_DARK_CODE", "message": "Invalid Dark Code."}

        # Look up device by key or IP
        matched_key = None
        for k in self.locked_devices.keys():
            if k == device_key or self.locked_devices[k].get("client_ip") == device_key:
                matched_key = k
                break

        if matched_key and matched_key in self.locked_devices:
            self.locked_devices[matched_key]["is_locked"] = False
            self.locked_devices[matched_key]["status"] = "RELEASED_BY_OPERATOR"
            self.locked_devices[matched_key]["released_at"] = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")
            return {
                "success": True,
                "device_key": matched_key,
                "message": f"Attacker device {matched_key} has been released from Dark Control."
            }

        return {
            "success": False,
            "error": "DEVICE_NOT_FOUND",
            "message": f"No active device found with identifier {device_key}."
        }

    def release_all_devices(self) -> Dict[str, Any]:
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")
        count = 0
        for k in list(self.locked_devices.keys()):
            if self.locked_devices[k].get("is_locked", False):
                self.locked_devices[k]["is_locked"] = False
                self.locked_devices[k]["status"] = "RELEASED_BY_OPERATOR"
                self.locked_devices[k]["released_at"] = now_str
                count += 1
        return {
            "success": True,
            "count": count,
            "message": f"All {count} attacker devices have been released."
        }

    def check_device_lock_status(self, client_ip: str) -> Dict[str, Any]:
        # If Dark Agent is not even active, device is never locked
        if not self.is_active:
            return {
                "is_locked": False,
                "dark_agent_active": False,
                "status": "UNLOCKED"
            }

        # Check matched device or any actively locked device
        matched = None
        for k, v in self.locked_devices.items():
            if (k == client_ip or v.get("client_ip") == client_ip) and v.get("is_locked", False):
                matched = v
                break

        if not matched:
            active_locked = [v for v in self.locked_devices.values() if v.get("is_locked", False)]
            if active_locked:
                matched = active_locked[-1]

        if matched:
            return {
                "is_locked": True,
                "dark_agent_active": True,
                "device_info": matched,
                "status": "LOCKED_BY_DARK_AGENT"
            }

        return {
            "is_locked": False,
            "dark_agent_active": True,
            "status": "STANDBY_UNLOCKED"
        }

    def get_status(self) -> Dict[str, Any]:
        active_locked = [v for v in self.locked_devices.values() if v.get("is_locked", False)]
        all_devices = list(self.locked_devices.values())
        return {
            "name": "DARK AGENT",
            "role": "Autonomous Honeypot Deception & Attacker Device Control",
            "is_active": self.is_active,
            "status": self.status,
            "dark_code_required": True,
            "total_deceptions": self.total_deceptions_served,
            "total_counter_strikes": self.total_counter_strikes,
            "active_locked_count": len(active_locked),
            "locked_devices": all_devices[:10],
            "recent_footprints": self.tracked_footprints[:5],
            "recent_counter_strikes": self.counter_strikes[:5]
        }


# Singleton instances
black_agent = BlackAgentService()
dark_agent = DarkAgentService()
# Alias for backwards compatibility
red_agent = dark_agent
