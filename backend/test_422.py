import requests

# Dummy JWT header (since we just want to see validation error, we need a valid-looking token or wait, validation happens BEFORE auth if dependencies are ordered right? Usually auth happens first if it's Depends, but let's just bypass by seeing if we get 401 or 422).
# Wait, let's login first
login_url = "http://localhost:8001/api/v1/auth/login"
resp = requests.post(login_url, json={"email": "hetsony143@gmail.com", "password": "securepassword"})
token = resp.json().get("access_token", "dummy")

headers = {"Authorization": f"Bearer {token}"}
url = "http://localhost:8001/api/v1/owner/ai/chat"

# Send form data without 'files'
data = {
    "workspace_id": "dummy",
    "message": "hello",
    "history": "[]"
}

resp = requests.post(url, headers=headers, data=data)
print("Status:", resp.status_code)
print("Response:", resp.text)
