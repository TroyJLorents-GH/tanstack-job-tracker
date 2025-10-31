# ---------- Builder: install deps & build wheels ----------
    FROM python:3.11-slim AS builder
    WORKDIR /app
    
    # Build tools only in the builder
    RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc build-essential \
      && rm -rf /var/lib/apt/lists/*
    
    # Faster, cleaner installs
    ENV PIP_NO_CACHE_DIR=1
    COPY server/requirements.txt .
    RUN pip install --upgrade pip \
     && pip install -r requirements.txt
    
    # ---------- Runtime: no compilers, just what we need ----------
    FROM python:3.11-slim
    
    # Good defaults: unbuffer logs, no .pyc, smaller layers
    ENV PYTHONUNBUFFERED=1 \
        PYTHONDONTWRITEBYTECODE=1 \
        PIP_NO_CACHE_DIR=1
    
    # Apply security updates to the base OS layer
    RUN apt-get update && apt-get -y upgrade && rm -rf /var/lib/apt/lists/*
    
    # Bring in site-packages and Python binaries from builder
    COPY --from=builder /usr/local /usr/local
    
    WORKDIR /app
    COPY server/ .
    
    # Make startup script executable
    RUN chmod +x /app/start.sh
    
    EXPOSE 8080
    # Use PORT env var if set, otherwise default to 8080
    ENV PORT=8080
    CMD ["/app/start.sh"]
    