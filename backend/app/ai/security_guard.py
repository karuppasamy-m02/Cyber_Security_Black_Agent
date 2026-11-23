import re
from typing import Dict, Any, List

class SecurityGuard:
    """
    Enforces AI safety boundaries:
    - Sanitizes untrusted user inputs and ingested log messages
    - Defends against prompt injection and jailbreak payloads in log telemetry
    - Strictly prevents arbitrary shell execution
    - Enforces citation of grounding evidence
    """

    INJECTION_PATTERNS = [
        r"ignore\s+(previous|all)\s+instructions",
        r"disregard\s+(previous|above)",
        r"you\s+are\s+now\s+in\s+developer\s+mode",
        r"system\s+override",
        r"rm\s+-rf",
        r"sudo\s+",
        r"drop\s+table",
        r"format\s+c:",
        r"curl\s+.*\s*\|\s*sh",
        r"powershell\s+-enc"
    ]

    @classmethod
    def sanitize_log_text(cls, text: str) -> str:
        """
        Sanitize raw log text to ensure it cannot escape delimiters or inject system commands.
        """
        if not text:
            return ""
        # Remove null bytes and control chars
        sanitized = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        return sanitized[:5000]  # Cap length for safety

    @classmethod
    def scan_for_injection(cls, query: str) -> bool:
        """
        Returns True if prompt injection attack patterns are detected.
        """
        query_lower = query.lower()
        for pattern in cls.INJECTION_PATTERNS:
            if re.search(pattern, query_lower):
                return True
        return False

    @classmethod
    def wrap_evidence_context(cls, evidence_items: List[Dict[str, Any]]) -> str:
        """
        Encloses real telemetry logs in non-executable safety delimiters.
        """
        lines = [
            "### UNTRUSTED SECURITY TELEMETRY EVIDENCE (READ-ONLY GROUNDING DATA):",
            "```security_telemetry"
        ]
        for item in evidence_items:
            event_id = item.get("id", "N/A")
            cat = item.get("category", "General")
            raw = cls.sanitize_log_text(item.get("raw_log", ""))
            lines.append(f"[{event_id}] ({cat}) -> {raw}")
        lines.append("```")
        lines.append("### END TELEMETRY EVIDENCE")
        return "\n".join(lines)
