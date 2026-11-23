import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database.session import engine, SessionLocal
from app.models import Base
from app.websocket.manager import ws_manager

# Import API Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.events import router as events_router
from app.api.v1.detection import router as detection_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.threat_intel import router as threat_intel_router
from app.api.v1.ai import router as ai_router
from app.api.v1.models import router as models_router
from app.api.v1.response import router as response_router
from app.api.v1.system import router as system_router
from app.api.v1.attacks import router as attacks_router
from app.api.v1.agents import router as agents_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cybersentinel")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables created
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("CYBER BLACK backend service initialized successfully.")
    yield
    logger.info("CYBER BLACK backend shutting down.")

app = FastAPI(
    title="CYBER BLACK",
    description="CYBER BLACK: Intelligent Defense. Explainable Intelligence. Local AI. Enterprise SOC Intelligence Platform.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in dev environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(events_router, prefix=settings.API_V1_PREFIX)
app.include_router(detection_router, prefix=settings.API_V1_PREFIX)
app.include_router(incidents_router, prefix=settings.API_V1_PREFIX)
app.include_router(threat_intel_router, prefix=settings.API_V1_PREFIX)
app.include_router(ai_router, prefix=settings.API_V1_PREFIX)
app.include_router(models_router, prefix=settings.API_V1_PREFIX)
app.include_router(response_router, prefix=settings.API_V1_PREFIX)
app.include_router(system_router, prefix=settings.API_V1_PREFIX)
app.include_router(attacks_router, prefix=settings.API_V1_PREFIX)
app.include_router(agents_router, prefix=settings.API_V1_PREFIX)

# WebSocket Endpoints
@app.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await ws_manager.connect_events(websocket)
    try:
        while True:
            # Keep-alive heartbeat listener
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_events(websocket)

@app.websocket("/ws/incidents")
async def websocket_incidents_endpoint(websocket: WebSocket):
    await ws_manager.connect_incidents(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_incidents(websocket)

@app.websocket("/ws/system")
async def websocket_system_endpoint(websocket: WebSocket):
    await ws_manager.connect_system(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_system(websocket)

@app.get("/")
def root():
    return {
        "product": "CyberSentinel AI",
        "tagline": "Intelligent Defense. Explainable Intelligence. Local AI.",
        "status": "OPERATIONAL",
        "api_docs": "/docs"
    }
