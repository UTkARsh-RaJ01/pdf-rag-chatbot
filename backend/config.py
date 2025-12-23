import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    pinecone_api_key: str = ""
    pinecone_index_name: str = "pdf-rag-index"
    google_api_key: str = ""
    chunk_size: int = 1000
    chunk_overlap: int = 200
    embedding_model: str = "models/embedding-001"
    llm_model: str = "gemini-2.5-flash"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
