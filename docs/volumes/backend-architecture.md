# Backend Architecture Design

This document details the exact engineering architecture for the Data Insight FastAPI backend. It enforces **Clean Architecture**, **SOLID principles**, and **Tier 3 Multi-Tenant Isolation**.

---

## 1. The Core Philosophy: Clean Architecture

Data Insight strictly separates concerns into isolated layers. This ensures that a change in the database ORM does not break the API, and a change in the API does not break the business logic.

```
Request → Router ↔ Service ↔ Repository ↔ Database
                        ↕
                    AI Engine / Celery
```

### The 4 Golden Rules
1. **Routers** ONLY handle HTTP (Pydantic validation, Status Codes).
2. **Services** ONLY handle Business Logic (Decisions, AI calls, Auth checks).
3. **Repositories** ONLY handle Database Operations (SQLAlchemy queries).
4. **Models** ONLY define Database structure.

---

## 2. The Multi-Tenant Request Lifecycle

Because this is a multi-tenant SaaS, **every single API request** must be securely scoped to a specific company (tenant) to prevent data leaks. We handle this via **FastAPI Dependency Injection**.

### How a request is processed:

1. **Client Request:** `GET /api/v1/datasets` with `Authorization: Bearer <token>`
2. **Middleware (Dependency Injection):** 
   - `get_current_user` decodes the JWT via Supabase Auth.
   - Extracts the `user_id` and `tenant_id`.
   - Fetches the user's `role` (Admin/Viewer) for this tenant.
3. **Database Session Injection:**
   - The router injects an `AsyncSession` that is strictly bound to this request.
4. **Service Execution:**
   - The router passes the `tenant_id` and `AsyncSession` to the `DatasetService`.
5. **Repository Execution:**
   - The `DatasetRepository` executes: `SELECT * FROM datasets WHERE tenant_id = <tenant_id>`.
   - **Security Guarantee:** It is impossible for a user to see another tenant's data because `tenant_id` is derived from their cryptographic JWT token, not from user input.

---

## 3. Code Implementation Blueprints

To understand how this looks in practice, here is the blueprint for how we write code across the three main layers.

### Layer 1: The API Router (`app/api/v1/datasets.py`)
*Notice how there is absolutely no database logic here. It only handles HTTP.*

```python
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.dataset_schema import DatasetResponse, DatasetCreate
from app.services.dataset_service import DatasetService
from app.core.dependencies import get_current_user, get_db

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.post("/", response_model=DatasetResponse, status_code=201)
async def create_dataset(
    payload: DatasetCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Pass execution to the Service Layer
    service = DatasetService(db)
    dataset = await service.process_and_save_dataset(
        tenant_id=current_user["tenant_id"],
        user_id=current_user["user_id"],
        data=payload
    )
    return dataset
```

### Layer 2: The Service Layer (`app/services/dataset_service.py`)
*This is the "Brain". It contains the business logic, triggers Celery tasks, and calls the repository.*

```python
from app.repositories.dataset_repo import DatasetRepository
from app.worker.tasks import analyze_dataset_task

class DatasetService:
    def __init__(self, db: AsyncSession):
        self.repo = DatasetRepository(db)

    async def process_and_save_dataset(self, tenant_id: str, user_id: str, data: DatasetCreate):
        # 1. Business Logic: Check if tenant has enough storage quota
        if not await self._check_quota(tenant_id):
            raise QuotaExceededException("Storage limit reached.")
            
        # 2. Save to database via Repository
        dataset = await self.repo.create(
            tenant_id=tenant_id, 
            name=data.name, 
            file_url=data.file_url
        )
        
        # 3. Trigger Async AI Profiling Task (Celery)
        # We don't wait for this to finish, we return to the user immediately
        analyze_dataset_task.delay(dataset_id=dataset.id, tenant_id=tenant_id)
        
        # 4. Log the action for enterprise auditing
        await self._log_audit(tenant_id, user_id, "DATASET_UPLOADED", dataset.id)
        
        return dataset
```

### Layer 3: The Repository Layer (`app/repositories/dataset_repo.py`)
*This is the ONLY place where SQLAlchemy is imported and used.*

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.dataset import Dataset

class DatasetRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, tenant_id: str, name: str, file_url: str) -> Dataset:
        dataset = Dataset(
            tenant_id=tenant_id,
            name=name,
            file_url=file_url,
            status="PROCESSING"
        )
        self.db.add(dataset)
        await self.db.commit()
        await self.db.refresh(dataset)
        return dataset
        
    async def get_all_for_tenant(self, tenant_id: str):
        # SECURITY: Always enforce tenant_id at the DB layer
        query = select(Dataset).where(Dataset.tenant_id == tenant_id)
        result = await self.db.execute(query)
        return result.scalars().all()
```

---

## 4. The AI & Celery Asynchronous Pipeline

For operations like the **AI Excel Generator**, a synchronous API call will time out (browsers time out after 30-60 seconds, but generating an AI Excel file takes 1-3 minutes).

### The Celery Architecture Pattern:
1. **Frontend** sends `POST /api/v1/excel/generate`.
2. **FastAPI** creates a job record in the DB (status: `PENDING`).
3. **FastAPI** queues the task in **Redis** via Celery: `generate_excel_task.delay(job_id)`.
4. **FastAPI** returns `{ "job_id": "123", "status": "PENDING" }` to the frontend instantly (HTTP 202 Accepted).
5. **Frontend** starts polling `GET /api/v1/jobs/123` (or connects via Server-Sent Events).
6. **Celery Worker** picks up the job from Redis.
7. **Celery Worker** runs the heavy Pandas + Claude 3.5 Sonnet + XlsxWriter pipeline.
8. **Celery Worker** finishes, uploads the `.xlsx` to Supabase, and updates the DB job status to `COMPLETED` with the `file_url`.
9. **Frontend** sees `COMPLETED` and downloads the file.

---

## 5. Security & Error Handling

- **Centralized Error Handling:** We use a global exception handler in FastAPI. If a Service raises `ResourceNotFoundException`, FastAPI automatically catches it and returns a `404 JSON` response. The Router doesn't need `try/except` blocks.
- **Pydantic v2 Validation:** Every incoming request payload is strictly validated. If a user sends a string instead of an integer, FastAPI rejects it with a `422 Unprocessable Entity` before the router even runs.
- **SQL Injection Prevention:** SQLAlchemy ORM ensures all queries are parameterized. We never execute raw SQL strings. 

## Summary
By enforcing this **Clean Architecture** via our custom `data-insight-architect` skill, the backend will be highly testable, infinitely scalable, and completely secure for enterprise clients.
