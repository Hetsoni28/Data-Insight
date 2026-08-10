import requests

token_res = requests.post("http://localhost:8000/api/v1/auth/login", data={"username": "admin@acme.com", "password": "securepassword123"})
token = token_res.json()["access_token"]

headers = {"Authorization": f"Bearer {token}"}
payload = {
    "provider": "postgres",
    "host": "localhost",
    "port": 5432,
    "database": "data_insight",
    "username": "admin",
    "password": "password"
}

res = requests.post("http://localhost:8000/api/v1/tenant-settings/data-connections/test", headers=headers, json=payload)
print(res.status_code)
print(res.json())
