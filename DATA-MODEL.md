# DATA-MODEL.md: Architecture, Schema & Ingestion

## 1. Overview & Data Philosophy

The DOGFOOD platform data architecture is designed around four core requirements:
1. **Containerized Portability:** Relational PostgreSQL 16 persistence ensuring atomic transactions, consistency, and automated fixture ingestion.
2. **Strict Backend-Enforced Role Isolation:** Access control keys are bound directly at the database query level (e.g., judge score queries strictly filter by `judge_id = session.user_id` unless the requester possesses the `organizer` or `admin` role).
3. **Resilience to Incomplete & Anomalous Data:** Direct handling of real-world hackathon edge cases present in `fixtures.json` (unbalanced review allocations, unfinished judge batches, zero-variance score distributions, and duplicate submissions).
4. **Auditability:** Complete historical event logging for all score submissions, revisions, and community ballots.

---

## 2. Entity-Relationship Diagram (ERD)

```text
  EVENT ────< TRACK
    │           │
    │           └───< PROJECT >─── TEAM
    │                   │          │
    │                   ▼          ▼
    │                 SCORE     TEAM_MEMBER
    │                   │          │
    │                   ▼          ▼
    └──────────────< USER <────────┘
```

---

## 3. Schema Definitions

### 3.1 `events`
```sql
CREATE TABLE events (
    id TEXT PRIMARY KEY,                       -- e.g. "evt_01"
    name TEXT NOT NULL,                        -- e.g. "Sample Hack 2026"
    description TEXT,
    submissions_close TEXT NOT NULL,           -- UTC ISO-8601 (e.g. "2026-03-01T18:00:00Z")
    voting_open TEXT,
    voting_close TEXT,
    status TEXT NOT NULL DEFAULT 'published',  -- 'draft', 'published', 'judging', 'closed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 `tracks`
```sql
CREATE TABLE tracks (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT
);
```

### 3.3 `users` & `sessions`
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'visitor',      -- 'visitor', 'participant', 'judge', 'organizer', 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT
);
```

### 3.4 `projects`
```sql
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    repo_url TEXT,
    submitted_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.5 `scores` & `score_criteria`
```sql
CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    judge_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    raw_weighted_score REAL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (judge_id, project_id)
);

CREATE TABLE score_criteria (
    id SERIAL PRIMARY KEY,
    score_id INTEGER NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
    criterion TEXT NOT NULL,
    val REAL NOT NULL
);
```
