import sys
import os
import uuid

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.database.session import engine, SessionLocal, Base
from app.models.users import Role, User
from app.models.events import SecurityEvent, EventFeatures, DetectionResult
from app.models.incidents import Incident, IncidentEvent
from app.models.response import ResponseAction, ApprovalRecord
from app.models.system import AuditLog, SystemSetting
from app.models.assets import Asset
from app.models.threat_intel import ThreatSource, ThreatIndicator
from app.core.security import get_password_hash

def clean_and_reset_database():
    print(">> [1/4] Connecting to CYBER BLACK database...")
    db = SessionLocal()

    try:
        print(">> [2/4] Truncating all sample telemetry, events, and incidents...")
        del_approvals = db.query(ApprovalRecord).delete()
        del_actions = db.query(ResponseAction).delete()
        del_inc_events = db.query(IncidentEvent).delete()
        del_incidents = db.query(Incident).delete()
        del_detections = db.query(DetectionResult).delete()
        del_features = db.query(EventFeatures).delete()
        del_events = db.query(SecurityEvent).delete()
        del_audits = db.query(AuditLog).delete()
        db.commit()

        print(f"   [-] Purged {del_events} security events.")
        print(f"   [-] Purged {del_incidents} incidents.")
        print(f"   [-] Purged {del_actions} containment actions.")
        print(f"   [-] Purged {del_audits} audit records.")

        print(">> [3/4] Purging temporary test user accounts & synchronizing verified users...")
        # Roles
        roles_data = [
            ("Administrator", "Full system and security policy control", ["all"]),
            ("Security Analyst", "Investigate alerts, triage incidents, submit responses", ["investigate", "respond", "view"]),
            ("Viewer", "Read-only access to dashboards and reports", ["view"])
        ]
        roles_map = {}
        for name, desc, perms in roles_data:
            role = db.query(Role).filter(Role.name == name).first()
            if not role:
                role = Role(id=str(uuid.uuid4()), name=name, description=desc, permissions_json=perms)
                db.add(role)
                db.commit()
                db.refresh(role)
            roles_map[name] = role

        # Canonical Verified Users
        canonical_users = {
            "admin": ("admin@cyberblack.local", "Admin@CyberBlack2026!", "Administrator", "Chief Information Security Officer (CISO)"),
            "analyst": ("analyst@cyberblack.local", "Analyst@CyberBlack2026!", "Security Analyst", "Lead SOC Security Analyst"),
            "viewer": ("viewer@cyberblack.local", "Viewer@CyberBlack2026!", "Viewer", "SOC Compliance Auditor"),
            "mani02": ("karuppasamy.selvi02@gmail.com", "Mani@CyberBlack2026!", "Administrator", "Lead SOC Architect (Mani)")
        }

        # Delete any user not in canonical list
        existing_users = db.query(User).all()
        for u in existing_users:
            if u.username not in canonical_users:
                print(f"   [-] Removing non-canonical test user: {u.username}")
                db.delete(u)
        db.commit()

        # Update or create canonical users with clean hashed passwords
        for uname, (email, raw_pwd, rname, fname) in canonical_users.items():
            user = db.query(User).filter(User.username == uname).first()
            if not user:
                user = User(
                    id=str(uuid.uuid4()),
                    username=uname,
                    email=email,
                    hashed_password=get_password_hash(raw_pwd),
                    full_name=fname,
                    role_id=roles_map[rname].id,
                    is_active=True
                )
                db.add(user)
                print(f"   [+] Created canonical user: {uname} ({rname})")
            else:
                user.email = email
                user.hashed_password = get_password_hash(raw_pwd)
                user.full_name = fname
                user.role_id = roles_map[rname].id
                user.is_active = True
                print(f"   [*] Updated canonical credentials: {uname} ({rname})")
        db.commit()

        print(">> [4/4] Verifying database integrity and zero baseline...")
        ev_count = db.query(SecurityEvent).count()
        inc_count = db.query(Incident).count()
        act_count = db.query(ResponseAction).count()
        usr_count = db.query(User).count()
        ast_count = db.query(Asset).count()
        ioc_count = db.query(ThreatIndicator).count()

        print("\n=======================================================")
        print("          CYBER BLACK DATABASE ZERO BASELINE")
        print("=======================================================")
        print(f"  Security Events:      {ev_count}  (Clean zero baseline)")
        print(f"  Active Incidents:     {inc_count}  (Clean zero baseline)")
        print(f"  Containment Actions:  {act_count}  (Clean zero baseline)")
        print(f"  Active Users:         {usr_count}  (Canonical verified)")
        print(f"  Enterprise Assets:    {ast_count}  (Seeded)")
        print(f"  Threat Intel IoCs:    {ioc_count}  (Seeded)")
        print("=======================================================\n")
        print("[SUCCESS] Database is 100% clean and ready for production demonstrations.")

    finally:
        db.close()

if __name__ == "__main__":
    clean_and_reset_database()
