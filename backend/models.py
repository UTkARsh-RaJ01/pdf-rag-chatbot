from pydantic import BaseModel
from typing import List, Optional


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str
    chat_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = []


class UploadResponse(BaseModel):
    message: str
    files_processed: int
    total_chunks: int


class HealthResponse(BaseModel):
    status: str
    message: str
