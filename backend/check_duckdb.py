import asyncio, sys, json, uuid
sys.path.insert(0, '/app')
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def run():
    async with AsyncSessionLocal() as db:
        # Get the dataset
        result = await db.execute(text("SELECT id, name, file_url, status FROM datasets WHERE name ILIKE '%churn%' ORDER BY created_at DESC LIMIT 1"))
        row = result.fetchone()
        if not row:
            print('No dataset found')
            return
        
        ds_id, ds_name, file_url, status = row
        print(f'Dataset: {ds_name}')
        print(f'ID: {ds_id}')
        print(f'File URL: {file_url}')
        print(f'Status: {status}')
        
        # Try executing a DuckDB query directly via DatasetService
        from app.services.dataset import DatasetService
        
        # Get a user to test with
        user_result = await db.execute(text("SELECT id, tenant_id, role FROM users WHERE role = 'manager' LIMIT 1"))
        user_row = user_result.fetchone()
        if not user_row:
            user_result = await db.execute(text("SELECT id, tenant_id, role FROM users WHERE is_owner = true LIMIT 1"))
            user_row = user_result.fetchone()
        
        if user_row:
            print(f'Using user: {user_row[0]} role={user_row[2]}')
        
        # Try DuckDB query on the file directly
        try:
            import duckdb
            conn = duckdb.connect()
            conn.execute(f"CREATE VIEW dataset AS SELECT * FROM read_parquet('{file_url}')")
            result_df = conn.execute('SELECT SUM(TRY_CAST("#" AS DOUBLE)) as total FROM dataset').fetchdf()
            print(f'DuckDB SUM(#): {result_df}')
            result_df2 = conn.execute('SELECT SUM(TRY_CAST("Monthly" AS DOUBLE)) as total FROM dataset').fetchdf()
            print(f'DuckDB SUM(Monthly): {result_df2}')
            result_df3 = conn.execute('SELECT COUNT(*) as cnt FROM dataset').fetchdf()
            print(f'DuckDB COUNT: {result_df3}')
        except Exception as e:
            print(f'DuckDB direct error: {e}')

asyncio.run(run())
