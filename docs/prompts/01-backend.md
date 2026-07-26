# Backend (FastAPI) Prompt Blueprint

When generating backend code for Data Insight, you must adhere strictly to these rules:

## 1. Clean Architecture Enforcement
- **Routers (`app/api/v1/`)**: Must ONLY handle HTTP validation (Pydantic), calling the service, and returning the response. NO business logic. NO database queries.
- **Services (`app/services/`)**: The ONLY place where business logic lives.
- **Repositories (`app/repositories/`)**: The ONLY place where SQLAlchemy queries live. Services call Repositories.
- **Models (`app/models/`)**: SQLAlchemy tables.
- **Schemas (`app/schemas/`)**: Pydantic models for request/response validation.

## 2. API Design Rules
- All endpoints must be asynchronous (`async def`).
- Use dependency injection for DB sessions (`db: AsyncSession = Depends(get_db)`).
- Use dependency injection for authentication (`current_user = Depends(get_current_user)`).
- Return standard JSON responses with proper HTTP status codes.

## 3. Celery / Async Tasks
- Any task that takes longer than 2 seconds (e.g., AI calls, Excel generation) MUST be offloaded to a Celery worker.
- The router should return a `job_id` and status `202 Accepted`.

## 4. Error Handling
- Never return raw database errors to the client.
- Use custom exception classes defined in `app/core/exceptions.py`.
- Ensure all validation errors are properly formatted using Pydantic.
