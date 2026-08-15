import os
import sys

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.storage import _client, DATASETS_BUCKET, REPORTS_BUCKET

def create_buckets():
    client = _client()
    
    # Check existing buckets
    try:
        buckets = client.storage.list_buckets()
        existing_bucket_names = [b.name for b in buckets]
        print(f"Existing buckets: {existing_bucket_names}")
    except Exception as e:
        print(f"Error listing buckets: {e}")
        existing_bucket_names = []
    
    if DATASETS_BUCKET not in existing_bucket_names:
        try:
            client.storage.create_bucket(DATASETS_BUCKET, {"public": False})
            print(f"Bucket '{DATASETS_BUCKET}' created.")
        except Exception as e:
            print(f"Failed to create bucket '{DATASETS_BUCKET}': {e}")
    else:
        print(f"Bucket '{DATASETS_BUCKET}' already exists.")

    if REPORTS_BUCKET not in existing_bucket_names:
        try:
            client.storage.create_bucket(REPORTS_BUCKET, {"public": False})
            print(f"Bucket '{REPORTS_BUCKET}' created.")
        except Exception as e:
            print(f"Failed to create bucket '{REPORTS_BUCKET}': {e}")
    else:
        print(f"Bucket '{REPORTS_BUCKET}' already exists.")

if __name__ == "__main__":
    create_buckets()
