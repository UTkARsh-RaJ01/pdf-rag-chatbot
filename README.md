# PDF RAG Chatbot

A production-ready RAG (Retrieval-Augmented Generation) chatbot for querying PDF documents.

## Features

- 📄 Upload multiple PDFs with drag-and-drop
- 🤖 Chat with AI about your documents
- 🔄 Switchable embeddings (HuggingFace local or Google API)
- 🎨 Beautiful dark mode UI
- 🚀 Docker & Railway ready

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: FastAPI, LangChain
- **LLM**: Google Gemini 2.5 Flash
- **Embeddings**: HuggingFace (local) or Google
- **Vector DB**: Pinecone

---

## Quick Start (Local Development)

### 1. Setup Backend
```bash
cd backend
pip install -r requirements.txt

# Create .env file with:
# PINECONE_API_KEY=your_key
# PINECONE_INDEX_NAME=pdf-rag-index
# GOOGLE_API_KEY=your_key

uvicorn main:app --reload --port 8000
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Open http://localhost:3000

---

## Docker Deployment

### Local Docker Compose
```bash
# Create .env file in root with your keys
docker-compose up --build
```

---

## Railway Deployment

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository with this code
- Pinecone index (dimension: 768)

### Step 1: Deploy Backend

1. Go to Railway → New Project → Deploy from GitHub
2. Select your repository
3. Set **Root Directory**: `backend`
4. Add Environment Variables:
   - `PINECONE_API_KEY` - Your Pinecone key
   - `PINECONE_INDEX_NAME` - `pdf-rag-index`
   - `GOOGLE_API_KEY` - Your Google Gemini key
5. Deploy → Get public URL (e.g., `https://backend-xxx.railway.app`)

### Step 2: Deploy Frontend

1. Create new service in same project
2. Select your repository
3. Set **Root Directory**: `frontend`
4. Add Build Arguments:
   - `VITE_API_URL` - Your backend URL from Step 1
5. Deploy → Generate domain

### HuggingFace on Railway

✅ **Works automatically!** The Docker image pre-downloads the HuggingFace model during build, so:
- No API key needed
- Fast cold starts
- Runs completely in the Railway container

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PINECONE_API_KEY` | ✅ | Pinecone API key |
| `PINECONE_INDEX_NAME` | ✅ | Index name (dimension: 768) |
| `GOOGLE_API_KEY` | ✅ | Google Gemini API key |
| `VITE_API_URL` | ✅ (frontend) | Backend URL |

---

## Pinecone Index Setup

Create an index at https://app.pinecone.io with:
- **Name**: `pdf-rag-index`
- **Dimension**: `768`
- **Metric**: `cosine`

---

## License

MIT
