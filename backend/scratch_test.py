import requests
import json

url = "http://localhost:8000/api/v1/owner/ai/chat"

# We need the active JWT token, let's login first
login_url = "http://localhost:8000/api/v1/auth/login"
resp = requests.post(login_url, json={"email": "hetsony143@gmail.com", "password": "securepassword"})
if resp.status_code != 200:
    print("Login failed:", resp.text)
else:
    token = resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # We also need a workspace_id. Let's fetch one
    ws_url = "http://localhost:8000/api/v1/owner/workspaces"
    ws_resp = requests.get(ws_url, headers=headers)
    
    if ws_resp.status_code == 200 and len(ws_resp.json()) > 0:
        ws_id = ws_resp.json()[0]["id"]
        
        # Test chat API
        data = {
            "workspace_id": ws_id,
            "message": "hello test",
            "history": "[]"
        }
        chat_resp = requests.post(url, headers=headers, data=data)
        print("Chat Status:", chat_resp.status_code)
        print("Chat Response:", chat_resp.text)
    else:
        print("Failed to get workspace")
