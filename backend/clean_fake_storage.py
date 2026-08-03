import asyncio
from sqlalchemy import text, select, func
from app.db.session import AsyncSessionLocal
from app.models.storage import StorageFile, StorageBucket, StorageBackup, StorageActivityLog

async def clean_fake_storage():
    async with AsyncSessionLocal() as session:
        # Check count of storage files
        count = await session.scalar(select(func.count(StorageFile.id)))
        print(f"Current storage files in DB: {count}")
        
        # Delete fake storage files
        await session.execute(text("DELETE FROM storage_files;"))
        await session.execute(text("DELETE FROM storage_backups;"))
        await session.execute(text("DELETE FROM storage_activity_logs;"))
        await session.commit()
        
        remaining = await session.scalar(select(func.count(StorageFile.id)))
        print(f"Purged fake storage data. Remaining storage files: {remaining}")

if __name__ == "__main__":
    asyncio.run(clean_fake_storage())
