# DOGFOOD 2026: The Hackathon Platform That Judges You

> *"Build the platform that will judge you."*  
> An open-source, self-hostable submission and judging platform engineered for offline resilience, rigorous score normalization, and zero-trust backend role isolation.

---

## 1. Quickstart: The One Command, Single Port Rule

The entire platform runs completely offline on a **single port (`8080`)** with zero external cloud accounts, zero hosted databases, and zero external authentication services:

```bash
docker compose up
```

Once running, everything is accessible on **`http://localhost:8080`**:
- **Web Portal & Home:** [http://localhost:8080](http://localhost:8080)
- **Public Gallery:** [http://localhost:8080/projects](http://localhost:8080/projects)
- **Project Submission:** [http://localhost:8080/projects/new](http://localhost:8080/projects/new)
- **Judge Portal:** [http://localhost:8080/judge](http://localhost:8080/judge)
- **Organizer Dashboard:** [http://localhost:8080/organizer](http://localhost:8080/organizer)
- **Community Ballot:** [http://localhost:8080/voting](http://localhost:8080/voting)
- **API Documentation (Swagger UI):** [http://localhost:8080/docs](http://localhost:8080/docs)
- **Database:** PostgreSQL 16 (internal, containerized), automatically seeded from `fixtures.json` on initial boot.

### Test Personas & Auth Sessions
On boot, the database is pre-seeded with test sessions for automated verification:
| Role | Identity | Auth Header |
|---|---|---|
| **Organizer** | Lead Coordinator | `Cookie: session=org_7f2a` |
| **Judge A** | Tomas Varga (`jdg_01`) | `Cookie: session=jdg_a_91bc` |
| **Judge B** | Wei Lindqvist (`jdg_02`) | `Cookie: session=jdg_b_44de` |
| **Participant** | Priya (`priya1@example.org`) | `Cookie: session=prt_2e88` |

---

## 2. Verification via Acceptance Checker

Run the official standard-library acceptance checker directly against `http://localhost:8080`:

```bash
python run.py .dogfood.toml
```

### Verified Checks:
- **T1: Public Gallery Access** (`GET /projects`) $\rightarrow$ `HTTP 200` without authentication.
- **T1: Fixture Project Ingestion** $\rightarrow$ Fixture projects from `fixtures.json` displayed on page 1.
- **T1: Deadline Enforcement** (`POST /projects/new` as participant) $\rightarrow$ Returns `HTTP 403` because fixture deadline closed in March 2026.
- **T2: Judge Score Reading** (`GET /api/judge/scores` as `judge_a`) $\rightarrow$ Returns `HTTP 200`.
- **T2: Peer Score Isolation** (`GET /api/judge/scores?judge=judge_a` as `judge_b`) $\rightarrow$ Returns `HTTP 403 Forbidden` in the backend.
- **T2: Participant Access Denial** (`GET /api/judge/scores` as participant) $\rightarrow$ Returns `HTTP 403`.
- **T2: CSV Export** (`GET /api/export.csv` as organizer) $\rightarrow$ Returns valid CSV data with header.

---

## 3. Tier Status & Feature Matrix

| Tier | Status | Key Features |
|---|---|---|
| **T1: Core** | **Claimed & Verified** | • Session Cookie Auth with 5 roles (`visitor`, `participant`, `judge`, `organizer`, `admin`)<br>• Multi-track event management<br>• Project drafts with strict deadline enforcement<br>• Public gallery with search and track filtering |
| **T2: Judging Engine** | **Claimed & Verified** | • Track-aligned judge assignments<br>• Weighted multi-criteria scoring rubrics<br>• **Backend-enforced role isolation** (zero peer score visibility)<br>• **Empirical Bayes Z-Score Normalization** (handles zero-variance judge edge cases)<br>• Live organizer progress dashboard<br>• Full CSV export of rankings and calibrated scores |
| **T3: Public** | *Stretch* | • Community ballot voting with anti-Sybil fingerprinting<br>• Randomized ballot order to counter primacy bias |
| **T4: Stretch** | *Stretch* | • REST API with OpenAPI specification<br>• Verifiable participation and winner certificates (HMAC-SHA256) |
