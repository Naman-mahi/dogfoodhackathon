# ARCHITECTURE.md: System Design, Gateway Topology & Security Architecture

## 1. Architectural Philosophy

The DOGFOOD platform is engineered for **extreme adoptability, offline self-containment, and zero-trust role isolation**.

Key architectural tenets:
1. **The Offline Appliance Model:** Zero external internet dependencies. No external font servers, CDNs, third-party authentication SaaS (Clerk, Auth0, Firebase), or hosted databases.
2. **Deterministic Startup:** A single command (`docker compose up`) builds and spins up the unified portal on port **8080**, initializes local PostgreSQL 15, seeds fixtures, boots FastAPI, launches Next.js, and prints test credentials directly to stdout.
3. **Backend-Enforced Authorization:** Every incoming HTTP request must pass through a strict authorization dependency layer. Access control barriers are bound at the database query level via pure **SQLAlchemy Core** query builders. Frontend obfuscation is treated as zero security.
4. **Pure Query Builder Mandate:** All database operations are constructed using relational expression builders (`select()`, `insert()`, `update()`, `delete()`). No ORM session objects or implicit lazy loading are used.

---

## 2. System Architecture & Gateway Topology

```text
                  ┌───────────────────────────────────────────────┐
                  │       Client / Browser / run.py / curl        │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          │ HTTP :8080
                                          ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Unified DOGFOOD Appliance Container (dogfood-portal)                        │
  │                                                                             │
  │   ┌─────────────────────────────────────────────────────────────────────┐   │
  │   │ Reverse Proxy & Web Portal (Next.js 16 / Node.js 20 - Port 8080)     │   │
  │   │  - Dynamic Server Components & Client Hydration                     │   │
  │   │  - Public Project Gallery (/projects)                               │   │
  │   │  - Event & Hackathon Details (/events, /hackathons)                 │   │
  │   │  - Evaluator & Calibration Dashboard (/results)                     │   │
  │   │  - Transparent Proxy Rewrites:                                      │   │
  │   │      /api/:path*     ──> http://127.0.0.1:8000/api/:path*           │   │
  │   │      /docs           ──> http://127.0.0.1:8000/docs                 │   │
  │   │      /openapi.json   ──> http://127.0.0.1:8000/openapi.json         │   │
  │   │      /projects/new   ──> http://127.0.0.1:8000/projects/new         │   │
  │   └───────────────────────────────────┬─────────────────────────────────┘   │
  │                                       │                                     │
  │                                       │ Internal Loopback :8000             │
  │                                       ▼                                     │
  │   ┌─────────────────────────────────────────────────────────────────────┐   │
  │   │ REST API Engine (FastAPI / Uvicorn - Port 8000)                     │   │
  │   │  - Middleware: CORS, Session Token Extractor, Error Handler        │   │
  │   │  - Authentication Dependencies: get_current_user, require_auth      │   │
  │   │  - Role Guards: require_organizer, require_judge, require_participant│   │
  │   │  - Modular V1 Routers:                                              │   │
  │   │      /api/v1/auth, /api/v1/users, /api/v1/events, /api/v1/projects, │   │
  │   │      /api/v1/judges, /api/v1/rubrics, /api/v1/scores,               │   │
  │   │      /api/v1/results, /api/v1/admin                                 │   │
  │   │  - Acceptance Compatibility Endpoints:                              │   │
  │   │      GET  /api/projects             (Public gallery)                │   │
  │   │      POST /projects/new             (Strict deadline gate)          │   │
  │   │      GET  /api/judge/scores         (Zero-trust peer isolation)     │   │
  │   │      GET  /api/export.csv           (Organizer score matrix export) │   │
  │   │      GET  /api/results/calibrated   (Empirical Bayes rankings)      │   │
  │   └───────────────────────────────────┬─────────────────────────────────┘   │
  │                                       │                                     │
  │                                       │ SQLAlchemy Core (psycopg2)          │
  │                                       ▼                                     │
  │   ┌─────────────────────────────────────────────────────────────────────┐   │
  │   │ Persistence Layer (PostgreSQL 15 - Port 5432)                       │   │
  │   │  - Relational tables: users, sessions, events, tracks, teams,       │   │
  │   │    projects, judges, rubrics, scores, votes, comments, audit_logs   │   │
  │   │  - Deterministic fixture seeder (seed.py + seed_data.py)            │   │
  │   └─────────────────────────────────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Threat Model & Security Posture

| Threat | Impact | DOGFOOD Mitigation |
|---|---|---|
| **Judge Peer Score Snooping (IDOR)** | Unfair collusions, biased calibration, herd grading | Endpoint `/api/judge/scores` strictly checks `authenticated_judge_id`. If `judge` parameter is passed requesting a peer judge's scores, returns `HTTP 403 Forbidden` unless user is an `organizer`. |
| **Participant Evaluator Access** | Score visibility leak, tampering | Participants attempting to query `/api/judge/scores` or `/api/v1/judge/scores` receive `HTTP 403 Forbidden`. |
| **Late Submission Injection** | Unfair time advantage after deadline | Middleware and services evaluate `CURRENT_TIMESTAMP >= event.submissions_close`. Submissions to closed events are strictly refused with `HTTP 403 Forbidden`. |
| **Sybil Attack on Community Voting** | Ballot stuffing for popular projects | Device fingerprint hashing (User-Agent + Client IP + Salt), duplicate detection table, rate-limiting, and blinded voting windows. |
| **Score Tampering & Retroactive Edits** | Illegitimate leaderboard alteration | Cryptographic audit trail on every score submission and update. |
| **Certificate Forgery** | Fraudulent proof of participation | Verifiable HMAC-SHA256 digital signatures generated with `settings.SECRET_KEY` on `CERT:{project_id}:{title}:{team}`. |
| **Privilege Escalation** | Participants accessing judge rubrics or organizer exports | Strict role hierarchy (`anonymous` < `participant` < `judge` < `organizer`) enforced on every endpoint dependency. |

---

## 4. Empirical Bayes Calibration Engine

The platform eliminates judge grading variance and leniency/severity bias through an Empirical Bayes shrinkage estimation engine ($k=2.0$):

$$\hat{\theta}_i = \frac{n_i \cdot \bar{y}_i + k \cdot \mu_0}{n_i + k}$$

Where:
- $\mu_0$: Global prior mean calculated across all criteria scores in the event.
- $\bar{y}_i$: Sample mean of raw judge scores for project $i$.
- $n_i$: Total number of independent evaluator reviews for project $i$.
- $k$: Shrinkage hyperparameter ($k=2.0$) determining the strength of regularizing outliers toward the global consensus.

---

## 5. Frontend Architecture & Design System

### 5.1 Container-Fluid Layout Model
The entire web interface is engineered under a modern **container-fluid** architecture. Fixed container boundaries (`max-w-7xl`, `max-w-5xl`, etc.) are avoided in favor of full viewport responsiveness (`w-full px-4 sm:px-6 lg:px-8` and `.container-fluid`), allowing expansive data grids, scoring tables, and dashboard workspaces to utilize the complete browser canvas.

### 5.2 Curated 10-Color Design System
To maintain rigorous UI/UX consistency, the application strictly adheres to a centralized 10-color token palette defined in `globals.css`:

| # | Token | Hex | Role & Purpose |
|---|---|---|---|
| 1 | `--c-dark-bg` | `#080C16` | **Deep Obsidian**: Console canvas, fixed sidebar, dark viewport |
| 2 | `--c-dark-surface` | `#0F172A` | **Slate Charcoal**: Dark elevated cards, user dropdowns, inputs |
| 3 | `--c-light-bg` | `#F8FAFC` | **Pure Canvas Light**: Main body background |
| 4 | `--c-light-surface` | `#FFFFFF` | **Crisp White**: Cards, containers, surface panels |
| 5 | `--c-primary` | `#2563EB` | **Electric Blue**: Brand primary, links, primary CTA buttons |
| 6 | `--c-organizer` | `#7C3AED` | **Royal Violet**: Organizer Console badge, highlights, admin actions |
| 7 | `--c-judge` | `#0284C7` | **Azure Sky**: Judge Console badge, peer evaluations, queue tags |
| 8 | `--c-success` | `#10B981` | **Emerald Green**: Live status indicators, submissions, participant badge |
| 9 | `--c-danger` | `#EF4444` | **Signal Rose**: Closed deadlines, alerts, destructive/sign-out actions |
| 10 | `--c-border` | `#E2E8F0` | **Neutral Slate**: Subtle dividers, borders, muted lines |

