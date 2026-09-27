import os
import json
from datetime import datetime
from sqlalchemy import select, insert, delete
from app.db.session import engine, init_db
from app.db.models.user import users_table, sessions_table
from app.db.models.event import events_table
from app.db.models.track import tracks_table
from app.db.models.judge import judges_table
from app.db.models.team import teams_table
from app.db.models.project import projects_table
from app.db.models.score import scores_table
from app.db.seed_data import MOCK_USERS, MOCK_HACKATHONS, MOCK_PROJECTS

def get_fixtures_path():
    candidate_paths = [
        os.getenv("FIXTURES_PATH", ""),
        "/app/fixtures.json",
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "fixtures.json"),
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "fixtures.json"),
        os.path.join(os.path.dirname(__file__), "..", "..", "fixtures.json"),
        "fixtures.json",
    ]
    for p in candidate_paths:
        if p and os.path.exists(p):
            return os.path.abspath(p)
    return "/app/fixtures.json"

def parse_iso(dt_str):
    if not dt_str:
        return datetime.utcnow()
    dt_str = str(dt_str).replace("Z", "+00:00")
    return datetime.fromisoformat(dt_str)

def seed_database():
    init_db()
    fixtures_path = get_fixtures_path()
    fixtures = {}
    if os.path.exists(fixtures_path):
        with open(fixtures_path, "r", encoding="utf-8") as f:
            fixtures = json.load(f)

    with engine.begin() as conn:
        # Wipe clean for reproducible seeding
        conn.execute(delete(scores_table))
        conn.execute(delete(projects_table))
        conn.execute(delete(teams_table))
        conn.execute(delete(judges_table))
        conn.execute(delete(tracks_table))
        conn.execute(delete(events_table))
        conn.execute(delete(sessions_table))
        conn.execute(delete(users_table))

        # 1. Users
        for u in MOCK_USERS:
            conn.execute(insert(users_table).values(**u))

        # 2. Hackathons / Events
        # Seed rich hackathons from mockData
        for h in MOCK_HACKATHONS:
            conn.execute(
                insert(events_table).values(
                    id=h["id"],
                    slug=h["slug"],
                    name=h["name"],
                    title=h.get("title"),
                    tagline=h.get("tagline"),
                    status=h.get("status", "live"),
                    format=h.get("format", "online"),
                    category=h.get("category", "devtools"),
                    category_label=h.get("category_label"),
                    location=h.get("location", "Global · Online"),
                    prize_amount=h.get("prize_amount", 0),
                    prize_display=h.get("prize_display"),
                    participant_count=h.get("participant_count", 0),
                    submission_count=h.get("submission_count", 0),
                    deadline_display=h.get("deadline_display"),
                    gradient=h.get("gradient"),
                    start_date=parse_iso(h.get("start_date")),
                    end_date=parse_iso(h.get("end_date")),
                    submissions_close=parse_iso(h.get("submissions_close")),
                    timezone=h.get("timezone", "UTC"),
                    is_free=h.get("is_free", True),
                    entry_fee_display=h.get("entry_fee_display", "Free Entry"),
                    host=h.get("host"),
                    level=h.get("level"),
                    team_size_limit=h.get("team_size_limit"),
                    eligibility_summary=h.get("eligibility_summary"),
                    community_links=h.get("community_links"),
                    judging_criteria=h.get("judging_criteria"),
                    sponsors=h.get("sponsors"),
                    overview=h.get("overview"),
                    rules=h.get("rules"),
                    timeline=h.get("timeline"),
                    prizes=h.get("prizes"),
                    faqs=h.get("faqs"),
                )
            )

        # Also ensure evt_01 exists for acceptance test parity if distinct
        evt = fixtures.get("event", {})
        if evt and evt.get("id") != "sample-hack-2026":
            conn.execute(
                insert(events_table).values(
                    id=evt.get("id", "evt_01"),
                    slug="evt-01",
                    name=evt.get("name", "Sample Hack 2026"),
                    title=evt.get("name", "Sample Hack 2026"),
                    submissions_close=parse_iso(evt.get("submissions_close")),
                )
            )

        # 3. Tracks
        tracks = fixtures.get("tracks", [])
        for trk in tracks:
            conn.execute(
                insert(tracks_table).values(
                    id=trk["id"],
                    event_id=evt.get("id", "evt_01"),
                    name=trk["name"],
                )
            )

        # 4. Judges
        judges = fixtures.get("judges", [])
        for jdg in judges:
            conn.execute(
                insert(judges_table).values(
                    id=jdg["id"],
                    name=jdg["name"],
                    email=jdg["email"],
                    tracks=jdg.get("tracks", []),
                )
            )

        # 5. Teams
        teams = fixtures.get("teams", [])
        for tm in teams:
            conn.execute(
                insert(teams_table).values(
                    id=tm["id"],
                    name=tm["name"],
                    members=tm.get("members", []),
                )
            )

        # 6. Projects (Fixtures + Showcase mock projects)
        inserted_proj_ids = set()
        seen_slugs = set()
        fixture_projects = fixtures.get("projects", [])
        for prj in fixture_projects:
            pid = prj["id"]
            inserted_proj_ids.add(pid)
            clean_title = prj.get("title", pid).lower().replace(" ", "-")
            slug = clean_title if clean_title not in seen_slugs else f"{clean_title}-{pid}"
            seen_slugs.add(slug)
            conn.execute(
                insert(projects_table).values(
                    id=pid,
                    slug=slug,
                    event_id=evt.get("id", "evt_01"),
                    hackathon_id="sample-hack-2026",
                    hackathon_slug="sample-hack-2026",
                    team=prj.get("team", ""),
                    track=prj.get("track", ""),
                    track_label="General Track",
                    title=prj.get("title", ""),
                    summary=prj.get("summary", ""),
                    problem="Peer evaluation in distributed events requires tamper-proof message routing.",
                    solution="A cryptographic event bus that routes blind evaluation payloads.",
                    technologies=["Python", "FastAPI", "PostgreSQL", "Next.js"],
                    repo_url=prj.get("repo_url", ""),
                    demo_url="https://demo.dogfood.dev",
                    likes_count=100,
                    featured=True,
                    submitted_at=parse_iso(prj.get("submitted_at")),
                )
            )

        # Add additional showcase projects from mockData if not already in fixtures
        for mp in MOCK_PROJECTS:
            if mp["id"] not in inserted_proj_ids:
                conn.execute(
                    insert(projects_table).values(
                        id=mp["id"],
                        slug=mp["slug"],
                        event_id="evt_01",
                        hackathon_id=mp.get("hackathon_id", "sample-hack-2026"),
                        hackathon_slug=mp.get("hackathon_slug", "sample-hack-2026"),
                        team=mp.get("team", "tm_01"),
                        track=mp.get("track", "trk_01"),
                        track_label=mp.get("track_label", "General"),
                        title=mp["title"],
                        summary=mp.get("summary", ""),
                        problem=mp.get("problem", ""),
                        solution=mp.get("solution", ""),
                        technologies=mp.get("technologies", []),
                        repo_url=mp.get("repo_url", ""),
                        demo_url=mp.get("demo_url", ""),
                        likes_count=mp.get("likes_count", 0),
                        featured=mp.get("featured", False),
                        submitted_at=parse_iso(mp["submitted_at"]),
                    )
                )

        # 7. Scores
        scores = fixtures.get("scores", [])
        for sc in scores:
            conn.execute(
                insert(scores_table).values(
                    judge=sc["judge"],
                    project=sc["project"],
                    criteria=sc.get("criteria", {}),
                    comment=sc.get("comment", ""),
                )
            )

        # 8. Sessions
        test_sessions = [
            {"token": "org_7f2a", "role": "organizer", "user_id": "org_01", "user_email": "organizer@dogfood.dev"},
            {"token": "jdg_a_91bc", "role": "judge", "user_id": "jdg_01", "user_email": "tomas.varga@example.org"},
            {"token": "jdg_b_44de", "role": "judge", "user_id": "jdg_02", "user_email": "wei.lindqvist@example.org"},
            {"token": "prt_2e88", "role": "participant", "user_id": "prt_01", "user_email": "ada@example.org"},
        ]
        for s in test_sessions:
            conn.execute(insert(sessions_table).values(**s))

    print("seeded. test logins:")
    print("  organizer    Cookie: session=org_7f2a")
    print("  judge_a      Cookie: session=jdg_a_91bc")
    print("  judge_b      Cookie: session=jdg_b_44de")
    print("  participant  Cookie: session=prt_2e88")

if __name__ == "__main__":
    seed_database()
