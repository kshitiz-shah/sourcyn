# ==========================================
# Stage 1: Build Modern React 18 Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Python Backend (FastAPI)
# ==========================================
FROM python:3.12-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    ENVIRONMENT=production \
    PYTHONPATH=/app/backend \
    PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv for lightning-fast Python package installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy backend metadata and install dependencies
COPY backend/pyproject.toml backend/README.md /app/backend/
RUN uv venv /opt/venv && \
    . /opt/venv/bin/activate && \
    uv pip install -e "./backend"

# Copy backend source code
COPY backend /app/backend

# Copy built frontend static distribution
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

ENV PATH="/opt/venv/bin:$PATH"

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
