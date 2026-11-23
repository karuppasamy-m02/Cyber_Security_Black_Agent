import os
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.ai import KnowledgeDocument
import logging

logger = logging.getLogger("cybersentinel.ai.rag")

class RAGService:
    """
    Local RAG retrieval service using local SQLite knowledge document store.
    Provides offline, local threat playbook and MITRE ATT&CK context.
    """

    @classmethod
    def query_knowledge(cls, db: Session, query: str, limit: int = 4) -> List[Dict[str, Any]]:
        query_terms = [t.lower() for t in query.replace(",", " ").split() if len(t) > 2]
        if not query_terms:
            docs = db.query(KnowledgeDocument).limit(limit).all()
        else:
            # Fallback search across title, content, mitre_tactics
            all_docs = db.query(KnowledgeDocument).all()
            scored = []
            for d in all_docs:
                text_to_search = f"{d.title} {d.category} {d.content} {' '.join(d.mitre_tactics or [])}".lower()
                matches = sum(1 for term in query_terms if term in text_to_search)
                if matches > 0:
                    scored.append((matches, d))
            scored.sort(key=lambda x: x[0], reverse=True)
            docs = [item[1] for item in scored[:limit]]

        return [
            {
                "id": d.id,
                "title": d.title,
                "category": d.category,
                "content": d.content,
                "mitre_tactics": d.mitre_tactics,
                "source_ref": d.source_ref
            }
            for d in docs
        ]

    @classmethod
    def seed_initial_knowledge(cls, db: Session):
        """
        Seeds baseline MITRE ATT&CK techniques and incident playbooks if empty.
        """
        if db.query(KnowledgeDocument).count() > 0:
            return

        initial_kb = [
            {
                "title": "T1110 - Brute Force Authentication",
                "category": "mitre_attack",
                "mitre_tactics": ["Credential Access", "T1110", "T1110.001"],
                "source_ref": "MITRE ATT&CK Matrix v14",
                "content": (
                    "Adversaries may use brute force techniques to attempt credential guessing. "
                    "Detection: Monitor for high frequencies of Event ID 4625 (Windows) or sshd 'Failed password' (Linux). "
                    "Containment: Rate-limit or temporarily blacklist source IP, lock targeted account if threshold exceeds 5 attempts, "
                    "and enforce Multi-Factor Authentication (MFA)."
                )
            },
            {
                "title": "T1046 - Network Service Scanning",
                "category": "mitre_attack",
                "mitre_tactics": ["Discovery", "T1046"],
                "source_ref": "MITRE ATT&CK Matrix v14",
                "content": (
                    "Adversaries may attempt to get a listing of services running on remote hosts. "
                    "Detection: Rapid SYN packets across multiple destination ports (22, 80, 443, 445, 3389, 8080) from a single IP. "
                    "Containment: Dynamic firewall drop rule for the scanning IP, inspect edge perimeter routing, check for unauthorized scanning tools."
                )
            },
            {
                "title": "T1078 - Valid Accounts & Privilege Escalation",
                "category": "mitre_attack",
                "mitre_tactics": ["Defense Evasion", "Persistence", "Privilege Escalation", "T1078"],
                "source_ref": "MITRE ATT&CK Matrix v14",
                "content": (
                    "Adversaries may obtain and abuse credentials of existing accounts. "
                    "Detection: Successful login followed immediately by sudo privileges, off-hours access, or impossible travel geo-velocity. "
                    "Containment: Invalidate active session tokens, force password reset, review recent sudo logs."
                )
            },
            {
                "title": "T1048 - Exfiltration Over Alternative Protocol",
                "category": "mitre_attack",
                "mitre_tactics": ["Exfiltration", "T1048"],
                "source_ref": "MITRE ATT&CK Matrix v14",
                "content": (
                    "Adversaries may steal data by transferring it through an unencrypted protocol or non-standard outbound channel. "
                    "Detection: Unusually high outbound egress bytes, DNS tunneling patterns, or connections to suspicious foreign ASN ranges. "
                    "Containment: Immediately isolate host at network switch or host agent, terminate active socket connections, quarantine outbound traffic."
                )
            },
            {
                "title": "Playbook: Compromised Host Containment Protocol",
                "category": "playbook",
                "mitre_tactics": ["Incident Response", "Containment"],
                "source_ref": "CyberSentinel SOC SOP-04",
                "content": (
                    "Standard Operating Procedure for Host Isolation:\n"
                    "1. Isolate endpoint from network while preserving volatile RAM.\n"
                    "2. Terminate rogue processes.\n"
                    "3. Snapshot memory and disk for forensic analysis.\n"
                    "4. Invalidate all Kerberos/OAuth/session tokens associated with logged-in users.\n"
                    "5. Notify security team lead."
                )
            }
        ]

        for item in initial_kb:
            doc = KnowledgeDocument(
                title=item["title"],
                category=item["category"],
                content=item["content"],
                mitre_tactics=item["mitre_tactics"],
                source_ref=item["source_ref"]
            )
            db.add(doc)
        db.commit()
        logger.info(f"Seeded {len(initial_kb)} local knowledge documents into RAG database.")
