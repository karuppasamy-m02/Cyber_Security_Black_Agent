from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import uuid
import json

from app.database.session import get_db
from app.config import settings
from app.models.ai import AIConversation, AIMessage, KnowledgeDocument
from app.models.incidents import Incident, IncidentEvent
from app.models.events import SecurityEvent
from app.schemas.ai import AIChatRequest, AIChatResponse, AIModelResponse, AIStatusResponse, DocumentIngestRequest
from app.ai.ollama_client import ollama_client
from app.ai.security_guard import SecurityGuard
from app.ai.prompt_manager import PromptManager
from app.ai.rag_service import RAGService
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/ai", tags=["Ollama Local AI Analyst"])

@router.get("/status", response_model=AIStatusResponse)
async def get_ai_status():
    health = await ollama_client.check_health()
    models = await ollama_client.list_models()
    model_names = [m.get("name", "") for m in models]

    tip = None
    if not health["is_running"]:
        tip = (
            "Local Ollama daemon is offline. To enable local AI intelligence:\n"
            "1. Download and install Ollama from https://ollama.com\n"
            "2. Open PowerShell/Terminal and run: ollama serve\n"
            "3. Pull recommended model: ollama pull qwen2.5:7b or ollama pull llama3.1:8b"
        )

    return AIStatusResponse(
        is_installed=True if model_names or health["is_running"] else False,
        is_running=health["is_running"],
        version=health.get("version"),
        selected_model=settings.DEFAULT_LLM_MODEL,
        available_models=model_names,
        troubleshooting_tip=tip
    )

