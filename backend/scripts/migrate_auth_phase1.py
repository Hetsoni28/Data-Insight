"""Migration script for Phase 1 Enterprise Auth.

Applies:
- users table columns (token_version, mfa_enabled, mfa_secret, mfa_recovery_codes, failed_login_attempts, locked_until)
- user_sessions columns (country, city)
- refresh_tokens table creation
- login_history table creation
"""

import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.db.session import engine, Base
import app.models.user
import app.models.auth
import app.models.user_session

async def run_migration():
    print("[Phase 1 Migration] Starting database schema synchronization...")
    async with engine.begin() as conn:
        # 1. Create tables via Base metadata if they don't exist
        await conn.run_sync(Base.metadata.create_all)

        # 2. Add columns to users table safely if missing
        user_cols = [
            ("token_version", "INTEGER DEFAULT 1 NOT NULL"),
            ("mfa_enabled", "BOOLEAN DEFAULT FALSE NOT NULL"),
            ("mfa_secret", "VARCHAR(255) NULL"),
            ("mfa_recovery_codes", "JSONB NULL"),
            ("failed_login_attempts", "INTEGER DEFAULT 0 NOT NULL"),
            ("locked_until", "TIMESTAMPTZ NULL"),
        ]
        for col_name, col_type in user_cols:
            try:
                await conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                print(f"  + Checked column: users.{col_name}")
            except Exception as e:
                print(f"  ! Column users.{col_name} check: {e}")

        # 3. Add columns to user_sessions table safely if missing
        session_cols = [
            ("country", "VARCHAR(100) DEFAULT 'Unknown' NULL"),
            ("city", "VARCHAR(100) DEFAULT 'Unknown' NULL"),
        ]
        for col_name, col_type in session_cols:
            try:
                await conn.execute(text(f"ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                print(f"  + Checked column: user_sessions.{col_name}")
            except Exception as e:
                print(f"  ! Column user_sessions.{col_name} check: {e}")

    print("[Phase 1 Migration] Schema migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_migration())
