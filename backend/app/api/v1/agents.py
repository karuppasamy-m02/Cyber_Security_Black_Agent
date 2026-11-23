from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any, List
from app.services.agents_service import black_agent, red_agent
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/agents", tags=["Dual Autonomous Agents (Black & Red)"])

@router.get("/status")
def get_agents_status():
    """
    Returns the real-time operational status of both Black Agent (Shield) and Red Agent (Deception & Counter-Strike).
    """
    return {
        "black_agent": black_agent.get_status(),
        "red_agent": red_agent.get_status()
    }

@router.get("/black/status")
def get_black_agent_status():
    """
    Returns full port defenses, firewall rules, and blocked attacks for Black Agent.
    """
    return black_agent.get_status()

@router.get("/red/status")
def get_red_agent_status():
    """
    Returns honeypot stats, tracked attacker footprints, and counter-strikes for Red Agent.
    """
    return red_agent.get_status()

@router.post("/red/counter-strike")
async def trigger_manual_counter_strike(request: Request):
    """
    Directly triggers a Red Agent counter-strike simulation targeting the caller's IP/device.
    """
    client_ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else "192.168.1.8")
    user_agent = request.headers.get("user-agent", "Unknown Attacker Device")
    
    scenario = {
        "id": "direct-counter-strike",
        "title": "Autonomous Reverse Exploitation Strike",
        "port": 4444,
        "mitre_id": "T1059.004",
        "category": "Counter-Offensive",
        "target_asset": "Attacker Origin Node"
    }
    
    result = red_agent.execute_deception_and_counter_strike(scenario, client_ip, user_agent)
    
    # Broadcast to WebSocket
    try:
        await ws_manager.broadcast_event({
            "type": "RED_AGENT_COUNTER_STRIKE",
            "strike": result["counter_strike"],
            "footprint": result["footprint"]
        })
    except Exception:
        pass
        
    return {
        "status": "success",
        "message": "Red Agent autonomous counter-strike deployed.",
        **result
    }
