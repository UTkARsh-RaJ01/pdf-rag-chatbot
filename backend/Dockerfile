FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download HuggingFace model during build (all-MiniLM-L6-v2, ~80MB, 384 dims)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# Copy application code
COPY . .

# Expose port (Railway uses PORT environment variable)
EXPOSE 8000

# Run the application - Railway injects PORT env var
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
