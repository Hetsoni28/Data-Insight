#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Data Insight — Backend Startup Script
# This script ALWAYS runs before uvicorn starts.
# It ensures database migrations are always up-to-date automatically.
# Any developer who pulls new code will get the correct DB schema automatically.
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Exit immediately if any command fails

echo "=============================================="
echo " Data Insight Backend — Startup"
echo "=============================================="

echo "[1/3] Waiting for database to be ready..."
# Wait for PostgreSQL to accept connections
until python -c "
import asyncio, sys
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

async def check():
    try:
        engine = create_async_engine(settings.DATABASE_URL)
        async with engine.connect() as conn:
            await conn.execute(__import__('sqlalchemy').text('SELECT 1'))
        await engine.dispose()
        print('Database is ready!')
        return True
    except Exception as e:
        print(f'Database not ready: {e}')
        return False

result = asyncio.run(check())
sys.exit(0 if result else 1)
" 2>/dev/null; do
    echo "  ⏳ Database not ready, retrying in 2 seconds..."
    sleep 2
done

echo "[2/3] Running database migrations (alembic upgrade head)..."
cd /app && alembic upgrade head
echo "  ✅ Database migrations complete!"

echo "[3/3] Starting FastAPI server..."
echo "=============================================="
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
