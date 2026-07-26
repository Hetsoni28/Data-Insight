# Enterprise FastAPI Architecture Specification

This document defines the "Main" architectural patterns specifically for **FastAPI** in the Data Insight platform. It outlines exactly how FastAPI features (Dependencies, Middleware, Lifespans, Pydantic) are leveraged to create a world-class, production-ready system.

---

## 1. Application Factory & Lifespan

We do not use global database connections or global state. We use the FastAPI **Application Factory** pattern combined with the new **Lifespan** async context manager. This ensures the app boots up and shuts down cleanly, which is critical for Docker and Kubernetes deployments.

```python
# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api.v1 import api_router
from app.core.config import settings
from app.db.session import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Redis pools, warm up AI models, connect to DB
    print("Starting up Data Insight API...")
    yield
    # Shutdown: Cleanly close DB connections and Redis
    print("Shutting down Data Insight API...")
    await engine.dispose()

def create_app() -> FastAPI:
    app = FastAPI(
        title="Data Insight API",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.ENV == "development" else None, # Hide docs in prod
    )
    
    # Register CORS, Middlewares, and Routers
    app.include_router(api_router, prefix="/api/v1")
    return app

app = create_app()
```

---

## 2. Dependency Injection for Security & Multi-Tenancy

FastAPI's strongest feature is `Depends()`. We use it to enforce security at the router level so that a developer can never "forget" to check permissions.

### The Security Dependency
This dependency runs on every protected route. It validates the Supabase JWT and extracts the `tenant_id`.

```python
# app/core/dependencies.py
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import verify_supabase_token

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    user_data = await verify_supabase_token(token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
    # Returns a dictionary or Pydantic model containing user_id and tenant_id
    return user_data 
```

### Usage in a Router
```python
@router.get("/datasets")
async def get_datasets(
    current_user: dict = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    # We now have GUARANTEED access to current_user["tenant_id"]
    pass
```

---

## 3. Pydantic v2: Strict Validation

Data Insight uses **Pydantic v2** because it is written in Rust and is 10-50x faster than v1. We use strict typing to ensure dirty data never touches the database.

### Schema Blueprint
```python
# app/schemas/dataset_schema.py
from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime

class DatasetBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=255, description="Name of the dataset")
    
class DatasetCreate(DatasetBase):
    file_url: str = Field(..., pattern=r"^https?://.*") # Must be a valid URL

class DatasetResponse(DatasetBase):
    id: UUID
    tenant_id: UUID
    status: str
    created_at: datetime
    
    # This allows Pydantic to read data directly from SQLAlchemy ORM models
    model_config = ConfigDict(from_attributes=True) 
```

---

## 4. Centralized Error Handling

We never use `try/except` in routers to handle business logic errors. Instead, we raise custom Exceptions in the Service layer, and FastAPI automatically intercepts them using a global Exception Handler.

### Defining the Custom Exception
```python
# app/core/exceptions.py
class TenantQuotaExceededException(Exception):
    def __init__(self, message: str):
        self.message = message
```

### Registering the Handler
```python
# app/main.py
from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.exceptions import TenantQuotaExceededException

@app.exception_handler(TenantQuotaExceededException)
async def quota_exceeded_handler(request: Request, exc: TenantQuotaExceededException):
    return JSONResponse(
        status_code=402, # Payment Required
        content={
            "error": "Quota_Exceeded",
            "message": exc.message,
            "upgrade_url": "/billing"
        }
    )
```

---

## 5. Background Tasks vs. Celery

FastAPI has a built-in `BackgroundTasks` feature. However, in an enterprise app, we must differentiate between lightweight and heavyweight tasks.

| Task Type | Examples | Tool Used | Why? |
|---|---|---|---|
| **Lightweight** | Sending a welcome email, updating a DB timestamp. | `fastapi.BackgroundTasks` | Fast, no external infrastructure needed. Runs in the same process. |
| **Heavyweight** | Generating an AI Excel file, running Prophet ML, parsing 50MB CSV. | `Celery` + `Redis` | If the FastAPI pod restarts, `BackgroundTasks` are lost. Celery queues survive restarts and can be scaled to hundreds of dedicated worker servers. |

### FastAPI Lightweight Background Task Example
```python
from fastapi import BackgroundTasks

@router.post("/invite")
async def invite_user(email: str, background_tasks: BackgroundTasks):
    # This will run after the HTTP response is sent
    background_tasks.add_task(send_email_service, email)
    return {"message": "Invite sent"}
```

---

## 6. Environment Variables (Pydantic BaseSettings)

We never use `os.getenv()`. We use Pydantic `BaseSettings` so that environment variables are type-checked at startup. If an environment variable is missing, the app refuses to boot.

```python
# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENV: str = "development"
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    OPENAI_API_KEY: str
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
```

## Summary
This FastAPI architecture guarantees that Data Insight will be type-safe, strictly validated, securely scoped by tenant, and capable of handling high-throughput AI workloads without crashing the web server.
