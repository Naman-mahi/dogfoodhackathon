import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_me_unauthorized():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_auth_me_with_cookie():
    response = client.get("/api/v1/auth/me", headers={"Cookie": "session=org_7f2a"})
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "organizer"
    assert data["user_id"] == "org_01"

def test_auth_me_with_bearer():
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer jdg_a_91bc"})
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "judge"
    assert data["user_id"] == "jdg_01"
