import os
import tempfile
import time
from typing import List, Optional
from enum import Enum

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from pinecone import Pinecone

from config import get_settings
import logging

logger = logging.getLogger(__name__)


class EmbeddingProvider(str, Enum):
    GOOGLE = "google"
    HUGGINGFACE = "huggingface"


class RAGService:
    def __init__(self):
        self.settings = get_settings()
        self.pc = None
        self.embeddings = None
        self.llm = None
        self.vector_store = None
        self.retriever = None
        self.prompt = None
        self.chat_history = []
        self._initialized = False
        self._embedding_provider = EmbeddingProvider.HUGGINGFACE
    
    def set_embedding_provider(self, provider: EmbeddingProvider):
        if provider != self._embedding_provider:
            self._embedding_provider = provider
            self._initialized = False
            logger.info(f"Switched embedding provider to: {provider}")
    
    def get_embedding_provider(self) -> EmbeddingProvider:
        return self._embedding_provider
    
    def _ensure_initialized(self):
        if self._initialized:
            return
        
        try:
            self._init_pinecone()
            self._init_embeddings()
            self._init_llm()
            self._init_vector_store()
            self._init_chain()
            self._initialized = True
            logger.info(f"RAG Service initialized with {self._embedding_provider} embeddings")
        except Exception as e:
            logger.error(f"Failed to initialize RAG Service: {e}")
            raise
    
    def _init_pinecone(self):
        self.pc = Pinecone(api_key=self.settings.pinecone_api_key)
        existing_indexes = [idx.name for idx in self.pc.list_indexes()]
        logger.info(f"Available Pinecone indexes: {existing_indexes}")
        
        if self.settings.pinecone_index_name not in existing_indexes:
            raise ValueError(
                f"Pinecone index '{self.settings.pinecone_index_name}' not found. "
                f"Available indexes: {existing_indexes}. "
                "Please create it in the Pinecone console with dimension 768."
            )
    
    def _init_embeddings(self):
        if self._embedding_provider == EmbeddingProvider.GOOGLE:
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model=self.settings.embedding_model,
                google_api_key=self.settings.google_api_key
            )
            logger.info("Using Google Generative AI Embeddings")
        else:
            from langchain_huggingface import HuggingFaceEmbeddings
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-mpnet-base-v2",
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
            logger.info("Using HuggingFace Embeddings (all-mpnet-base-v2, 768 dims)")
    
    def _init_llm(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=self.settings.google_api_key,
            temperature=0.3
        )
    
    def _init_vector_store(self):
        self.vector_store = PineconeVectorStore(
            index_name=self.settings.pinecone_index_name,
            embedding=self.embeddings,
            pinecone_api_key=self.settings.pinecone_api_key
        )
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 4})
    
    def _init_chain(self):
        template = """You are a helpful AI assistant that answers questions based on the provided context from PDF documents.

Context from documents:
{context}

Chat History:
{chat_history}

Human Question: {question}

Instructions:
- Answer the question based on the context provided
- If you cannot find the answer in the context, say so honestly
- Be concise but thorough
- Reference specific parts of the documents when relevant

AI Response:"""
        
        self.prompt = ChatPromptTemplate.from_template(template)
    
    def _format_docs(self, docs):
        return "\n\n".join(doc.page_content for doc in docs)
    
    def _format_history(self, history):
        if not history:
            return "No previous conversation."
        return "\n".join([f"{msg['role'].upper()}: {msg['content']}" for msg in history])
    
    def _get_text_splitter(self) -> RecursiveCharacterTextSplitter:
        return RecursiveCharacterTextSplitter(
            chunk_size=self.settings.chunk_size,
            chunk_overlap=self.settings.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    async def process_pdfs(self, files, filenames: List[str]) -> int:
        self._ensure_initialized()
        
        all_chunks = []
        text_splitter = self._get_text_splitter()
        
        for file, filename in zip(files, filenames):
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                content = await file.read()
                tmp.write(content)
                tmp_path = tmp.name
            
            try:
                loader = PyPDFLoader(tmp_path)
                documents = loader.load()
                
                for doc in documents:
                    doc.metadata["source"] = filename
                
                chunks = text_splitter.split_documents(documents)
                all_chunks.extend(chunks)
                logger.info(f"Processed {filename}: {len(documents)} pages, {len(chunks)} chunks")
            finally:
                os.unlink(tmp_path)
        
        if all_chunks:
            self.vector_store.add_documents(all_chunks)
            logger.info(f"Added {len(all_chunks)} chunks to vector store")
        
        return len(all_chunks)
    
    async def chat(self, question: str, chat_history: List[dict] = None) -> dict:
        self._ensure_initialized()
        
        docs = self.retriever.invoke(question)
        context = self._format_docs(docs)
        history_str = self._format_history(chat_history or [])
        
        chain = self.prompt | self.llm | StrOutputParser()
        
        max_retries = 3
        base_delay = 5
        
        for attempt in range(max_retries):
            try:
                response = chain.invoke({
                    "context": context,
                    "chat_history": history_str,
                    "question": question
                })
                break
            except Exception as e:
                error_msg = str(e).lower()
                if "quota" in error_msg or "rate" in error_msg or "429" in error_msg or "resource_exhausted" in error_msg:
                    if attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt)
                        logger.warning(f"Rate limited, retrying in {delay}s (attempt {attempt + 1}/{max_retries})")
                        time.sleep(delay)
                    else:
                        logger.error(f"Gemini API quota exhausted after {max_retries} retries")
                        raise Exception(
                            "Google Gemini API quota exhausted. Please wait a few minutes and try again."
                        )
                else:
                    raise
        
        sources = []
        for doc in docs:
            source = doc.metadata.get("source", "Unknown")
            if source not in sources:
                sources.append(source)
        
        return {
            "answer": response,
            "sources": sources
        }
    
    def clear_memory(self):
        self.chat_history = []


_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service


def reset_rag_service():
    global _rag_service
    _rag_service = None