---

## 6. Role-Based Dashboard & Layout Architecture

```text
                        ┌───────────────────────────────┐
                        │        User Navigation        │
                        └───────────────┬───────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                      ▼
        ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
        │   Participant   │    │    Organizer    │    │      Judge      │
        └────────┬────────┘    └────────┬────────┘    └────────┬────────┘
                 │                      │                      │
        ┌────────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
        │  Clean Wide     │    │  Fixed Sidebar  │    │  Fixed Sidebar  │
        │  Header Dropdown│    │  Hub Layout     │    │  Console Layout │
        │  Public Footer  │    │  NO Footer      │    │  NO Footer      │
        └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 6.1 Participant Experience
- **Workspace Route:** `/dashboard` and `/dashboard/hackathon/[slug]`
- **Layout:** Clean wide layout without sidebar.
- **4 Dedicated Workspace Tabs:**
  1. `Overview`: Dates, prizes, description, and milestone timeline.
  2. `Tracks`: Competition tracks and criteria.
  3. `Teams`: Shareable team invite links with 1-click clipboard copy.
  4. `Submissions`: Submission form with real-time deadline gating.
- **Account Access:** Handled via the top Navbar dropdown.

### 6.2 Organizer Experience
- **Workspace Route:** `/dashboard/organizer` & `/events/new`
- **Layout:** Dedicated `OrganizerLayout` with fixed, sticky sidebar (`sticky top-16 h-[calc(100vh-4rem)]`).
- **Capabilities:** Event lifecycle transition, rubric weights calibration, real-time judge progress tracking, CSV score matrix export, and multi-step event wizard.
- **Navigation:** Header profile dropdown is strictly omitted; all profile and settings access is via the pinned bottom sidebar dropdown.
- **Footer:** Suppressed across all organizer console views.

### 6.3 Judge Experience
- **Workspace Route:** `/dashboard/judge`
- **Layout:** Dedicated `JudgeLayout` with fixed, sticky sidebar (`sticky top-16 h-[calc(100vh-4rem)]`).
- **Capabilities:** Assigned submission queue, multi-criteria rubric scoring, peer isolation verification, and scoring guide.
- **Navigation:** Header profile dropdown is strictly omitted; profile and settings access is via the pinned bottom sidebar dropdown.
- **Footer:** Suppressed across all judge console views.

### 6.4 Zero-Modal Profile & Settings Routing
All profile updates and account security adjustments are routed to full, dedicated pages instead of modal dialogs:
- **Profile:** `/profile` — Public identity, bio, GitHub integration, and role statistics.
- **Settings:** `/settings` — Profile customization, avatar seed selection, and credential settings.
- The sidebar bottom user card acts as an interactive popup trigger navigating directly to these dedicated pages.

