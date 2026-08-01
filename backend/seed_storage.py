import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from faker import Faker

from app.db.session import AsyncSessionLocal
from app.models.tenant import Tenant
from app.models.user import User
from app.models.storage import StorageBucket, StorageFile, StorageBackup, StorageActivityLog, BucketType, FileCategory, BackupStatus

fake = Faker()

async def seed_storage_data():
    async with AsyncSessionLocal() as db:
        print("Starting storage seed...")
        
        # 1. Get existing tenants and users
        tenants = (await db.execute(select(Tenant))).scalars().all()
        if not tenants:
            print("No tenants found. Run normal seeder first.")
            return
            
        users = (await db.execute(select(User))).scalars().all()
        
        # 2. Create buckets
        bucket_types = [
            ("Data Insight Datasets", BucketType.datasets, False),
            ("Enterprise Reports", BucketType.reports, False),
            ("Platform Exports", BucketType.exports, False),
            ("AI Generated Output", BucketType.ai_generated, False),
            ("Public Images", BucketType.images, True),
            ("System Backups", BucketType.backups, False),
            ("System Logs", BucketType.logs, False)
        ]
        
        buckets = []
        for name, btype, is_public in bucket_types:
            existing = await db.scalar(select(StorageBucket).where(StorageBucket.name == name))
            if existing:
                buckets.append(existing)
                continue
                
            b = StorageBucket(
                name=name,
                bucket_type=btype,
                is_public=is_public,
                description=f"Storage for {name}",
                created_at=datetime.now(timezone.utc) - timedelta(days=90)
            )
            db.add(b)
            buckets.append(b)
            
        await db.commit()
        for b in buckets:
            await db.refresh(b)
            
        print(f"Created {len(buckets)} buckets.")

        # 3. Create Files
        existing_files = await db.scalar(select(StorageFile).limit(1))
        if existing_files:
            print("Files already seeded. Skipping.")
        else:
            files_to_create = []
            
            file_types = {
                FileCategory.document: ["application/pdf", "application/msword", "text/plain"],
                FileCategory.spreadsheet: ["text/csv", "application/vnd.ms-excel"],
                FileCategory.image: ["image/jpeg", "image/png", "image/svg+xml"],
                FileCategory.data: ["application/json", "application/sql", "application/parquet"],
                FileCategory.archive: ["application/zip", "application/x-tar"],
                FileCategory.other: ["application/octet-stream", "text/plain"],
            }
            
            for _ in range(5000): # Create 5000 files for scale
                tenant = random.choice(tenants)
                bucket = random.choice(buckets)
                
                # Match bucket to category
                if bucket.bucket_type == BucketType.datasets:
                    category = FileCategory.data
                elif bucket.bucket_type == BucketType.reports:
                    category = FileCategory.document
                elif bucket.bucket_type == BucketType.images:
                    category = FileCategory.image
                elif bucket.bucket_type == BucketType.exports:
                    category = random.choice([FileCategory.spreadsheet, FileCategory.archive])
                else:
                    category = random.choice(list(FileCategory))
                    
                ftype = random.choice(file_types[category])
                ext = ftype.split('/')[-1]
                if ext == "vnd.ms-excel": ext = "xlsx"
                if ext == "plain": ext = "txt"
                if ext == "x-tar": ext = "tar.gz"
                
                size = random.randint(1024 * 10, 1024 * 1024 * 50) # 10KB to 50MB
                if category == FileCategory.data:
                    size = random.randint(1024 * 1024 * 10, 1024 * 1024 * 500) # 10MB to 500MB
                    
                created_at = fake.date_time_between(start_date="-90d", end_date="now", tzinfo=timezone.utc)
                
                owner_id = random.choice(users).id if users else None
                
                f = StorageFile(
                    bucket_id=bucket.id,
                    tenant_id=tenant.id,
                    owner_id=owner_id,
                    file_name=f"{fake.word()}_{fake.random_number(digits=4)}.{ext}",
                    file_path=f"{tenant.id}/{bucket.name}/{fake.uuid4()}.{ext}",
                    file_size_bytes=size,
                    file_type=ftype,
                    category=category,
                    is_public=bucket.is_public,
                    is_encrypted=True,
                    is_malware_scanned=random.choice([True, True, True, False]),
                    download_count=random.randint(0, 100),
                    created_at=created_at
                )
                files_to_create.append(f)
                
            db.add_all(files_to_create)
            await db.commit()
            print(f"Created {len(files_to_create)} files.")
            
        # 4. Create Backups
        existing_backups = await db.scalar(select(StorageBackup).limit(1))
        if not existing_backups:
            backups = []
            for i in range(20):
                completed = random.choice([True, True, True, False])
                started = fake.date_time_between(start_date="-30d", end_date="now", tzinfo=timezone.utc)
                
                b = StorageBackup(
                    name=f"Automated Backup {started.strftime('%Y-%m-%d')}",
                    type=random.choice(["full", "incremental", "snapshot"]),
                    status=BackupStatus.completed if completed else BackupStatus.failed,
                    size_bytes=random.randint(1024*1024*500, 1024*1024*1024*10), # 500MB to 10GB
                    is_automated=True,
                    scheduled_for=started,
                    started_at=started,
                    completed_at=started + timedelta(minutes=random.randint(10, 120)) if completed else None
                )
                backups.append(b)
            db.add_all(backups)
            await db.commit()
            print("Created backups.")
            
        # 5. Create Activity Logs
        existing_logs = await db.scalar(select(StorageActivityLog).limit(1))
        if not existing_logs:
            logs = []
            actions = ["file.uploaded", "file.deleted", "file.downloaded", "bucket.created", "backup.completed"]
            for _ in range(100):
                tenant = random.choice(tenants)
                action = random.choice(actions)
                log = StorageActivityLog(
                    tenant_id=tenant.id,
                    action=action,
                    resource_type=action.split(".")[0],
                    created_at=fake.date_time_between(start_date="-7d", end_date="now", tzinfo=timezone.utc),
                    metadata_json={"ip": fake.ipv4(), "user_agent": fake.user_agent()}
                )
                logs.append(log)
            db.add_all(logs)
            await db.commit()
            print("Created activity logs.")
            
        print("Storage seed completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_storage_data())
