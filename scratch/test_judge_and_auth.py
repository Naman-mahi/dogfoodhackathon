import requests
import sys

BASE_URL = "http://localhost:8080"

def test_full_flow():
    print("=== Testing Judge Account Creation & Credentials Flow ===")
    
    # 1. Login as Organizer
    session = requests.Session()
    login_res = session.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "organizer@dogfood.dev",
        "password": "demo2026"
    })
    assert login_res.status_code == 200, f"Organizer login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    org_headers = {"Authorization": f"Bearer {token}"}
    print("Organizer logged in successfully.")

    import time
    ts = int(time.time())
    new_judge_email = f"dr.maya.lin.{ts}@example.org"
    new_judge_pwd = "SecretJudgePassword2026!"
    judge_res = session.post(
        f"{BASE_URL}/api/v1/judges",
        headers=org_headers,
        json={
            "id": f"jdg_maya_{ts}",
            "name": f"Dr. Maya Lin {ts}",
            "email": new_judge_email,
            "tracks": ["AI Infrastructure", "Cryptography"],
            "password": new_judge_pwd
        }
    )
    assert judge_res.status_code in (200, 201), f"Judge creation failed: {judge_res.text}"
    judge_data = judge_res.json()
    print("Judge created:", judge_data)
    assert judge_data["initial_password"] == new_judge_pwd

    # 3. Judge logs in with the newly dispatched credentials
    judge_session = requests.Session()
    judge_login_res = judge_session.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": new_judge_email,
        "password": new_judge_pwd
    })
    assert judge_login_res.status_code == 200, f"Judge login failed: {judge_login_res.text}"
    judge_auth = judge_login_res.json()
    judge_token = judge_auth["access_token"]
    judge_headers = {"Authorization": f"Bearer {judge_token}"}
    print(f"Judge logged in successfully! Role: {judge_auth.get('role')}")
    assert judge_auth.get("role") == "judge"

    # 4. Judge changes their password
    print("\n=== Testing Change Password Route ===")
    # 4a. Wrong current password -> should fail
    fail_res = judge_session.post(
        f"{BASE_URL}/api/v1/auth/change-password",
        headers=judge_headers,
        json={
            "current_password": "WrongPassword!",
            "new_password": "BrandNewPassword2026!"
        }
    )
    assert fail_res.status_code == 400, f"Expected 400 on wrong password, got {fail_res.status_code}"
    print("Correctly rejected invalid current password.")

    # 4b. Too short new password (<6 chars) -> should fail
    short_res = judge_session.post(
        f"{BASE_URL}/api/v1/auth/change-password",
        headers=judge_headers,
        json={
            "current_password": new_judge_pwd,
            "new_password": "123"
        }
    )
    assert short_res.status_code == 400, f"Expected 400 on short password, got {short_res.status_code}"
    print("Correctly rejected short password.")

    # 4c. Valid change password
    updated_pwd = "BrandNewPassword2026!"
    success_res = judge_session.post(
        f"{BASE_URL}/api/v1/auth/change-password",
        headers=judge_headers,
        json={
            "current_password": new_judge_pwd,
            "new_password": updated_pwd
        }
    )
    assert success_res.status_code == 200, f"Change password failed: {success_res.text}"
    print("Password successfully changed:", success_res.json())

    # 4d. Verify login works with the updated password and fails with the old password
    old_try = judge_session.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": new_judge_email,
        "password": new_judge_pwd
    })
    assert old_try.status_code == 401, "Old password should no longer work!"
    
    new_try = judge_session.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": new_judge_email,
        "password": updated_pwd
    })
    assert new_try.status_code == 200, "New password should log in successfully!"
    print("Successfully authenticated with the new password!")

    # 5. Testing authenticated Likes & Comments
    print("\n=== Testing Authenticated Voting & Comments ===")
    # 5a. Unauthenticated like -> should return 401
    unauth_like = requests.post(f"{BASE_URL}/api/v1/projects/prj_01/like")
    assert unauth_like.status_code == 401, f"Expected 401 on unauthenticated like, got {unauth_like.status_code}"
    print("Unauthenticated like correctly rejected with 401.")

    # 5b. Authenticated like -> should succeed
    auth_like = requests.post(f"{BASE_URL}/api/v1/projects/prj_01/like", headers=judge_headers)
    assert auth_like.status_code == 200, f"Authenticated like failed: {auth_like.text}"
    print("Authenticated like succeeded! Likes count:", auth_like.json().get("likes_count"))

    # 5c. Duplicate like from same user -> should return 429
    dup_like = requests.post(f"{BASE_URL}/api/v1/projects/prj_01/like", headers=judge_headers)
    assert dup_like.status_code == 429, f"Expected 429 on duplicate like, got {dup_like.status_code}"
    print("Duplicate like prevented with HTTP 429!")

    # 5d. Unauthenticated comment -> should return 401
    unauth_comm = requests.post(f"{BASE_URL}/api/projects/prj_01/comments", json={
        "author_name": "Ghost",
        "content": "Nice project!"
    })
    assert unauth_comm.status_code == 401, f"Expected 401 on unauthenticated comment, got {unauth_comm.status_code}"
    print("Unauthenticated comment correctly rejected with 401.")

    # 5e. Authenticated comment -> should succeed
    auth_comm = requests.post(f"{BASE_URL}/api/projects/prj_01/comments", headers=judge_headers, json={
        "author_name": "Dr. Maya Lin",
        "content": "Superb architecture and clean modular decomposition."
    })
    assert auth_comm.status_code == 200, f"Authenticated comment failed: {auth_comm.text}"
    print("Authenticated comment succeeded:", auth_comm.json())

    print("\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_flow()
