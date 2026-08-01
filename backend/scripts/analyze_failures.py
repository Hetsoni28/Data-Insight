import json

with open("/app/scripts/test_results.json", "r") as f:
    results = json.load(f)

print(f"Total results: {len(results)}")
print("\n" + "="*80)
print("ALL 500 SERVER ERRORS:")
print("="*80)
for r in results:
    if r["is_500"]:
        print(f"FAILED: {r['method']} {r['path']} | Status: {r['status_code']} | Cat: {r['category']}")
        print(f"Detail: {r['detail']}\n")

print("\n" + "="*80)
print("OTHER NON-PASSING ENDPOINTS:")
print("="*80)
for r in results:
    if not r["passed"] and not r["is_500"]:
        print(f"STATUS {r['status_code']}: {r['method']} {r['path']} | Cat: {r['category']}")
        print(f"Detail: {r['detail']}\n")
