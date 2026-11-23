from typing import Dict, Any, List

class PromptManager:
    SYSTEM_SECURITY_ANALYST = """You are CyberSentinel AI, an advanced Tier-3 SOC Security Analyst and Threat Intelligence Assistant.
Your core objectives:
1. Explain security incidents, anomalies, and multi-layer ML detections with extreme precision.
2. Ground all deductions strictly in actual evidence (logs, timestamps, IPs, MITRE ATT&CK techniques, risk scores).
3. Clearly distinguish between verified FACTUAL EVIDENCE, ANALYTICAL INFERENCE, and DEFENSIVE RECOMMENDATION.
4. Adhere to strict cybersecurity safety rules: Never recommend running destructive or unverified shell commands.
5. Provide actionable, prioritized containment and remediation checklists.
"""

    @classmethod
    def build_investigation_prompt(
        cls,
        user_question: str,
        context_data: Dict[str, Any],
        rag_knowledge: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        messages = [
            {"role": "system", "content": cls.SYSTEM_SECURITY_ANALYST}
        ]

        # Add RAG Knowledge Context if available
        if rag_knowledge:
            kb_text = "### RELEVANT MITRE ATT&CK & THREAT PLAYBOOK KNOWLEDGE:\n"
            for doc in rag_knowledge:
                kb_text += f"- Title: {doc.get('title')}\n  Category: {doc.get('category')}\n  Details: {doc.get('content')}\n"
            messages.append({"role": "system", "content": kb_text})

        # Add Incident/Event Evidence Context
        if context_data:
            from app.ai.security_guard import SecurityGuard
            evidence_summary = (
                f"### CURRENT INVESTIGATION CONTEXT:\n"
                f"- Context Type: {context_data.get('type')}\n"
                f"- Entity/ID: {context_data.get('id')}\n"
                f"- Severity: {context_data.get('severity')}\n"
                f"- Risk Score: {context_data.get('risk_score', 'N/A')}\n"
                f"- MITRE Tactics: {', '.join(context_data.get('mitre_tactics', []))}\n"
                f"- Description: {context_data.get('description', 'N/A')}\n"
            )
            raw_events = context_data.get("events", [])
            if raw_events:
                evidence_summary += "\n" + SecurityGuard.wrap_evidence_context(raw_events)
            messages.append({"role": "system", "content": evidence_summary})

        # User question
        messages.append({"role": "user", "content": user_question})
        return messages

    @classmethod
    def build_incident_report_prompt(cls, incident_data: Dict[str, Any]) -> List[Dict[str, str]]:
        messages = [
            {"role": "system", "content": cls.SYSTEM_SECURITY_ANALYST},
            {
                "role": "user",
                "content": (
                    f"Generate a comprehensive Executive & Technical Incident Report for the following incident:\n"
                    f"Incident Code: {incident_data.get('incident_code')}\n"
                    f"Title: {incident_data.get('title')}\n"
                    f"Severity: {incident_data.get('severity')}\n"
                    f"Affected Asset: {incident_data.get('affected_asset')}\n"
                    f"Tactics: {incident_data.get('mitre_tactics')}\n"
                    f"Include: Executive Summary, Attack Timeline, Technical Root Cause, Impact Assessment, and Recommended Response Playbook."
                )
            }
        ]
        return messages
