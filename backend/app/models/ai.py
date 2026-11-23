import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False, default="Security Investigation Chat")
    context_type = Column(String(50), nullable=True)  # incident, event, general, threat
    context_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.created_at")

class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id"), nullable=False)
    sender_role = Column(String(20), nullable=False)  # user, assistant, system
    message_text = Column(Text, nullable=False)
    evidence_citations_json = Column(JSON, default=list)  # Referenced event IDs, MITRE ATT&CK IDs
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    conversation = relationship("AIConversation", back_populates="messages")

class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False, index=True)
    category = Column(String(50), nullable=False, default="mitre_attack")  # mitre_attack, playbook, security_policy
    content = Column(Text, nullable=False)
    embedding_json = Column(JSON, nullable=True)
    mitre_tactics = Column(JSON, default=list)
    source_ref = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