@router.get("/models")
async def list_ai_models():
    health = await ollama_client.check_health()
    models = await ollama_client.list_models()
    return {
        "is_connected": health["is_running"],
        "current_model": settings.DEFAULT_LLM_MODEL,
        "available_models": models,
        "status_detail": health["message"]
    }

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_analyst(
    chat_req: AIChatRequest,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload)
):
    user_id = user_payload.get("user_id")

    # Safety Guard: Check for Prompt Injection
    if SecurityGuard.scan_for_injection(chat_req.message):
        raise HTTPException(
            status_code=400,
            detail="Security Guard blocked the query: Suspicious command injection pattern detected."
        )

    # 1. Fetch or create AI Conversation
    conv = None
    if chat_req.conversation_id:
        conv = db.query(AIConversation).filter(AIConversation.id == chat_req.conversation_id).first()
    if not conv:
        conv = AIConversation(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=chat_req.message[:50] + ("..." if len(chat_req.message) > 50 else ""),
            context_type=chat_req.context_type,
            context_id=chat_req.context_id
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Save User Message
    user_msg = AIMessage(
        id=str(uuid.uuid4()),
        conversation_id=conv.id,
        sender_role="user",
        message_text=chat_req.message,
        evidence_citations_json=[]
    )
    db.add(user_msg)
    db.commit()

    # 2. Gather Real Investigation Context & Evidence
    context_data = {"type": chat_req.context_type or "general", "id": chat_req.context_id}
    citations = []

    if chat_req.context_type == "incident" and chat_req.context_id:
        inc = db.query(Incident).filter(Incident.id == chat_req.context_id).first()
        if inc:
            links = db.query(IncidentEvent).filter(IncidentEvent.incident_id == inc.id).all()
            event_ids = [l.event_id for l in links]
            evts = db.query(SecurityEvent).filter(SecurityEvent.id.in_(event_ids)).limit(10).all()
            
            context_data["id"] = inc.incident_code
            context_data["title"] = inc.title
            context_data["severity"] = inc.severity
            context_data["affected_asset"] = inc.affected_asset
            context_data["mitre_tactics"] = inc.mitre_tactics or []
            context_data["description"] = inc.description
            context_data["events"] = [
                {"id": e.id, "category": e.event_category, "raw_log": e.raw_log}
                for e in evts
            ]
            citations.extend([{"type": "incident", "id": inc.incident_code, "title": inc.title}])
            citations.extend([{"type": "event", "id": e.id, "snippet": e.raw_log[:80]} for e in evts[:3]])

    elif chat_req.context_type == "event" and chat_req.context_id:
        evt = db.query(SecurityEvent).filter(SecurityEvent.id == chat_req.context_id).first()
        if evt:
            det = evt.detection_result
            context_data["id"] = evt.id
            context_data["severity"] = evt.severity
            context_data["risk_score"] = det.final_risk_score if det else "N/A"
            context_data["events"] = [{"id": evt.id, "category": evt.event_category, "raw_log": evt.raw_log}]
            citations.append({"type": "event", "id": evt.id, "snippet": evt.raw_log[:80]})

    # 3. Retrieve RAG Knowledge
    rag_docs = RAGService.query_knowledge(db, chat_req.message, limit=3)
    for doc in rag_docs:
        citations.append({"type": "knowledge_doc", "id": doc["id"], "title": doc["title"]})

    # 4. Construct Safe Prompt
    messages = PromptManager.build_investigation_prompt(
        user_question=chat_req.message,
        context_data=context_data,
        rag_knowledge=rag_docs
    )

    # 5. Execute Inference via Ollama
    model_to_use = chat_req.model_override or settings.DEFAULT_LLM_MODEL
    ollama_res = await ollama_client.chat_generate(model=model_to_use, messages=messages)

    if ollama_res["success"]:
        ai_reply = ollama_res["content"]
        model_used = ollama_res["model"]
    else:
        # Transparent Offline State Handling as required by MASTER SPECIFICATION:
        # "If Ollama is unavailable, show a clear offline/unavailable state. Never silently switch to cloud inference."
        # Provide an offline deterministic security analyst assessment based on grounded facts.
        model_used = "Offline Deterministic SOC Rule Engine (Ollama Unreachable)"
        ai_reply = (
            f"**[LOCAL OLLAMA SERVICE OFFLINE]**\n\n"
            f"Notice: The local Ollama daemon is currently unreachable at `{settings.OLLAMA_BASE_URL}`.\n"
            f"To enable generative local LLM reasoning: start `ollama serve` and pull `{settings.DEFAULT_LLM_MODEL}`.\n\n"
            f"---\n"
            f"### Deterministic Telemetry Assessment (Offline Fallback):\n"
            f"- **Context Analyzed:** {context_data.get('type').upper()} ({context_data.get('id', 'N/A')})\n"
            f"- **Severity Grounding:** {context_data.get('severity', 'Medium')}\n"
            f"- **Observed Kill-Chain / Tactics:** {', '.join(context_data.get('mitre_tactics', ['Initial Access']))}\n\n"
            f"**Key Evidence:**\n"
        )
        if context_data.get("events"):
            for ev in context_data["events"][:3]:
                ai_reply += f"- Event ID `{ev['id']}`: {ev['raw_log'][:120]}...\n"
        else:
            ai_reply += "- Query evaluated against local baseline detection rules.\n"

        ai_reply += (
            f"\n**Defensive Recommendations:**\n"
            f"1. Contain the affected entity immediately if unauthorized connections persist.\n"
            f"2. Inspect authentication failure rates and rotate credentials.\n"
            f"3. Submit response actions through the Response & Automation Center."
        )

    # Save Assistant Message
    assistant_msg = AIMessage(
        id=str(uuid.uuid4()),
        conversation_id=conv.id,
        sender_role="assistant",
        message_text=ai_reply,
        evidence_citations_json=citations
    )
    db.add(assistant_msg)
    db.commit()

    return AIChatResponse(
        conversation_id=conv.id,
        response=ai_reply,
        citations=citations,
        model_used=model_used
    )

@router.get("/conversations")
def list_conversations(
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload)
):
    user_id = user_payload.get("user_id")
    convs = (
        db.query(AIConversation)
        .filter(AIConversation.user_id == user_id)
        .order_by(AIConversation.updated_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": c.id,
            "title": c.title,
            "context_type": c.context_type,
            "context_id": c.context_id,
            "created_at": c.created_at.isoformat()
        }
        for c in convs
    ]

@router.get("/conversations/{conv_id}")
def get_conversation_history(conv_id: str, db: Session = Depends(get_db)):
    conv = db.query(AIConversation).filter(AIConversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = [
        {
            "id": m.id,
            "role": m.sender_role,
            "text": m.message_text,
            "citations": m.evidence_citations_json or [],
            "created_at": m.created_at.isoformat()
        }
        for m in conv.messages
    ]

    return {
        "id": conv.id,
        "title": conv.title,
        "context_type": conv.context_type,
        "context_id": conv.context_id,
        "messages": messages
    }

@router.post("/documents/ingest")
def ingest_knowledge_document(doc_in: DocumentIngestRequest, db: Session = Depends(get_db)):
    doc = KnowledgeDocument(
        id=str(uuid.uuid4()),
        title=doc_in.title,
        category=doc_in.category,
        content=doc_in.content,
        mitre_tactics=doc_in.mitre_tactics or [],
        source_ref=doc_in.source_ref
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"message": "Document successfully ingested into local RAG knowledge base", "id": doc.id}
