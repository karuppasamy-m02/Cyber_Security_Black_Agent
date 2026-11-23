from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AIChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    context_type: Optional[str] = None  # incident, event, general
    context_id: Optional[str] = None
    model_override: Optional[str] = None

class AIChatResponse(BaseModel):
    conversation_id: str
    response: str
    citations: List[Dict[str, Any]] = []
    model_used: str

class AIModelResponse(BaseModel):
    available_models: List[Dict[str, Any]]
    current_model: str
    is_connected: bool
    status_detail: str

class AIStatusResponse(BaseModel):
    is_installed: bool
    is_running: bool
    version: Optional[str] = None
    selected_model: str
    available_models: List[str] = []
    troubleshooting_tip: Optional[str] = None

class DocumentIngestRequest(BaseModel):
    title: str
    category: str
    content: str
    mitre_tactics: Optional[List[str]] = []
    source_ref: Optional[str] = None
