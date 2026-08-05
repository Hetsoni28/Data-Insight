@echo off
echo Starting Data Insight Local Development Environment...
echo ======================================================

echo [1/4] Starting Redis (via Docker)...
docker compose up -d redis

echo [2/4] Starting FastAPI Backend...
cd backend
start "Data Insight - Backend API" cmd /k "start_dev.bat"

echo [3/4] Starting Celery Workers...
start "Data Insight - Celery Worker" cmd /k ".venv\Scripts\celery -A app.worker.celery_app worker --loglevel=info -P gevent"
start "Data Insight - Celery Beat" cmd /k ".venv\Scripts\celery -A app.worker.celery_app beat --loglevel=info"
cd ..

echo [4/4] Starting Next.js Frontend...
cd frontend
start "Data Insight - Frontend UI" cmd /k "npm run dev"
cd ..

echo ======================================================
echo All services are starting up in separate windows!
echo - Frontend will be available at: http://localhost:3000
echo - Backend API will be available at: http://localhost:8000
echo ======================================================
