from fastapi import APIRouter, Request, HTTPException, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.services.agents_service import black_agent, dark_agent, red_agent
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/agents", tags=["Autonomous Agents (Black & Dark)"])


class DarkAuthRequest(BaseModel):
    code: str

class DarkToggleRequest(BaseModel):
    code: str
    activate: Optional[bool] = None

class ShieldToggleRequest(BaseModel):
    activate: Optional[bool] = None

class DeviceReleaseRequest(BaseModel):
    device_key: Optional[str] = None
    release_all: Optional[bool] = False
    code: Optional[str] = None


@router.get("/status")
def get_agents_status():
    """
    Returns real-time status of both Black Agent (Shield & Monitoring)
    and Dark Agent (Deception & Device Lock).
    """
    black_st = black_agent.get_status(dark_agent.is_active)
    dark_st = dark_agent.get_status()
    return {
        "black_agent": black_st,
        "dark_agent": dark_st,
        # Backward compatibility alias
        "red_agent": dark_st
    }


@router.get("/black/status")
def get_black_agent_status():
    """
    Returns full port defenses, firewall rules, and blocked attacks for Black Agent.
    """
    return black_agent.get_status(dark_agent.is_active)


@router.post("/black/toggle")
async def toggle_black_agent_shield(payload: Optional[ShieldToggleRequest] = None):
    """
    Manually switches Black Agent perimeter shield ON or OFF.
    When OFF, attacks succeed into the system and demo data is sent to the attacker.
    """
    act = payload.activate if payload else None
    result = black_agent.toggle_shield(act)

    try:
        await ws_manager.broadcast_event({
            "type": "BLACK_AGENT_TOGGLED",
            "is_active": black_agent.is_active,
            "status": black_agent.status,
            "message": result["message"]
        })
    except Exception:
        pass

    return result


@router.get("/dark/status")
def get_dark_agent_status():
    """
    Returns status, active locked devices, and footprints for Dark Agent.
    """
    return dark_agent.get_status()


@router.get("/red/status")
def get_red_agent_status_compat():
    """Backward compatibility alias for Dark Agent status."""
    return dark_agent.get_status()


@router.post("/dark/auth")
def authenticate_dark_code(payload: DarkAuthRequest):
    """
    Validates Dark Agent security code (Mani02).
    """
    is_valid = dark_agent.verify_code(payload.code)
    if not is_valid:
        raise HTTPException(status_code=403, detail="Invalid Dark Agent authorization code.")
    return {
        "success": True,
        "message": "Dark Agent authorization granted."
    }


@router.post("/dark/toggle")
async def toggle_dark_agent(payload: DarkToggleRequest):
    """
    Activates or deactivates Dark Agent using the Dark Code (Mani02).
    When active:
      - Black Agent shield is suppressed.
      - Attackers ingress into honey decoy.
      - Serves isolated decoy honeypot payload.
      - Attacker devices get locked.
    When deactivated:
      - Black Agent resumes perimeter shield.
      - All locked attacker devices are automatically released.
    """
    result = dark_agent.toggle_activation(payload.code, payload.activate)
    if not result.get("success"):
        raise HTTPException(status_code=403, detail=result.get("message"))

    # Broadcast status change via WebSocket
    try:
        await ws_manager.broadcast_event({
            "type": "DARK_AGENT_TOGGLED",
            "is_active": dark_agent.is_active,
            "status": dark_agent.status,
            "message": result.get("message")
        })
    except Exception:
        pass

    return result


@router.post("/dark/release-device")
async def release_attacker_device(payload: DeviceReleaseRequest):
    """
    Remotely releases a locked attacker device (e.g. mobile phone browser)
    or releases all devices.
    """
    if payload.release_all:
        result = dark_agent.release_all_devices()
    elif payload.device_key:
        result = dark_agent.release_device(payload.device_key, payload.code)
        if not result.get("success"):
            raise HTTPException(status_code=404, detail=result.get("message"))
    else:
        raise HTTPException(status_code=400, detail="Must provide device_key or release_all=true.")

    # Broadcast unlock to WebSocket so attacker's browser unlocks immediately
    try:
        await ws_manager.broadcast_event({
            "type": "DARK_DEVICE_RELEASED",
            "device_key": payload.device_key,
            "release_all": payload.release_all
        })
    except Exception:
        pass

    return result


@router.get("/dark/lock-status")
def check_device_lock_status(request: Request, client_ip: Optional[str] = None):
    """
    Endpoint polled by attacker devices (e.g. mobile phones) to check if their browser
    is currently locked under Dark Agent control.
    """
    detected_ip = client_ip or request.headers.get("x-forwarded-for") or (request.client.host if request.client else "192.168.1.8")
    return dark_agent.check_device_lock_status(detected_ip)


@router.post("/dark/counter-strike")
@router.post("/red/counter-strike")
async def trigger_manual_counter_strike(request: Request):
    """
    Directly triggers a Dark Agent counter-strike simulation targeting the caller's IP/device,
    locking the attacker device browser.
    """
    client_ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else "192.168.1.8")
    user_agent = request.headers.get("user-agent", "Unknown Attacker Device")

    scenario = {
        "id": "direct-counter-strike",
        "title": "Autonomous Dark Agent Takeover & Device Lock",
        "port": 4444,
        "mitre_id": "T1059.004",
        "category": "Counter-Offensive",
        "target_asset": "Attacker Origin Node"
    }

    result = dark_agent.lock_attacker_device(scenario, client_ip, user_agent)

    # Broadcast to WebSocket
    try:
        await ws_manager.broadcast_event({
            "type": "DARK_AGENT_DEVICE_LOCKED",
            "strike": result["counter_strike"],
            "footprint": result["footprint"],
            "device_lock": result["device_lock"]
        })
    except Exception:
        pass

    return {
        "status": "success",
        "message": "Dark Agent counter-strike deployed: Attacker device locked.",
        **result
    }
