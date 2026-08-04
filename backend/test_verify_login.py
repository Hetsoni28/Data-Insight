import httpx
import asyncio

async def test_verify():
    async with httpx.AsyncClient() as client:
        # Step 1: Send a bad request to see the Pydantic error
        payload = {
            "email": "test@example.com",
            # "password": "pass", # OMITTING PASSWORD
            "otp": "123456"
        }
        res = await client.post("http://127.0.0.1:8000/api/v1/auth/verify-login", json=payload)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")

if __name__ == "__main__":
    asyncio.run(test_verify())
