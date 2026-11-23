import os
from pydantic_settings import BaseSettings
from typing import List

# Resolve project root: d:\Mozhli
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

class Settings(BaseSettings):
    PROJECT_NAME: str = "CYBER BLACK"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_PATH: str = os.path.join(BASE_DIR, "database", "cybersentinel.db")
    DATABASE_URL: str = f"sqlite:///{DATABASE_PATH}"
    ASYNC_DATABASE_URL: str = f"sqlite+aiosqlite:///{DATABASE_PATH}"
    
    # Security
    SECRET_KEY: str = "cybersentinel-secret-key-production-hardening-grade-2026-xyz"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Ollama Local AI
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    DEFAULT_LLM_MODEL: str = "qwen2.5:7b"
    ALTERNATIVE_LLM_MODEL: str = "llama3.1:8b"
    DEFAULT_EMBEDDING_MODEL: str = "nomic-embed-text"
    AI_TIMEOUT_SECONDS: int = 60
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    
    # Storage
    MODEL_ARTIFACTS_DIR: str = os.path.join(BASE_DIR, "ml-engine", "models")
    DATASET_DIR: str = os.path.join(BASE_DIR, "ml-engine", "datasets")
    KNOWLEDGE_BASE_DIR: str = os.path.join(BASE_DIR, "knowledge-base")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
