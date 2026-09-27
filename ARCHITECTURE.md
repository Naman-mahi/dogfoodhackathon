# ARCHITECTURE.md: System Design, Security & Threat Model

## 1. Architectural Philosophy

The DOGFOOD platform is engineered for **extreme adoptability, offline self-containment, and zero-trust role isolation**.

Key architectural tenets:
1. **The Offline Appliance Model:** Zero external internet dependencies. No external font servers, CDNs, third-party auth services (Clerk, Auth0, Firebase), or hosted databases.
2. **Deterministic Startup:** A single command (`docker compose up`) spins up the entire portal, creates tables, seeds fixtures, and prints ready-to-use session cookies to stdout.
3. **Backend-Enforced Authorization:** Every incoming HTTP request must pass through an authorization pipeline that verifies role boundaries before reaching data models. Frontend obfuscation is treated as zero security.

---

## 2. System Architecture

```text
                  ┌────────────────────────────────────────┐
                  │          Client / Browser / curl       │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │        Unified Gateway (Port 8080)     │
                  │   - Next.js Web Portal                 │
                  │   - FastAPI REST API (/api/*, /docs)   │
                  │   - Public Project Gallery (/projects) │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │          Middleware Pipeline           │
                  │  ┌──────────────────────────────────┐  │
                  │  │ 1. Request Logger & Audit Trail  │  │
                  │  ├──────────────────────────────────┤  │
                  │  │ 2. Session & Auth Token Parser   │  │
                  │  ├──────────────────────────────────┤  │
                  │  │ 3. Deadline Enforcement Gate     │  │
                  │  ├──────────────────────────────────┤  │
                  │  │ 4. Strict Role Isolation Gate    │  │
                  │  └──────────────────────────────────┘  │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │             Domain Services            │
                  │  - Event & Track Management            │
                  │  - Team & Submission Lifecycle         │
                  │  - Public Gallery & Search             │
                  │  - Empirical Bayes Normalization Engine│
                  │  - Anti-Abuse & Ballot Verifier        │
                  │  - CSV & JSON Exporter                 │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │        Persistence (PostgreSQL 16)     │
                  │   - Relational Foreign Keys & Cascades │
                  │   - Atomic Transactions                │
                  │   - Deterministic Fixture Ingestion    │
                  └────────────────────────────────────────┘
```

---

## 3. Threat Model & Security Posture

| Threat | Impact | DOGFOOD Mitigation |
|---|---|---|
| **Judge Peer Score Snooping (IDOR)** | Unfair collusions, biased calibration | Route `/api/judge/scores` strictly binds to `session.user_id`. Querying `?judge=jdg_01` by `jdg_02` returns `HTTP 403 Forbidden`. |
| **Late Submission Injection** | Unfair time advantage after deadline | Middleware checks `CURRENT_TIMESTAMP > event.submissions_close`. All submission endpoints reject with `HTTP 403/400`. |
| **Sybil Attack on Community Voting** | Ballot stuffing for popular projects | Device fingerprint hashing (User-Agent + Client IP + Salt), blinded voting windows, and rate limiting. |
| **Score Tampering & Retroactive Edits** | Illegitimate leaderboard alteration | Cryptographic audit trail on every score submission and update. |
| **Privilege Escalation** | Participants accessing judge rubrics or organizer exports | Strict role hierarchy (`visitor` < `participant` < `judge` < `organizer` < `admin`) validated on every request. |
