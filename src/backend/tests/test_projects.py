import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_projects_public():
    response = client.get("/api/projects")
    assert response.status_code == 200
    projects = response.json()
    assert isinstance(projects, list)
    assert len(projects) > 0

def test_list_projects_filter_track():
    response = client.get("/api/projects?track=trk_01")
    assert response.status_code == 200
    projects = response.json()
    assert isinstance(projects, list)
    for p in projects:
        assert p["track"] == "trk_01"

def test_submit_project_new():
    payload = {
        "title": "Unit Test Project Submission",
        "summary": "Fast reliable testing",
        "repo_url": "https://github.com/example/test-submission",
        "track": "trk_01",
        "team": "tm_01",
    }
    response = client.post("/api/projects/new", json=payload)
    # Could be 201 if deadline open, or 403 if deadline passed according to fixtures
    assert response.status_code in (201, 403)
