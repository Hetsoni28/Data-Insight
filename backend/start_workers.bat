@echo off
echo Starting Redis via Docker...
cd ..
docker compose up -d redis
cd backend

echo Starting Celery Worker...
start cmd /k ".venv\Scripts\celery -A app.worker.celery_app worker --loglevel=info -P gevent"

echo Starting Celery Beat (Scheduler)...
start cmd /k ".venv\Scripts\celery -A app.worker.celery_app beat --loglevel=info"

echo Workers are starting in separate windows!
