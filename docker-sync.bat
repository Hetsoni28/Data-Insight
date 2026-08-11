@echo off
echo ========================================================
echo Docker Sync: Pulling Latest Code and Rebuilding Containers
echo ========================================================

echo.
echo [1/3] Pulling latest code from Git...
git pull

echo.
echo [2/3] Stopping existing Docker containers...
docker-compose down

echo.
echo [3/3] Rebuilding and starting Docker containers...
echo (Backend migrations will run automatically on startup)
docker-compose up --build -d

echo.
echo ========================================================
echo Docker Sync Complete! Your containers are running in the background.
echo You can view logs with: docker-compose logs -f
echo ========================================================
pause
