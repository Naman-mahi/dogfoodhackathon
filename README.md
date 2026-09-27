# DOGFOOD 2026: The Hackathon Platform That Judges You

> *"Build the platform that will judge you."*  
> An open-source, self-hostable hackathon evaluation and management platform engineered for offline resilience, rigorous Bayesian score calibration, zero-trust backend role isolation, and a modern container-fluid UI.

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
*Or run via Docker standalone:*
```bash
docker build -t dogfood-portal:latest .
docker run -d --name dogfood-portal -p 8080:8080 dogfood-portal:latest
```

Once running, everything is accessible on **`http://localhost:8080`**:

| Route | Description | Target Role |
|---|---|---|
| [`/`](http://localhost:8080) | Home Page & Platform Overview | Public / Visitors |
| [`/hackathons`](http://localhost:8080/hackathons) | Browse Competitions with Multi-Attribute Filters | Public / All |
| [`/projects`](http://localhost:8080/projects) | Public Project Gallery & Architecture Showcase | Public / All |
| [`/results`](http://localhost:8080/results) | Empirical Bayes Score Normalization Leaderboard | Public / All |
| [`/dashboard`](http://localhost:8080/dashboard) | Role-Based Master Console Dispatcher | Authenticated |
| [`/dashboard/organizer`](http://localhost:8080/dashboard/organizer) | Organizer Hub (Events, Rubrics, Progress, CSV Export) | Organizer |
| [`/dashboard/judge`](http://localhost:8080/dashboard/judge) | Judge Console (Peer-Isolated Queue & Rubrics) | Judge |
| [`/dashboard/hackathon/[slug]`](http://localhost:8080/dashboard/hackathon/agent-forge-2026) | Participant Workspace (Overview, Tracks, Teams, Submissions) | Participant |
| [`/events/new`](http://localhost:8080/events/new) | Multi-Step Hackathon Creation Wizard | Organizer |
| [`/profile`](http://localhost:8080/profile) | Public Persona, Stats & Badges | Authenticated |
| [`/settings`](http://localhost:8080/settings) | Account & Security Customization | Authenticated |
| [`/docs`](http://localhost:8080/docs) | Interactive Swagger UI API Documentation | Public / Devs |

---

## 2. Test Personas & Auth Credentials

The database is deterministically pre-seeded with test sessions on initial container startup:

| Role | Persona Name | Email | Password | Session Cookie | Access Summary |
|---|---|---|---|---|---|
| **Organizer** | Lead Coordinator | `foundation@dogfood.internal` | `dogfood2026` | `session=org_7f2a` | Full event creation, rubric weights, judge progress, CSV export |
| **Judge A** | Tomas Varga (`jdg_01`) | `tomas.varga@example.org` | `Password123!` | `session=jdg_a_91bc` | Blind evaluation queue, track rubric scores, peer isolation |
| **Judge B** | Wei Lindqvist (`jdg_02`) | `wei.lindqvist@example.org` | `Password123!` | `session=jdg_b_44de` | Blind evaluation queue, track rubric scores, peer isolation |
| **Participant** | Ada Lovelace | `ada@example.org` | `Password123!` | `session=prt_2e88` | Project submissions, team invite links, registered hackathons |

---

## 3. Key Architectural Highlights

- **Container-Fluid UI:** The entire interface is built using full-width fluid layouts (`w-full px-4 sm:px-6 lg:px-8` and `.container-fluid`), eliminating cramped fixed-width boxes.
- **Strict 10-Color Design System:** Centralized in `globals.css`, adhering to a disciplined, premium palette without arbitrary color clutter.
- **Fixed Sidebar Consoles:** Organizer and Judge workspaces feature a sticky, full-height sidebar (`sticky top-16 h-[calc(100vh-4rem)]`) with internal scrolling and a pinned bottom profile card with dropdown navigation.
- **Zero-Modal Profile Navigation:** User profile and settings open directly into full, dedicated pages (`/profile`, `/settings`).
- **Footer Suppression:** Public website footers are cleanly omitted across all internal workspace and console screens (`/dashboard`, `/dashboard/organizer`, `/dashboard/judge`, `/events/new`), while preserved on public visitor pages.
- **Backend-Enforced Role Isolation:** Zero-trust HTTP dependencies ensure judges cannot inspect peer evaluations, and participants cannot access evaluation rubrics.
- **Empirical Bayes Calibration:** Scores are normalized with shrinkage parameter $k=2.0$, mathematically neutralizing harsh vs. lenient evaluator bias.

---

## 4. Verification via Acceptance Checker

Run the official standard-library acceptance test suite against `http://localhost:8080`:

```bash
python run.py .dogfood.toml
```

### Verified Acceptance Checks:
- **T1: Public Gallery Access** (`GET /projects`) $\rightarrow$ `HTTP 200` without authentication.
- **T1: Fixture Ingestion** $\rightarrow$ Fixture hackathons and projects loaded deterministically.
- **T1: Deadline Gating** (`POST /projects/new` as participant) $\rightarrow$ Returns `HTTP 403` for closed events.
- **T2: Judge Score Reading** (`GET /api/judge/scores` as `judge_a`) $\rightarrow$ Returns `HTTP 200`.
- **T2: Peer Score Isolation** (`GET /api/judge/scores?judge=judge_a` as `judge_b`) $\rightarrow$ Returns `HTTP 403 Forbidden`.
- **T2: Participant Access Denial** (`GET /api/judge/scores` as participant) $\rightarrow$ Returns `HTTP 403`.
- **T2: Score Matrix Export** (`GET /api/export.csv` as organizer) $\rightarrow$ Returns valid CSV score matrix.

---

## 5. Documentation Links

- **[ARCHITECTURE.md](ARCHITECTURE.md):** In-depth technical architecture, threat models, gateway topology, and scoring mathematical proofs.
- **[SETUP.md](SETUP.md):** Complete step-by-step bare-metal and Docker deployment guide.
