import requests
import time

BASE_URL = "http://localhost:8080"

def test_roles_password_change():
    print("=== Testing Password Change Across All Roles ===")
    
    roles_to_test = [
        {"role": "organizer", "email": "organizer@dogfood.dev", "init_pwd": "demo2026"},
        {"role": "judge", "email": "tomas.varga@example.org", "init_pwd": "demo2026"},
        {"role": "participant", "email": "ada@example.org", "init_pwd": "demo2026"},
    ]

    for item in roles_to_test:
        role = item["role"]
        email = item["email"]
        curr_pwd = item["init_pwd"]
        new_pwd = f"NewTempPwd_{int(time.time())}_{role}!"
        
        print(f"\n--- Testing role: {role} ({email}) ---")

        # 1. Login with current password
        session = requests.Session()
        res_login = session.post(f"{BASE_URL}/api/v1/auth/login", json={
            "email": email,
            "password": curr_pwd
        })
        assert res_login.status_code == 200, f"Login failed for {role}: {res_login.text}"
        data = res_login.json()
        token = data["access_token"]
        assert data.get("role") == role, f"Expected role {role}, got {data.get('role')}"
        headers = {"Authorization": f"Bearer {token}"}
        print(f"Logged in successfully as {role}.")

        # 2. Change password to new_pwd
        res_change = session.post(f"{BASE_URL}/api/v1/auth/change-password", headers=headers, json={
            "current_password": curr_pwd,
            "new_password": new_pwd
        })
        assert res_change.status_code == 200, f"Change password failed for {role}: {res_change.text}"
        print(f"Password changed successfully for {role} to: {new_pwd}")

        # 3. Verify login works with new_pwd
        res_new_login = session.post(f"{BASE_URL}/api/v1/auth/login", json={
            "email": email,
            "password": new_pwd
        })
        assert res_new_login.status_code == 200, f"Login with new password failed for {role}: {res_new_login.text}"
        print(f"Login with new password succeeded for {role}.")

        # 4. Revert password back to original demo2026 so system demo accounts remain standard
        new_token = res_new_login.json()["access_token"]
        new_headers = {"Authorization": f"Bearer {new_token}"}
        res_revert = session.post(f"{BASE_URL}/api/v1/auth/change-password", headers=new_headers, json={
            "current_password": new_pwd,
            "new_password": curr_pwd
        })
        assert res_revert.status_code == 200, f"Reverting password failed for {role}: {res_revert.text}"
        print(f"Successfully reverted password for {role} back to '{curr_pwd}'.")

    print("\nALL ROLES PASSWORD CHANGE VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    test_roles_password_change()
