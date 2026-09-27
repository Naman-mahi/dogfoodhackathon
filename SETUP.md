# DOGFOOD Platform — Setup & Deployment Guide

This document provides complete instructions for setting up, running, and developing the **DOGFOOD Hackathon Evaluation Platform** both via containerized Docker deployment (recommended) and bare-metal local development.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Single-Command Docker Deployment (Recommended)](#single-command-docker-deployment-recommended)
3. [Local Development Setup (Bare-Metal)](#local-development-setup-bare-metal)
   - [Database Setup (PostgreSQL)](#1-database-setup-postgresql)
   - [Backend Setup (FastAPI & Python 3.11+)](#2-backend-setup-fastapi)
   - [Frontend Setup (Next.js 16 & Node.js 20+)](#3-frontend-setup-nextjs)
4. [Test Personas & Pre-Seeded Logins](#test-personas--pre-seeded-logins)
5. [Automated Verification & Acceptance Testing](#automated-verification--acceptance-testing)
6. [Environment Variables Reference](#environment-variables-reference)

---

## Prerequisites

- **Docker & Docker Compose** (Recommended): Docker Desktop 4.25+ or Docker Engine with Docker Compose v2.
- **Node.js**: v20.x or v22.x LTS (for frontend development).
- **Python**: v3.11 or v3.12 (for backend development).
- **PostgreSQL**: v15 or v16 (if running database outside Docker).
- **Git**: For version control.

---

## Single-Command Docker Deployment (Recommended)

The entire platform runs as an offline-capable appliance on a **single port (`8080`)**:

### Option A: Using Docker Compose
```bash
docker compose up --build
```

### Option B: Building and Running the Dockerfile Directly
```bash
# Build the unified image
docker build -t dogfood-portal:latest .

# Run container on port 8080
docker run -d --name dogfood-portal -p 8080:8080 dogfood-portal:latest
```

Once started, the following services are live on `http://localhost:8080`:
- **Web Application Portal:** [http://localhost:8080](http://localhost:8080)
- **Public Hackathons:** [http://localhost:8080/hackathons](http://localhost:8080/hackathons)
- **Public Project Gallery:** [http://localhost:8080/projects](http://localhost:8080/projects)
- **Calibration Leaderboard:** [http://localhost:8080/results](http://localhost:8080/results)
- **Interactive API Documentation:** [http://localhost:8080/docs](http://localhost:8080/docs)
- **OpenAPI Schema:** [http://localhost:8080/openapi.json](http://localhost:8080/openapi.json)

---

## Local Development Setup (Bare-Metal)

If you wish to run the backend and frontend separately for development:

### 1. Database Setup (PostgreSQL)
Ensure PostgreSQL is running locally on port `5432`:
```sql
CREATE DATABASE dogfood;
CREATE USER dogfood WITH PASSWORD 'dogfood';
GRANT ALL PRIVILEGES ON DATABASE dogfood TO dogfood;
```

### 2. Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd src/backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations & seed fixtures
python seed.py

# Launch FastAPI backend on port 8000
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be accessible at:
- API Root: `http://127.0.0.1:8000`
- Swagger UI Docs: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup (Next.js)
```bash
# Navigate to frontend directory
cd src/frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Frontend will run at `http://localhost:8080` (configured via `next.config.mjs` with transparent proxy rewrites to `http://127.0.0.1:8000/api`).

---

## Test Personas & Pre-Seeded Logins

The database is deterministically seeded with test fixtures on boot. You can authenticate either by logging in at `http://localhost:8080/login` or passing the session cookie directly in requests:

| Role | Persona Name | Email | Password | Session Cookie | Access Level |
|---|---|---|---|---|---|
| **Organizer** | Lead Coordinator | `foundation@dogfood.internal` | `dogfood2026` | `session=org_7f2a` | Full event creation, rubric weights, judge progress, CSV export |
| **Judge A** | Tomas Varga (`jdg_01`) | `tomas.varga@example.org` | `Password123!` | `session=jdg_a_91bc` | Blind evaluation queue, track rubric scores, peer isolation |
| **Judge B** | Wei Lindqvist (`jdg_02`) | `wei.lindqvist@example.org` | `Password123!` | `session=jdg_b_44de` | Blind evaluation queue, track rubric scores, peer isolation |
| **Participant** | Ada Lovelace | `ada@example.org` | `Password123!` | `session=prt_2e88` | Project submissions, team invite links, registered hackathons |

---

## Automated Verification & Acceptance Testing

### 1. Acceptance Spec Verification
Run the acceptance checker directly against port 8080:
```bash
python run.py .dogfood.toml
```

### 2. Backend Unit & Integration Tests
```bash
cd src/backend
pytest -v
```

---

## Environment Variables Reference

| Variable | Default Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://dogfood:dogfood@127.0.0.1:5432/dogfood` | PostgreSQL database connection string |
| `SECRET_KEY` | `dogfood-super-secret-key-2026` | Secret key used for session cookie signing and certificates |
| `PORT` | `8080` | External portal listening port |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | Backend API URL for client-side queries |
| `SHRINKAGE_K` | `2.0` | Empirical Bayes score shrinkage hyperparameter |
| `ENVIRONMENT` | `production` | Deployment environment (`development` or `production`) |
