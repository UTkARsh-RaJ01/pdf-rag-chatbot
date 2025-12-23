from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
import logging

from models import ChatRequest, ChatResponse, UploadResponse, HealthResponse
from rag_service import get_rag_service, RAGService, EmbeddingProvider
from config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PDF RAG Chatbot API",
    description="RAG API for chatting with PDF documents",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EmbeddingProviderRequest(BaseModel):
    provider: str


class EmbeddingProviderResponse(BaseModel):
    provider: str
    message: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="healthy", message="API is running")


@app.get("/settings/embedding-provider")
async def get_embedding_provider(rag_service: RAGService = Depends(get_rag_service)):
    return {"provider": rag_service.get_embedding_provider().value}


@app.post("/settings/embedding-provider", response_model=EmbeddingProviderResponse)
async def set_embedding_provider(
    request: EmbeddingProviderRequest,
    rag_service: RAGService = Depends(get_rag_service)
):
    try:
        provider = EmbeddingProvider(request.provider.lower())
        rag_service.set_embedding_provider(provider)
        return EmbeddingProviderResponse(
            provider=provider.value,
            message=f"Embedding provider set to {provider.value}"
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid provider. Use 'google' or 'huggingface'"
        )


@app.post("/upload", response_model=UploadResponse)
async def upload_pdfs(
    files: List[UploadFile] = File(...),
    rag_service: RAGService = Depends(get_rag_service)
):
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.filename}. Only PDF files are accepted."
            )
    
    try:
        filenames = [f.filename for f in files]
        total_chunks = await rag_service.process_pdfs(files, filenames)
        logger.info(f"Processed {len(files)} files, created {total_chunks} chunks")
        
        return UploadResponse(
            message="Files processed successfully",
            files_processed=len(files),
            total_chunks=total_chunks
        )
    except Exception as e:
        logger.error(f"Error processing PDFs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    rag_service: RAGService = Depends(get_rag_service)
):
    try:
        history = []
        if request.chat_history:
            history = [{"role": msg.role, "content": msg.content} for msg in request.chat_history]
        
        result = await rag_service.chat(request.question, history)
        
        return ChatResponse(
            answer=result["answer"],
            sources=result["sources"]
        )
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/clear-history")
async def clear_history(rag_service: RAGService = Depends(get_rag_service)):
    rag_service.clear_memory()
    return {"message": "Conversation history cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
