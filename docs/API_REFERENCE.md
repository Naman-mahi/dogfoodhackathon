# DOGFOOD REST API Reference

Base URL: `http://localhost:8080/api/v1`  
Interactive OpenAPI Swagger Docs: `http://localhost:8080/docs`  
OpenAPI JSON Schema: `http://localhost:8080/openapi.json`

---

## 1. Authentication & Session Endpoints

### `POST /auth/login`
Authenticates a user and creates an active session.

- **Request Body**:
  ```json
  {
    "email": "organizer@dogfood.dev",
    "password": "demo2026"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "sess_93c091aea11e...",
    "token_type": "bearer",
    "user": {
      "id": "org_01",
      "email": "organizer@dogfood.dev",
      "name": "DOGFOOD Foundation Admin",
      "role": "organizer"
    }
  }
  ```

### `GET /auth/me`
Retrieves currently authenticated session identity.
- **Headers**: `Authorization: Bearer <token>` or Cookie: `session=<token>`
- **Response `200 OK`**:
  ```json
  {
    "id": "jdg_01",
    "email": "tomas.varga@example.org",
    "name": "Tomas Varga",
    "role": "judge"
  }
  ```

### `POST /auth/logout`
Terminates user session and revokes bearer token.

---

## 2. Judging & Score Evaluation

### `GET /judge/scores/progress`
Returns live platform-wide evaluation progress and individual evaluator breakdown.
- **Access**: Organizers and Admins (full matrix); Judges (caller queue only).
- **Response `200 OK`**:
  ```json
  {
    "summary": {
      "total_judges": 30,
      "total_projects": 46,
      "total_evaluations_submitted": 130,
      "total_evaluations_assigned": 205,
      "overall_completion_rate": 63,
      "completed_judges_count": 5,
      "in_progress_judges_count": 25,
      "not_started_judges_count": 0
    },
    "judges": [
      {
        "id": "jdg_01",
        "name": "Tomas Varga",
        "email": "tomas.varga@example.org",
        "tracks": ["trk_01"],
        "total_assigned": 6,
        "total_scored": 5,
        "progress_percentage": 83,
        "status": "In Progress",
        "scored_projects": [
          {
            "project_id": "proj_01",
            "project_title": "AetherKernel",
            "track": "Developer Tools",
            "team": "KernelCorp",
            "average_score": 8.7,
            "criteria": { "functionality": 9.0, "quality": 8.5, "innovation": 8.5 },
            "comment": "Exceptional microkernel architecture.",
            "scored_at": "2026-03-01T20:15:00Z"
          }
        ],
        "pending_projects": [
          {
            "project_id": "proj_06",
            "project_title": "VortexVM",
            "track": "Developer Tools",
            "team": "VortexDev"
          }
        ]
      }
    ]
  }
  ```

### `GET /judge/scores`
Fetches evaluation scores.
- **Query Parameters**:
  - `judge` (optional): Filter by target judge ID.
- **Security Rule**: Judges can ONLY request their own scores. Requesting another judge's ID triggers `403 Forbidden`. Organizers can pass `judge="all"` or omit to receive all scores.

### `POST /judge/scores`
Submits or updates an evaluation score record.
- **Access**: Restricted to authenticated judges.
- **Request Body**:
  ```json
  {
    "project": "proj_01",
    "criteria": {
      "functionality": 9.0,
      "quality": 8.5,
      "innovation": 9.0
    },
    "comment": "Outstanding zero-knowledge implementation."
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "id": 131,
    "judge": "jdg_01",
    "project": "proj_01",
    "criteria": {
      "functionality": 9.0,
      "quality": 8.5,
      "innovation": 9.0
    },
    "comment": "Outstanding zero-knowledge implementation."
  }
  ```

---

## 3. Judge Management & Auto-Assignment

### `GET /judges`
List all registered judges and their track assignments.

### `POST /judges`
Invites a new evaluator to the platform.
- **Access**: Organizer only.
- **Request Body**:
  ```json
  {
    "id": "jdg_new",
    "name": "Elena Rostova",
    "email": "elena@example.org",
    "tracks": ["Security", "Developer Tools"]
  }
  ```

### `POST /judges/auto-assign`
Executes algorithmic round-robin distribution of judges across all event tracks.
- **Query Parameters**:
  - `event_id`: Target hackathon event ID (default: `"evt_01"`).
  - `judges_per_track`: Number of judges assigned per track (default: `2`).

---

## 4. Results & Score Normalization

### `GET /results/calibrated`
Calculates empirical Bayes normalized rankings across all evaluated submissions.
- **Query Parameters**:
  - `hackathon`: Optional slug filter.
- **Response `200 OK`**:
  ```json
  {
    "rankings": [
      {
        "rank": 1,
        "project_id": "proj_03",
        "title": "CipherMesh",
        "team": "Team Zero",
        "track": "Security",
        "raw_score": 9.4,
        "calibrated_score": 9.21,
        "reviews_count": 3
      }
    ],
    "shrinkage_k": 2.0
  }
  ```

### `GET /api/export.csv`
Streams the unweighted and calibrated evaluation matrix as a standard RFC-4180 CSV file.

---

## 5. Projects & Submissions

### `GET /projects`
Public listing of submissions with multi-attribute filtering.
- **Query Parameters**:
  - `search`: Keyword string.
  - `track`: Filter by track name.
  - `event_id`: Filter by hackathon.
  - `sort`: `"featured"` | `"likes"` | `"recent"` | `"title"`.

### `POST /projects`
Creates a new hackathon submission.
- **Deadline Enforcement**: If `submissions_close` has passed, returns `HTTP 403 Forbidden`.
