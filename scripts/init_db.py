import sys
import os
import uuid

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.database.session import engine, SessionLocal, Base
from app.models import (
    Role, User, Asset, DetectionRule, ThreatSource, ThreatIndicator, SystemSetting
)
from app.core.security import get_password_hash
from app.ai.rag_service import RAGService

def initialize_database():
    print(">> Initializing CyberSentinel AI Database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Roles
        roles_data = [
            ("Administrator", "Full system and security policy control", ["all"]),
            ("Security Analyst", "Investigate alerts, triage incidents, submit responses", ["investigate", "respond", "view"]),
            ("Viewer", "Read-only access to dashboards and reports", ["view"])
        ]
        roles_map = {}
        for name, desc, perms in roles_data:
            role = db.query(Role).filter(Role.name == name).first()
            if not role:
                role = Role(
                    id=str(uuid.uuid4()),
                    name=name,
                    description=desc,
                    permissions_json=perms
                )
                db.add(role)
                db.commit()
                db.refresh(role)
            roles_map[name] = role

        print(f"   [+] Verified {len(roles_map)} roles.")

        # 2. Seed Default Users
        default_users = [
            ("admin", "admin@cybersentinel.local", "Admin@CyberSentinel2026!", "Administrator", "Lead SOC Architect"),
            ("analyst", "analyst@cybersentinel.local", "Analyst@CyberSentinel2026!", "Security Analyst", "Senior Cyber Analyst"),
            ("viewer", "viewer@cybersentinel.local", "Viewer@CyberSentinel2026!", "Viewer", "Compliance Auditor")
        ]
        for uname, email, pwd, rname, fname in default_users:
            u = db.query(User).filter(User.username == uname).first()
            if not u:
                u = User(
                    id=str(uuid.uuid4()),
                    username=uname,
                    email=email,
                    hashed_password=get_password_hash(pwd),
                    full_name=fname,
                    role_id=roles_map[rname].id,
                    is_active=True
                )
                db.add(u)
                db.commit()
                print(f"   [+] Created default user: {uname} ({rname})")

        # 3. Seed Assets
        if db.query(Asset).count() == 0:
            assets = [
                ("DC-CORP-01", "10.0.0.10", "Domain Controller", "Critical", "Windows Server 2022", "IT Infrastructure"),
                ("DB-PROD-SQL", "10.0.0.25", "Database", "Critical", "Ubuntu Linux 24.04", "Engineering"),
                ("WEB-PORTAL-01", "10.0.0.40", "Web Server", "High", "Debian Linux 12", "E-Commerce"),
                ("WS-FINANCE-07", "10.0.1.105", "Workstation", "Medium", "Windows 11 Pro", "Finance Department"),
                ("FW-EDGE-GW01", "192.168.1.1", "Firewall", "Critical", "PFSense / BSD", "Network Operations")
            ]
            for host, ip, atype, crit, os_name, dept in assets:
                a = Asset(
                    id=str(uuid.uuid4()),
                    hostname=host,
                    ip_address=ip,
                    asset_type=atype,
                    criticality=crit,
                    os=os_name,
                    department=dept,
                    status="Online"
                )
                db.add(a)
            db.commit()
            print("   [+] Seeded enterprise critical assets.")

        # 4. Seed Detection Rules
        if db.query(DetectionRule).count() == 0:
            rules = [
                ("Repeated Failed Authentication Threshold", "threshold", {"field": "failed_attempts", "operator": ">=", "value": 5}, "High", "Flags brute-force attempts with 5+ failures"),
                ("Lateral Port Scan Sweep", "threshold", {"field": "distinct_ports_scanned", "operator": ">=", "value": 10}, "Medium", "Detects internal reconnaissance sweeps"),
                ("Mass Egress Data Transfer", "threshold", {"field": "bytes_out", "operator": ">=", "value": 10000000}, "Critical", "Detects massive data exfiltration over TCP"),
                ("Privilege Escalation Indicator", "pattern", {"pattern": "sudo: 3 incorrect password attempts"}, "High", "Detects unauthorized sudo attempts on Linux")
            ]
            for rname, rtype, cond, sev, desc in rules:
                rule = DetectionRule(
                    id=str(uuid.uuid4()),
                    name=rname,
                    rule_type=rtype,
                    condition_expression=cond,
                    severity=sev,
                    description=desc,
                    is_enabled=True
                )
                db.add(rule)
            db.commit()
            print("   [+] Seeded Layer 1 detection rules.")

        # 5. Seed Threat Intelligence Indicators
        if db.query(ThreatIndicator).count() == 0:
            source = ThreatSource(
                id=str(uuid.uuid4()),
                name="CyberSentinel Local Cyber Feed",
                url="local://threat-intel/curated.json",
                is_local=True,
                description="Internally verified IoC signatures and known adversarial infrastructure"
            )
            db.add(source)
            db.commit()

            iocs = [
                ("ip", "185.220.101.5", 95.0, "Cobalt Strike C2", "T1071", "Known Tor Exit Node & Command and Control Gateway"),
                ("ip", "45.154.255.89", 88.0, "Mirai Botnet", "T1046", "Aggressive brute-force scanner targeting SSH/Telnet"),
                ("domain", "evil-auth-verification.com", 90.0, "Phishing Infrastructure", "T1566", "Credential harvesting portal masquerading as SSO"),
                ("domain", "update-service-telemetry.ru", 92.0, "RedLine Stealer", "T1048", "Data exfiltration destination for infostealer malware"),
                ("sha256", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", 85.0, "Trojan Dropper", "T1204", "Malicious executable payload detected in phishing campaign")
            ]
            for itype, ival, score, fam, tech, idesc in iocs:
                ind = ThreatIndicator(
                    id=str(uuid.uuid4()),
                    indicator_type=itype,
                    indicator_value=ival,
                    threat_score=score,
                    malware_family=fam,
                    mitre_technique=tech,
                    description=idesc,
                    confidence="High",
                    source_id=source.id
                )
                db.add(ind)
            db.commit()
            print("   [+] Seeded threat intelligence IoC feeds.")

        # 6. Seed RAG Knowledge Documents
        RAGService.seed_initial_knowledge(db)
        print("   [+] Seeded local RAG MITRE ATT&CK knowledge documents.")

        print(">> Database initialization complete!")

    finally:
        db.close()

if __name__ == "__main__":
    initialize_database()
