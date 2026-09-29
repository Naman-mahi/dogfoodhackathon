# DOGFOOD Deployment & Operations Guide

## 1. Single-Port Appliance Overview

DOGFOOD runs as a unified, self-contained Docker container operating on a **single port (`8080`)**. All internal sub-systems (PostgreSQL daemon, FastAPI backend, and Next.js web application) run concurrently inside the container boundary orchestrated by `entrypoint.sh`.

---

## 2. Production Docker Deployment

### 2.1 Using Docker Compose (Recommended)
```bash
# Clone the repository
git clone https://github.com/example/dogfoodhackathon.git
cd dogfoodhackathon

# Build and start in background
docker compose up --build -d

# Verify container status
docker compose ps
```

### 2.2 Using Standalone Docker
```bash
# 1. Build the production image
docker build -t dogfood-portal:latest .

# 2. Run container mapped to port 8080 with persistent data volume
docker run -d \
  --name dogfood-portal \
  -p 8080:8080 \
  -v dogfood_pgdata:/var/lib/postgresql/data \
  --restart unless-stopped \
  dogfood-portal:latest
```

---

## 3. Environment Configuration (`.env`)

The platform ships with sensible defaults in `.env`:

```ini
# Platform Port & Host Configuration
PORT=8080
HOST=0.0.0.0
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://dogfood:dogfood@127.0.0.1:5432/dogfood
POSTGRES_USER=dogfood
POSTGRES_PASSWORD=dogfood
POSTGRES_DB=dogfood

# Security & Sessions
SECRET_KEY=dogfood-zero-trust-secret-key-2026-production
SESSION_COOKIE_NAME=dogfood_session
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Scoring Calibration Parameter
BAYES_SHRINKAGE_K=2.0
```

---

## 4. Container Startup & Entrypoint Sequence

When the container starts, `/app/entrypoint.sh` executes the following deterministic lifecycle:
1. **PostgreSQL Daemon**: Verifies if the data volume contains an existing cluster. If empty, runs `initdb` and creates the `dogfood` role and database.
2. **Database Migration & Seeding**: Runs `init_db()` and `seed_database()` idempotently. If data already exists, skips destructive reseeding to preserve user data.
3. **FastAPI Backend**: Launches Uvicorn listening on `127.0.0.1:8000`. Polls `/docs` until ready.
4. **Next.js Web Server**: Starts the production Next.js server listening on `0.0.0.0:8080` (PID 1).

---

## 5. Backup & Disaster Recovery

### 5.1 Backing Up Database
```bash
docker exec dogfood-portal su - postgres -c "pg_dump -U dogfood dogfood" > dogfood_backup_$(date +%F).sql
```

### 5.2 Restoring Database
```bash
docker exec -i dogfood-portal su - postgres -c "psql -U dogfood dogfood" < dogfood_backup.sql
```

---

## 6. Health Checks & Diagnostics

- **Web Portal**: `GET http://localhost:8080/` $\rightarrow$ `HTTP 200`
- **Interactive Swagger Docs**: `GET http://localhost:8080/docs` $\rightarrow$ `HTTP 200`
- **API Spec**: `GET http://localhost:8080/openapi.json` $\rightarrow$ `HTTP 200`
- **Container Logs**:
  ```bash
  docker logs -f dogfood-portal
  ```
