import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_judge_scores_unauthenticated_fails():
    response = client.get("/api/judge/scores")
    assert response.status_code == 401

def test_judge_scores_participant_forbidden():
    response = client.get("/api/judge/scores", headers={"Cookie": "session=prt_2e88"})
    assert response.status_code == 403

def test_judge_scores_own_evaluations_allowed():
    response = client.get("/api/judge/scores", headers={"Cookie": "session=jdg_a_91bc"})
    assert response.status_code == 200
    scores = response.json()
    assert isinstance(scores, list)
    for sc in scores:
        assert sc["judge"] == "jdg_01"

def test_judge_peer_isolation_prevent_inspection():
    # Judge A (jdg_01) tries to inspect Judge B's scores -> 403 Forbidden
    response = client.get("/api/judge/scores?judge=jdg_02", headers={"Cookie": "session=jdg_a_91bc"})
    assert response.status_code == 403

def test_calibrated_rankings():
    response = client.get("/api/judge/calibrated", headers={"Cookie": "session=org_7f2a"})
    assert response.status_code == 200
    data = response.json()
    assert "rankings" in data
    assert "shrinkage_k" in data

def test_export_csv_organizer_only():
    # Judge should be forbidden from downloading full export
    res_judge = client.get("/api/export.csv", headers={"Cookie": "session=jdg_a_91bc"})
    assert res_judge.status_code == 403

    # Organizer succeeds
    res_org = client.get("/api/export.csv", headers={"Cookie": "session=org_7f2a"})
    assert res_org.status_code == 200
    assert "text/csv" in res_org.headers.get("content-type", "")
    assert "project_id,title,track,team" in res_org.text
