import re
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional

class EventNormalizer:
    """
    Parses and normalizes security telemetry from disparate log formats:
    - Linux auth.log / syslog (sshd, sudo)
    - Windows Security Events (EventID 4624, 4625, 4672, 7045)
    - Network Flow Records (NetFlow, Suricata)
    - Generic JSON
    """

    PORT_SERVICE_MAP = {
        21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
        80: "HTTP", 110: "POP3", 135: "MSRPC", 139: "NetBIOS",
        443: "HTTPS", 445: "SMB", 1433: "MSSQL", 1521: "Oracle",
        3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL", 8080: "HTTP-Proxy",
        8443: "HTTPS-Alt", 9001: "Tor-Relay"
    }

    @classmethod
    def compute_event_hash(cls, raw_log: str, timestamp_str: str, source_ip: str) -> str:
        canonical = f"{raw_log.strip()}|{timestamp_str}|{source_ip}"
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    @classmethod
    def parse_linux_auth(cls, log: str) -> Dict[str, Any]:
        """
        Parses sshd failed password, accepted password, sudo commands.
        e.g. 'Oct 12 14:32:01 server1 sshd[1234]: Failed password for invalid user root from 192.168.1.100 port 54321 ssh2'
        """
        payload = {
            "source_type": "linux_auth",
            "event_category": "Authentication",
            "source_port": 54321,
            "destination_port": 22,
            "protocol": "TCP",
            "failed_attempts": 0,
            "is_root": False
        }

        # IP extraction
        ip_match = re.search(r"from\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", log)
        if ip_match:
            payload["source_ip"] = ip_match.group(1)

        # Port extraction
        port_match = re.search(r"port\s+([0-9]+)", log)
        if port_match:
            payload["source_port"] = int(port_match.group(1))

        if "Failed password" in log:
            payload["failed_attempts"] = 1
            payload["severity"] = "Medium"
            payload["status"] = "FAILURE"
        elif "Accepted password" in log or "Accepted publickey" in log:
            payload["status"] = "SUCCESS"
            payload["severity"] = "Low"

        if "user root" in log or "for root" in log:
            payload["is_root"] = True

        if "sudo:" in log:
            payload["event_category"] = "Privilege"
            payload["is_root"] = True
            payload["severity"] = "High" if "incorrect password" in log else "Medium"

        return payload

    @classmethod
    def parse_windows_event(cls, log: str) -> Dict[str, Any]:
        """
        Parses Windows Security Event XML/string formats.
        e.g. 'EventID: 4625 An account failed to log on. Account: Administrator, Source IP: 10.0.0.45'
        """
        payload = {
            "source_type": "windows_event",
            "event_category": "Authentication",
            "protocol": "TCP",
            "destination_port": 445,
            "failed_attempts": 0,
            "is_root": False
        }

        ip_match = re.search(r"Source (?:IP|Network Address):\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", log)
        if ip_match:
            payload["source_ip"] = ip_match.group(1)

        if "4625" in log:
            payload["failed_attempts"] = 1
            payload["severity"] = "Medium"
            payload["status"] = "LOGON_FAILURE"
        elif "4624" in log:
            payload["status"] = "LOGON_SUCCESS"
            payload["severity"] = "Low"

        if "Administrator" in log or "SYSTEM" in log:
            payload["is_root"] = True

        return payload

    @classmethod
    def parse_network_flow(cls, log: str) -> Dict[str, Any]:
        """
        Parses NetFlow or Suricata format.
        e.g. 'FLOW 192.168.1.50:49210 -> 10.0.0.5:443 PROTO=TCP BYTES_OUT=15420000 BYTES_IN=2048'
        """
        payload = {
            "source_type": "network_flow",
            "event_category": "Network",
            "protocol": "TCP",
            "bytes_in": 1024,
            "bytes_out": 2048,
            "distinct_ports_scanned": 1
        }

        flow_match = re.search(r"([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+):([0-9]+)\s*->\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+):([0-9]+)", log)
        if flow_match:
            payload["source_ip"] = flow_match.group(1)
            payload["source_port"] = int(flow_match.group(2))
            payload["destination_ip"] = flow_match.group(3)
            payload["destination_port"] = int(flow_match.group(4))

        bytes_out_match = re.search(r"BYTES_OUT=([0-9]+)", log)
        if bytes_out_match:
            payload["bytes_out"] = int(bytes_out_match.group(1))

        bytes_in_match = re.search(r"BYTES_IN=([0-9]+)", log)
        if bytes_in_match:
            payload["bytes_in"] = int(bytes_in_match.group(1))

        return payload

    @classmethod
    def normalize(cls, raw_log: str, source_type: str = "json", initial_payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        initial = initial_payload.copy() if initial_payload else {}

        if source_type == "linux_auth" or "sshd" in raw_log or "sudo:" in raw_log:
            parsed = cls.parse_linux_auth(raw_log)
        elif source_type == "windows_event" or "EventID:" in raw_log or "4625" in raw_log:
            parsed = cls.parse_windows_event(raw_log)
        elif source_type == "network_flow" or "FLOW" in raw_log:
            parsed = cls.parse_network_flow(raw_log)
        else:
            parsed = {
                "source_type": source_type,
                "event_category": initial.get("event_category", "Authentication"),
                "severity": initial.get("severity", "Low"),
                "protocol": initial.get("protocol", "TCP"),
                "source_ip": initial.get("source_ip", "192.168.1.100"),
                "destination_ip": initial.get("destination_ip", "10.0.0.1"),
                "source_port": initial.get("source_port", 49210),
                "destination_port": initial.get("destination_port", 80),
                "failed_attempts": initial.get("failed_attempts", 0),
                "bytes_in": initial.get("bytes_in", 500),
                "bytes_out": initial.get("bytes_out", 1200),
                "is_root": initial.get("is_root", False),
                "distinct_ports_scanned": initial.get("distinct_ports_scanned", 1)
            }

        # Merge parsed with initial inputs (initial takes precedence if explicit)
        merged = {**parsed, **initial}

        # Service name lookup
        dst_port = merged.get("destination_port", 80)
        merged["service_name"] = cls.PORT_SERVICE_MAP.get(dst_port, "Unknown")

        # Private vs Public IP identification
        src_ip = merged.get("source_ip", "")
        merged["is_internal_source"] = src_ip.startswith("10.") or src_ip.startswith("192.168.") or src_ip.startswith("172.16.")

        return merged
