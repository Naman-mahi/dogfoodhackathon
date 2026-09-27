# DATA-MODEL.md: Architecture, Relational Schema & Ingestion

## 1. Overview & Data Philosophy

The DOGFOOD platform data architecture is designed around four core requirements:
1. **Containerized Portability:** Relational PostgreSQL 15 persistence ensuring ACID transactions, referential integrity, and automated deterministic fixture ingestion.
2. **Strict Backend-Enforced Role Isolation:** Access control keys are bound directly at the database query level via the SQLAlchemy Core query builder (e.g., judge score queries strictly filter by `judge = session.user_id` unless the requester possesses the `organizer` role).
3. **Resilience to Incomplete & Anomalous Data:** Direct handling of real-world hackathon edge cases present in `fixtures.json` (unbalanced review allocations, unfinished judge batches, zero-variance score distributions, and duplicate submission titles).
4. **Auditability & Anti-Cheat:** Historical event logging for all score submissions, revisions, community ballots, and HMAC-SHA256 participation certificate attestations.

---

## 2. Entity-Relationship Diagram (ERD)

```text
    ┌──────────────┐          1:N         ┌──────────────┐
    │    EVENT     │─────────────────────<│    TRACK     │
    └──────┬───────┘                      └──────┬───────┘
           │                                     │
       1:N │                                 1:N │
           ▼                                     ▼
    ┌──────────────┐          N:1         ┌──────────────┐
    │   PROJECT    │>─────────────────────│     TEAM     │
    └──────┬───────┘                      └──────────────┘
           │                                     │
       1:N │                                 1:N │
           ▼                                     ▼
    ┌──────────────┐          N:1         ┌──────────────┐
    │    SCORE     │>─────────────────────│  JUDGE/USER  │
    └──────────────┘                      └──────┬───────┘
                                                 │
                                             1:N │
                                                 ▼
                                          ┌──────────────┐
                                          │   SESSION    │
                                          └──────────────┘
```

---

## 3. PostgreSQL 15 Relational Schema Definitions

