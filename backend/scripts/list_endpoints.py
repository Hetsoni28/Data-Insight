import asyncio
from app.main import app

print(f"Total routes registered: {len(app.routes)}")
print("=" * 80)
for route in app.routes:
    methods = getattr(route, "methods", None)
    path = getattr(route, "path", None)
    name = getattr(route, "name", None)
    endpoint = getattr(route, "endpoint", None)
    endpoint_name = endpoint.__name__ if endpoint else "Unknown"
    tags = getattr(route, "tags", [])
    print(f"{list(methods) if methods else 'N/A'} | {path} -> {endpoint_name} (tags: {tags})")
