FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV BACKEND_URL=http://127.0.0.1:8000
ENV DATABASE_URL=postgresql+psycopg2://dogfood:dogfood@127.0.0.1:5432/dogfood
ENV FIXTURES_PATH=/app/fixtures.json

# Install PostgreSQL, Python 3, pip, curl, build essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql \
    postgresql-contrib \
    python3 \
    python3-pip \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 1. Install Backend Dependencies
COPY src/backend/requirements.txt /app/backend/
RUN pip3 install --no-cache-dir --break-system-packages -r /app/backend/requirements.txt

# Copy Backend Source
COPY src/backend /app/backend/

# 2. Install Frontend Dependencies & Build Next.js Bundle
COPY src/frontend/package.json /app/frontend/
RUN cd /app/frontend && npm install --include=dev

COPY src/frontend /app/frontend/
RUN cd /app/frontend && npm run build

# 3. Copy Shared Fixtures
COPY fixtures.json /app/fixtures.json
# NOTE: .env files are NOT baked into the image.
# Inject secrets at runtime via docker-compose environment: or --env-file.

# 4. Copy Entrypoint Script
COPY entrypoint.sh /app/entrypoint.sh
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
