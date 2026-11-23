from typing import List, Dict, Any
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger("cybersentinel.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_event_connections: List[WebSocket] = []
        self.active_incident_connections: List[WebSocket] = []
        self.active_system_connections: List[WebSocket] = []

    async def connect_events(self, websocket: WebSocket):
        await websocket.accept()
        self.active_event_connections.append(websocket)
        logger.info(f"Client connected to /ws/events (Total: {len(self.active_event_connections)})")

    def disconnect_events(self, websocket: WebSocket):
        if websocket in self.active_event_connections:
            self.active_event_connections.remove(websocket)

    async def broadcast_event(self, data: Dict[str, Any]):
        payload = json.dumps(data)
        for connection in list(self.active_event_connections):
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error broadcasting event: {e}")
                self.disconnect_events(connection)

    async def connect_incidents(self, websocket: WebSocket):
        await websocket.accept()
        self.active_incident_connections.append(websocket)

    def disconnect_incidents(self, websocket: WebSocket):
        if websocket in self.active_incident_connections:
            self.active_incident_connections.remove(websocket)

    async def broadcast_incident(self, data: Dict[str, Any]):
        payload = json.dumps(data)
        for connection in list(self.active_incident_connections):
            try:
                await connection.send_text(payload)
            except Exception as e:
                self.disconnect_incidents(connection)

    async def connect_system(self, websocket: WebSocket):
        await websocket.accept()
        self.active_system_connections.append(websocket)

    def disconnect_system(self, websocket: WebSocket):
        if websocket in self.active_system_connections:
            self.active_system_connections.remove(websocket)

    async def broadcast_system(self, data: Dict[str, Any]):
        payload = json.dumps(data)
        for connection in list(self.active_system_connections):
            try:
                await connection.send_text(payload)
            except Exception:
                self.disconnect_system(connection)

ws_manager = ConnectionManager()
