# PDF RAG Chatbot

A production-ready RAG chatbot for querying PDF documents.

## Features

- 📄 Upload multiple PDFs with drag-and-drop
- 🤖 Chat with AI about your documents
- 🔄 Switchable embeddings (HuggingFace local or Google API)
- 🎨 Beautiful dark mode UI
- 🚀 Docker & Render ready

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: FastAPI, LangChain
- **LLM**: Google Gemini 2.5 Flash
- **Embeddings**: HuggingFace (local) or Google
- **Vector DB**: Pinecone

---

## Quick Start (Local)

### Backend
```bash
cd backend
pip install -r requirements.txt
# Create .env with PINECONE_API_KEY, PINECONE_INDEX_NAME, GOOGLE_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## Render Deployment (Free)

### Prerequisites
- GitHub account with this code pushed
- Render account (https://render.com)
- Pinecone index (dimension: 768)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/pdf-rag-chatbot.git
git push -u origin main
```

### Step 2: Deploy Backend

1. Go to https://dashboard.render.com
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `pdf-rag-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
5. Add Environment Variables:
   - `PINECONE_API_KEY` = your key
   - `PINECONE_INDEX_NAME` = `pdf-rag-index`
   - `GOOGLE_API_KEY` = your key
6. Click **Create Web Service**
7. Wait for deploy → Copy URL (e.g., `https://pdf-rag-backend.onrender.com`)

### Step 3: Deploy Frontend

1. Click **New** → **Static Site**
2. Connect same repository
3. Configure:
   - **Name**: `pdf-rag-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL` = your backend URL from Step 2
5. Click **Create Static Site**
6. Your app is live! 🎉

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

## Notes

- Backend uses HuggingFace embeddings by default (no API quota issues)
- HuggingFace model is pre-downloaded in Docker image (~420MB)
- First request after cold start may take ~30s

## License

MIT
