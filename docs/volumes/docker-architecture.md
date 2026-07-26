# Docker & Deployment Architecture

For an enterprise application like Data Insight, we cannot rely on just running `npm run dev` and `uvicorn` in separate terminals. We need a production-mirrored local environment.

To achieve this, we use **Docker Compose**. This ensures that every developer on the team has the exact same environment, and it perfectly matches production.

---

## 1. The Local Development Stack

Our `docker-compose.yml` will orchestrate **4 containers**:

1. **Frontend Container:** Runs the Next.js 15 App Router.
2. **Backend Container:** Runs the FastAPI web server.
3. **Worker Container:** Runs the Celery worker for AI processing and Excel generation.
4. **Redis Container:** The message broker that allows FastAPI to send tasks to Celery.

*(Note: We do not put Supabase in this Docker Compose file if we are using Supabase Cloud, which is recommended for the fastest development speed. If we want local Postgres, we can add it later via the Supabase CLI).*

---

## 2. The Blueprint: `docker-compose.yml`

This file will live in the root of your project (`C:\Users\Het\OneDrive\Desktop\data-insight\docker-compose.yml`).

```yaml
version: '3.8'

services:
  # 1. Next.js Frontend
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    depends_on:
      - backend

  # 2. FastAPI Backend
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - REDIS_URL=redis://redis:6379/0
      - ENV=development
    depends_on:
      - redis
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # 3. Celery Worker (Uses the same Backend codebase)
  worker:
    build: 
      context: ./backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app
    environment:
      - REDIS_URL=redis://redis:6379/0
      - ENV=development
    depends_on:
      - redis
      - backend
    command: celery -A app.worker.celery_app worker --loglevel=info

  # 4. Redis (Message Broker)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## 3. The Blueprint: Backend `Dockerfile.dev`

This goes inside the `backend/` folder. It sets up Python, installs dependencies, and prepares the environment for FastAPI or Celery to run.

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (needed for compiling Pandas/WeasyPrint)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# We don't COPY the source code here because in Dev mode, 
# docker-compose uses a Volume to map your local files in real-time.
```

---

## 4. The Blueprint: Frontend `Dockerfile.dev`

This goes inside the `frontend/` folder.

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# We don't COPY the source code here because in Dev mode, 
# docker-compose uses a Volume to map your local files in real-time.

# Start Next.js in development mode
CMD ["npm", "run", "dev"]
```

---

## How You Will Use This

Once we scaffold the physical folders, setting up the project on any computer in the world becomes a single command:

```bash
docker-compose up --build
```

1. It will download Python, Node, and Redis.
2. It will install all pip and npm packages automatically inside the containers.
3. It will boot up Next.js on `localhost:3000`.
4. It will boot up FastAPI on `localhost:8000`.
5. It will connect FastAPI to the Celery worker via Redis.
6. **Hot-reloading works:** Because we use "Volumes" in the `docker-compose.yml`, every time you save a `.py` or `.tsx` file on your Windows machine, the Docker container instantly updates and reloads the server.
