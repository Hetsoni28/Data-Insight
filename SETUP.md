# 🚀 Data Insight — Developer Setup Guide

> **For every new developer joining the project. Read this before running anything.**

---

## ✅ Prerequisites

| Tool | Version | Install |
|---|---|---|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop/ |
| Git | Any | https://git-scm.com/ |
| Node.js (optional, for local dev) | 20+ | https://nodejs.org/ |
| Python (optional, for local dev) | 3.12+ | https://python.org/ |

---

## ⚡ Quick Start (First Time)

### 1. Clone the repo
```bash
git clone https://github.com/Hetsoni28/Data-Insight.git
cd Data-Insight
```

### 2. Set up environment variables
```bash
# Backend
cp backend/.env.example backend/.env
# Then edit backend/.env and fill in your real values:
# - DATABASE_URL (your PostgreSQL connection string)
# - GEMINI_API_KEY (your Google AI API key)
# - SECRET_KEY (any random 32-char string)
# - SUPABASE_URL, SUPABASE_KEY (your Supabase project)

# Frontend
cp frontend/.env.local.example frontend/.env.local
# Then edit frontend/.env.local and fill in:
# - NEXT_PUBLIC_API_URL=http://localhost:8000
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Start everything
```bash
docker compose up --build
```

> ✅ **That's it!** The system automatically:
> - Builds all Docker images
> - Runs all database migrations (`alembic upgrade head`)
> - Starts the frontend, backend, worker, scheduler, and Redis

---

## 🌐 Service URLs

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **API Docs (Swagger)** | http://localhost:8000/docs |
| **Celery Flower** | http://localhost:5555 |

---

## 🔄 After Pulling New Code

When you run `git pull` and a teammate has added new features, **just restart the containers**:

```bash
docker compose down
docker compose up --build
```

The `start.sh` script in the backend **automatically runs `alembic upgrade head`** on every startup, so your database schema is always up-to-date. You never need to run migrations manually.

---

## ❌ Common Errors & Fixes

### Error: "Network Error" on Login Page
**Cause:** The Next.js `.next` cache got corrupted.  
**Fix:** The Dockerfile already handles this — it wipes `.next` on every startup. Just restart:
```bash
docker compose restart frontend
```

### Error: "Authentication failed" / 500 on Login
**Cause:** Database tables are missing (new migration wasn't run).  
**Fix:** This is automatically handled by `start.sh`. Just restart the backend:
```bash
docker compose restart backend
```
Or run migrations manually if needed:
```bash
docker compose exec backend alembic upgrade head
```

### Error: "column X of relation Y contains null values"
**Cause:** A migration was written without a default value for a new NOT NULL column.  
**Fix:** Find the migration file in `backend/app/db/migrations/versions/` and add `server_default`:
```python
# ❌ Wrong — will crash on existing data
sa.Column('mfa_enabled', sa.Boolean(), nullable=False)

# ✅ Correct — safe for existing rows
sa.Column('mfa_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false'))
```

### Error: Docker says "image not found"
**Cause:** Docker Desktop is not running.  
**Fix:** Open Docker Desktop from your taskbar and wait for it to fully start, then retry.

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │ Frontend │───▶│ Backend  │───▶│   PostgreSQL DB  │  │
│  │ Next.js  │    │ FastAPI  │    │   (Supabase)     │  │
│  │ :3000    │    │ :8000    │    └──────────────────┘  │
│  └──────────┘    └────┬─────┘                          │
│                       │                                 │
│                  ┌────▼─────┐    ┌──────────────────┐  │
│                  │  Redis   │◀───│  Celery Worker   │  │
│                  │  :6379   │    │  (AI Reports,    │  │
│                  └──────────┘    │   Datasets, etc) │  │
│                                  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Adding New Dependencies

**Backend (Python):**
```bash
# 1. Add the package to backend/requirements.txt
# 2. Rebuild the image
docker compose build backend
docker compose up backend
```

**Frontend (Node):**
```bash
# 1. Add it via npm
docker compose exec frontend npm install <package-name>
# 2. The package.json and package-lock.json are auto-updated
# 3. Commit both files
git add frontend/package.json frontend/package-lock.json
```

---

## 🗄 Creating a New Database Migration

```bash
# 1. Make changes to a model in backend/app/models/
# 2. Generate the migration script
docker compose exec backend alembic revision --autogenerate -m "describe_your_change"

# 3. IMPORTANT: Review the generated file in backend/app/db/migrations/versions/
#    Make sure all new NOT NULL columns have server_default values!

# 4. Apply the migration
docker compose exec backend alembic upgrade head
```

---

*Last updated: August 2026*
