import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_webhook_registration_organizer_only():
    payload = {
        "event_type": "project.created",
        "target_url": "https://example.com/webhook",
    }
    # Anonymous fails
    res_anon = client.post("/api/webhooks", json=payload)
    assert res_anon.status_code == 401

    # Participant fails
    res_part = client.post("/api/webhooks", json=payload, headers={"Cookie": "session=prt_2e88"})
    assert res_part.status_code == 403

    # Judge fails
    res_judge = client.post("/api/webhooks", json=payload, headers={"Cookie": "session=jdg_a_91bc"})
    assert res_judge.status_code == 403

    # Organizer succeeds
    res_org = client.post("/api/webhooks", json=payload, headers={"Cookie": "session=org_7f2a"})
    assert res_org.status_code == 200
    assert "secret" in res_org.json()

def test_hmac_certificate_generation_and_verification():
    res_cert = client.get("/api/certificates/prj_01")
    assert res_cert.status_code == 200
    cert = res_cert.json()
    assert "hmac_sha256_signature" in cert
    assert cert["verification_status"] == "cryptographically_verified"
