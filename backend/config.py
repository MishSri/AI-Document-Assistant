import os
from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    PROJECT_NAME: str = "Document Assistant API"
    DB_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db")
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    
    # API Keys & LLM Settings
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    
    # RAG Settings
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 150
    
    class Config:
        env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"
settings = Settings()
# Ensure directories exist
os.makedirs(settings.DB_DIR, exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)