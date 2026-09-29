# DOGFOOD User Guide & Operating Manual

Welcome to the DOGFOOD Hackathon Platform. This guide walks you through every role, interface, and workflow supported by the system.

---

## 1. Personas & Quick Login Credentials

The platform is pre-loaded with four production personas for testing and demonstration:

| Role | Name | Email | Password | Primary Console |
|:---|:---|:---|:---|:---|
| **System Admin** | System Administrator | `admin@dogfood.internal` | `demo2026` | `/admin` |
| **Organizer** | Foundation Admin | `organizer@dogfood.dev` | `demo2026` | `/dashboard/organizer` |
| **Judge** | Tomas Varga | `tomas.varga@example.org` | `demo2026` | `/dashboard/judge` |
| **Participant** | Ada Lovelace | `ada@example.org` | `demo2026` | `/dashboard` |

---

## 2. Navigation & Interface System

### 2.1 Top Navigation Bar
- **Logo & Status Badge**: Displays current system health and offline appliance readiness.
- **Role Badge**: Highlights your current authenticated role (e.g. `ORGANIZER ROLE`, `JUDGE ROLE`).
- **Profile Dropdown**:
  - Rendered in a clean light card theme with zero pitch-black background boxes.
  - One-click navigation to **Profile** (`/profile`), **Settings** (`/settings`), **Change Password** (`/change-password`), or **Sign Out**.

### 2.2 Left Sidebar (Organizer & Judge Consoles)
- Pinned flush to the left edge of the viewport.
- **Deep-Linked URLs**: Every item in the sidebar maps to a unique, bookmarkable URL:
  - **Overview**: `/dashboard/organizer`
  - **Manage Events**: `/manage-events`
  - **Manage Judges**: `/manage-judges`
  - **Hackathon Judges**: `/hackathon-judges`
  - **Event Lifecycle**: `/dashboard/organizer?tab=lifecycle`
  - **Rubric & Weights**: `/dashboard/organizer?tab=rubric`
  - **Judge Progress**: `/manage-evaluations`
  - **Export & Reports**: `/dashboard/organizer?tab=exports`

---

## 3. Organizer Workflows

### 3.1 Live Judge Evaluation Progress (`/manage-evaluations`)
The **Judge Evaluation Progress** console provides 100% dynamic, live oversight:
1. **Platform KPI Metrics**:
   - **Registered Judges**: Real evaluator count from PostgreSQL.
   - **Evaluations Submitted**: Total score records.
   - **Overall Completion**: Percentage of assigned reviews completed.
   - **Active vs. Pending**: Identifies judges who haven't started or are actively reviewing.
2. **Evaluator Breakdown**:
   - Click **View Breakdown** on any evaluator card to inspect all projects they have evaluated, criteria scores, and comments.
   - See remaining pending submissions in their queue.
3. **One-Click Auto-Assign**:
   - Click **Auto-Assign Tracks** to trigger the round-robin distribution algorithm, automatically rebalancing judge workloads across tracks.
4. **CSV Export**:
   - Click **Export CSV** to download the official unweighted and calibrated score matrix.

### 3.2 Rubric Configuration (`/dashboard/organizer?tab=rubric`)
- Adjust criteria weights: Functionality, Code Quality, and Innovation.
- Click **Save Weights** to immediately apply the updated matrix to composite scoring.

---

## 4. Judge Workflows

### 4.1 Blind Evaluation Queue (`/dashboard/judge`)
1. View all assigned submissions matching your assigned tracks.
2. Click **Evaluate** on any pending project card.
3. Review problem statement, solution summary, GitHub repository, and demo links.
4. Adjust rubric sliders (1.0 to 10.0 scale) for each criterion.
5. Provide qualitative feedback in the **Evaluator Comments** box.
6. Click **Submit Evaluation**. The system persists the score to PostgreSQL and updates your queue counter immediately.

### 4.2 Verifying Peer Isolation
- Click the **Peer Isolation** tab in the sidebar (`/dashboard/judge?tab=isolation`).
- Click **Test Peer Isolation**. The system queries the backend to prove that cross-judge score queries are strictly forbidden with `HTTP 403 Forbidden`.

---

## 5. Participant Workflows

### 5.1 Project Submission & Workspace (`/dashboard`)
1. Browse upcoming and active hackathons on `/hackathons`.
2. Inspect countdown timers and UTC-synchronized deadlines.
3. Submit projects including repo links, video demos, team rosters, and track selections.

### 5.2 Certificates (`/certificates`)
- Once evaluation concludes, participants can view and export digital certificates of completion with verified score rankings.
