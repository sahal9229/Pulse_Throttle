# ==============================================================================
# PulseThrottle v2 — Production Multi-Stage Dockerfile (Render / Cloud Ready)
# ==============================================================================

# ── Stage 1: Compile React Frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/Frontend

# Install dependencies
COPY Frontend/package*.json ./
RUN npm ci || npm install

# Build static bundle to /app/Frontend/dist
COPY Frontend/ ./
RUN npm run build

# ── Stage 2: Python Backend & Static Server ──────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (for psycopg2, TLS certs & healthcheck curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY api_server.py .
COPY Backend/ ./Backend/

# Copy compiled React frontend from Stage 1
COPY --from=frontend-builder /app/Frontend/dist ./Frontend/dist

# Render sets PORT dynamically (default 8000)
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start FastAPI server binding to dynamic Render PORT
CMD ["sh", "-c", "uvicorn api_server:app --host 0.0.0.0 --port ${PORT:-8000}"]
