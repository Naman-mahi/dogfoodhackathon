# DOGFOOD: Autonomous Hackathon Evaluation & Scoring Platform

> *"Build the platform that will judge you."*  
> An open-source, self-hostable hackathon evaluation and management platform engineered for offline resilience, rigorous Empirical Bayes score calibration, zero-trust backend role isolation, and a modern container-fluid light-themed UI.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compliant-2496ED)](https://www.docker.com/)

---

## 1. Quickstart: Single Command, Single Port (`8080`)

The entire platform runs completely offline on a **single port (`8080`)** with zero external cloud dependencies, zero external font servers, and zero SaaS authentication services:

```bash
docker compose up --build
```

*Or via Docker standalone:*
```bash
docker build -t dogfood-portal:latest .
docker run -d --name dogfood-portal -p 8080:8080 dogfood-portal:latest
```

Once running, the application is live on **`http://localhost:8080`**:

| Route | Description | Target Role |
|---|---|---|
| [`/`](http://localhost:8080) | Home Page & Platform Overview | Public / Visitors |
| [`/hackathons`](http://localhost:8080/hackathons) | Browse Competitions with Multi-Attribute Filters | Public / All |
| [`/projects`](http://localhost:8080/projects) | Public Project Gallery & Architecture Showcase | Public / All |
| [`/results`](http://localhost:8080/results) | Empirical Bayes Score Normalization Leaderboard | Public / All |
| [`/dashboard`](http://localhost:8080/dashboard) | Role-Based Master Console Dispatcher | Authenticated |
| [`/dashboard/organizer`](http://localhost:8080/dashboard/organizer) | Organizer Hub (Events, Rubrics, Progress, CSV Export) | Organizer |
| [`/manage-evaluations`](http://localhost:8080/manage-evaluations) | 100% Dynamic Judge Evaluation Progress Console | Organizer / Admin |
| [`/dashboard/judge`](http://localhost:8080/dashboard/judge) | Judge Console (Peer-Isolated Queue & Rubrics) | Judge |
| [`/admin`](http://localhost:8080/admin) | Dedicated System Administration Console | Admin |
| [`/profile`](http://localhost:8080/profile) | User Persona, Stats & Badges | Authenticated |
| [`/settings`](http://localhost:8080/settings) | Account & Security Customization | Authenticated |
| [`/change-password`](http://localhost:8080/change-password) | Self-Service Password Management | Authenticated |
| [`/certificates`](http://localhost:8080/certificates) | Digital Completion & Winner Certificates | Participant |
| [`/docs`](http://localhost:8080/docs) | Interactive Swagger UI API Documentation | Public / Devs |

---

## 2. Test Personas & Authentication Credentials

The database is deterministically pre-seeded with test personas on initial container startup:

| Role | Persona Name | Email | Password | Primary Console |
|:---|:---|:---|:---|:---|
| **System Admin** | System Administrator | `admin@dogfood.internal` | `demo2026` | `/admin` |
| **Organizer** | Foundation Admin | `organizer@dogfood.dev` | `demo2026` | `/dashboard/organizer` |
| **Judge 1** | Tomas Varga (`jdg_01`) | `tomas.varga@example.org` | `demo2026` | `/dashboard/judge` |
| **Judge 2** | Wei Lindqvist (`jdg_02`)| `wei.lindqvist@example.org`| `demo2026` | `/dashboard/judge` |
| **Participant** | Ada Lovelace | `ada@example.org` | `demo2026` | `/dashboard` |

---

## 3. Core Architectural Capabilities

### 3.1 100% Dynamic Judge Evaluation Progress
- Powered by live PostgreSQL aggregations across [`scores`](src/backend/app/db/models/score.py), [`judges`](src/backend/app/db/models/judge.py), and [`projects`](src/backend/app/db/models/project.py) tables.
- Monitors registered judges (30), verified evaluations submitted (130), queue completion rates (63%), and active vs. pending evaluators.
- Interactive breakdown reveals exact project ratings, rubric criteria pills, evaluator qualitative critiques, and remaining pending submissions.
- Algorithmic round-robin track distribution button auto-assigns evaluators with balanced workloads.

### 3.2 Concrete URL Deep-Linking
Every sidebar item maps to a concrete, bookmarkable URL:
- `/dashboard/organizer?tab=lifecycle`
- `/dashboard/organizer?tab=rubric`
- `/manage-evaluations`
- `/dashboard/organizer?tab=exports`
- `/dashboard/judge?tab=isolation`
- `/dashboard/judge?tab=history`
- `/dashboard/judge?tab=rubric`

### 3.3 Zero-Trust Peer Isolation Barrier
- Evaluators score submissions blindly without visibility into peer reviews or competitor scores.
- Attempting to inspect another judge's score directly throws `HTTP 403 Forbidden` (`PeerIsolationViolationException`).

### 3.4 Empirical Bayes Score Normalization
- Uses Bayesian shrinkage with parameter $k = 2.0$:
  $$\hat{\mu}_i = \frac{n_i \cdot \bar{x}_i + k \cdot \mu_0}{n_i + k}$$
- Mathematically neutralizes harsh vs. lenient evaluator variance to prevent unfair leaderboard skew.

### 3.5 Safe Date Parsing (Zero "Invalid Date" Errors)
- Universal date utility formats UTC timestamps localized to user display settings without browser rendering glitches.

---

## 4. Documentation Suite (`/docs`)

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- 📐 **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**: System topology, single-port appliance design, reverse proxy, security barriers, and sequence diagrams.
- 🔌 **[docs/API_REFERENCE.md](docs/API_REFERENCE.md)**: REST endpoints, schemas, authentication, and error codes.
- 🗄️ **[docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)**: PostgreSQL models, column constraints, ER diagrams, and indexes.
- ⚖️ **[docs/JUDGING_AND_SCORING.md](docs/JUDGING_AND_SCORING.md)**: Empirical Bayes variance shrinkage mathematics, rubric weights, and CSV matrix exports.
- 📖 **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)**: Step-by-step operating guide for Admin, Organizer, Judge, and Participant roles.
- 🚀 **[docs/DEPLOYMENT_AND_OPERATIONS.md](docs/DEPLOYMENT_AND_OPERATIONS.md)**: Production Docker deployment, environment configuration, backup/restore, and health diagnostics.

---

## 5. Verification via Acceptance Checker

Run the official standard-library acceptance test suite against `http://localhost:8080`:

```bash
python run.py .dogfood.toml
```

### Verified Checks:
- **T1: Public Gallery Access** (`GET /projects`) $\rightarrow$ `HTTP 200` without authentication.
- **T1: Fixture Ingestion** $\rightarrow$ Fixture hackathons and projects loaded deterministically.
- **T1: Deadline Gating** (`POST /projects` as participant) $\rightarrow$ Returns `HTTP 403` for closed events.
- **T2: Judge Score Reading** (`GET /api/v1/judge/scores` as `jdg_01`) $\rightarrow$ Returns `HTTP 200`.
- **T2: Peer Score Isolation** (`GET /api/v1/judge/scores?judge=jdg_01` as `jdg_02`) $\rightarrow$ Returns `HTTP 403 Forbidden`.
- **T2: Participant Access Denial** (`GET /api/v1/judge/scores` as participant) $\rightarrow$ Returns `HTTP 403 Forbidden`.
- **T2: Score Matrix Export** (`GET /api/export.csv` as organizer) $\rightarrow$ Returns valid RFC-4180 CSV matrix.