### 3.1 `users`
Stores system accounts, evaluators, organizers, and participants.
```sql
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,                    -- e.g. "org_01", "jdg_01", "prt_01"
    email VARCHAR(255) UNIQUE NOT NULL,            -- e.g. "organizer@dogfood.dev"
    name VARCHAR(128) NOT NULL,                    -- Display name
    hashed_password VARCHAR(255),                  -- Password hash (if applicable)
    role VARCHAR(32) NOT NULL DEFAULT 'participant',-- 'organizer', 'judge', 'participant'
    avatar_url VARCHAR(512),                       -- CDN / Identicon avatar
    bio TEXT,                                      -- Profile bio / background
    github_handle VARCHAR(128),                    -- Social verification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 `sessions`
Stores active session tokens for zero-trust authentication via cookies or headers.
```sql
CREATE TABLE sessions (
    token VARCHAR(128) PRIMARY KEY,                -- e.g. "org_7f2a", "jdg_a_91bc"
    role VARCHAR(64) NOT NULL,                     -- Cached role for query filters
    user_id VARCHAR(64) NOT NULL,                  -- Associated user ID
    user_email VARCHAR(255) NOT NULL,              -- Associated user email
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 `events`
Stores hackathons and competitions with complete schedule, logistics, prizes, timeline, and rubric metadata.
```sql
CREATE TABLE events (
    id VARCHAR(64) PRIMARY KEY,                    -- e.g. "sample-hack-2026", "evt_01"
    slug VARCHAR(128) UNIQUE,                      -- URL slug
    name VARCHAR(255) NOT NULL,                    -- Event name
    title VARCHAR(255),                            -- Display title
    tagline VARCHAR(512),                          -- One-line subtitle
    status VARCHAR(32) NOT NULL DEFAULT 'live',    -- 'live', 'upcoming', 'completed'
    format VARCHAR(32) NOT NULL DEFAULT 'online',  -- 'online', 'in-person', 'hybrid'
    category VARCHAR(64) NOT NULL DEFAULT 'devtools', -- 'ai', 'web3', 'devtools', 'climate', 'opensource'
    category_label VARCHAR(128),                   -- Human-readable category
    location VARCHAR(255) DEFAULT 'Global · Online',
    prize_amount INTEGER NOT NULL DEFAULT 0,       -- Numeric prize pool (e.g. 25000)
    prize_display VARCHAR(64),                     -- Formatted prize (e.g. "$25,000 USD")
    participant_count INTEGER NOT NULL DEFAULT 0,
    submission_count INTEGER NOT NULL DEFAULT 0,
    deadline_display VARCHAR(128),
    gradient VARCHAR(255),                         -- UI accent gradient classes
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    submissions_close TIMESTAMP WITH TIME ZONE NOT NULL, -- Strict deadline cutoff gate
    timezone VARCHAR(64) DEFAULT 'UTC',
    is_free BOOLEAN NOT NULL DEFAULT true,
    entry_fee_display VARCHAR(64) DEFAULT 'Free Entry',
    host VARCHAR(128),
    level VARCHAR(64) DEFAULT 'All Experience Levels',
    team_size_limit VARCHAR(64) DEFAULT '1-4 Members',
    eligibility_summary TEXT,
    community_links JSONB,                         -- Discord, Twitter, GitHub, Website
    judges JSONB,                                  -- List of assigned judge objects
    judging_criteria JSONB,                        -- Scoring criteria weights
    sponsors JSONB,                                -- Title, Platinum, Gold sponsors
    overview JSONB,                                -- Description and highlights
    rules JSONB,                                   -- Rules & eligibility items
    timeline JSONB,                                -- Milestone phases and statuses
    prizes JSONB,                                  -- Prize tiers breakdown
    faqs JSONB,                                    -- Frequently asked questions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.4 `tracks`
Competition categories within an event.
```sql
CREATE TABLE tracks (
    id VARCHAR(64) PRIMARY KEY,                    -- e.g. "trk_01", "devtools-infra"
    event_id VARCHAR(64) NOT NULL,                 -- Linked event
    name VARCHAR(256) NOT NULL,                    -- Track title
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.5 `teams`
Participant squads participating in the competition.
```sql
CREATE TABLE teams (
    id VARCHAR(64) PRIMARY KEY,                    -- e.g. "tm_01"
    name VARCHAR(256) NOT NULL,                    -- Squad name
    members JSONB,                                 -- Array of member usernames/IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.6 `projects`
Hackathon project submissions, code repositories, technical architecture, and community telemetry.
```sql
CREATE TABLE projects (
    id VARCHAR(64) PRIMARY KEY,                    -- e.g. "prj_01"
    slug VARCHAR(128),                             -- URL-safe slug e.g. "glass-signal"
    event_id VARCHAR(64),                          -- Associated event ID
    hackathon_id VARCHAR(64),                      -- Hackathon identifier
    hackathon_slug VARCHAR(128),                   -- Hackathon URL slug
    team VARCHAR(64) NOT NULL,                     -- Submitting team ID or name
    track VARCHAR(64) NOT NULL,                    -- Track ID
    track_label VARCHAR(128),                      -- Display track name
    title VARCHAR(255) NOT NULL,                   -- Project title
    summary TEXT,                                  -- Elevator pitch summary
    problem TEXT,                                  -- Problem solved
    solution TEXT,                                 -- Architectural solution
    technologies JSONB,                            -- Array of tech stack tags
    repo_url VARCHAR(512),                         -- Public git repository URL
    demo_url VARCHAR(512),                         -- Live deployment link
    likes_count INTEGER NOT NULL DEFAULT 0,        -- Peer appreciation counter
    featured BOOLEAN NOT NULL DEFAULT false,       -- Gallery showcase flag
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,-- Submission timestamp (verified vs deadline)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.7 `judges`
Registered evaluators with designated review track allocations.
```sql
CREATE TABLE judges (
    id VARCHAR(64) PRIMARY KEY,                    -- e.g. "jdg_01"
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    tracks JSONB,                                  -- List of assigned track IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.8 `rubrics`
Evaluation criteria for scoring projects.
```sql
CREATE TABLE rubrics (
    id VARCHAR(64) PRIMARY KEY,
    track_id VARCHAR(64) NOT NULL,
    criteria_name VARCHAR(128) NOT NULL,
    weight REAL NOT NULL DEFAULT 1.0,
    min_score REAL NOT NULL DEFAULT 1.0,
    max_score REAL NOT NULL DEFAULT 5.0
);
```

### 3.9 `scores`
Double-blind evaluation scores submitted by judges.
```sql
CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    judge VARCHAR(64) NOT NULL,                    -- Judge ID submitting rating
    project VARCHAR(64) NOT NULL,                  -- Target project evaluated
    criteria JSONB,                                -- Key-value rubric scores (e.g. {"functionality": 4, "quality": 5})
    comment TEXT,                                  -- Qualitative feedback
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.10 Community & Audit Tables
- `votes`: Randomized peer community ballots with voter fingerprint hashing (`voter_fingerprint`).
- `comments`: Community review discussions.
- `webhooks`: Outbound event triggers with shared HMAC secrets.
- `audit_logs`: Append-only tamper-evident log of evaluation and admin actions.

---

## 4. Query Builder Mandate

All database interactions in `app/services/` are executed through **SQLAlchemy Core** expression language (`select`, `insert`, `update`, `delete`, `join`). No ORM session objects or lazy loading are permitted, ensuring deterministic SQL generation, maximum concurrency, and direct query control.
