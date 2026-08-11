@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo Syncing Data Insight Project with Latest Remote Changes
echo ========================================================
echo.
echo WARNING: Pulling changes while development servers are running
echo can corrupt the Next.js cache and lock files during installation.
echo.
set /p stop_servers="Do you want to stop any running Node/Python dev servers now? (y/n) [n]: "
if /I "%stop_servers%"=="y" (
    echo Stopping Node.js processes...
    taskkill /F /IM node.exe >nul 2>&1
    echo Stopping Python processes...
    taskkill /F /IM python.exe >nul 2>&1
    echo Stopping Docker Compose containers (if any)...
    docker-compose down >nul 2>&1
)

echo.
echo [1/4] Cleaning frontend cache to prevent Turbopack corruption...
if exist frontend\.next (
    echo Wiping frontend\.next directory...
    rmdir /s /q frontend\.next
    if exist frontend\.next (
        echo ERROR: Failed to delete frontend\.next.
        echo A background process is likely locking it. Please kill Node.js manually.
        exit /b 1
    )
)

echo.
echo [2/4] Pulling latest code from Git...
git pull

echo.
echo [3/4] Installing any new Backend dependencies...
cd backend
call venv\Scripts\activate.bat
pip install -r requirements.txt

echo.
echo Running database migrations...
echo (Note: Ensure all strict columns in Alembic have a server_default set!)
alembic upgrade head
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Alembic migration failed!
    echo Please fix the migration files and run 'alembic upgrade head' manually.
    cd ..
    exit /b 1
)
cd ..

echo.
echo [4/4] Installing any new Frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ========================================================
echo Sync Complete! Your environment is fully up-to-date and clean.
echo You can now safely run your dev servers.
echo ========================================================
pause
