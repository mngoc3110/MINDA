#!/usr/bin/env python3
"""Re-upload Bài 10 + 11, update DB."""
import requests, os

API = "https://minda.io.vn/api"
TOKEN = open("/Users/minhngoc/HCMUE/MINDA/student-center/.minda_token").read().strip()
SCORM = "/Users/minhngoc/HCMUE/MINDA/SVTT-MINH NGỌC - BỘ GIÁO ÁN BÀI DẠY/_SCORM_FIXED"

def upload(bai):
    zp = os.path.join(SCORM, f"Bai_{bai}_SCORM.zip")
    sz = os.path.getsize(zp) / 1024 / 1024
    print(f"📄 Bài {bai} ({sz:.1f} MB)...")
    with open(zp, "rb") as f:
        r = requests.post(f"{API}/files/upload_scorm",
            headers={"Authorization": f"Bearer {TOKEN}"},
            files={"file": (f"Bai_{bai}_SCORM.zip", f, "application/zip")},
            timeout=600)
    if r.status_code != 200:
        print(f"  ❌ {r.status_code}: {r.text[:200]}")
        return None
    url = r.json().get("file_url", "")
    print(f"  ✅ URL: {url}")
    return url

results = {}
for bai in [10, 11]:
    url = upload(bai)
    if url:
        results[bai] = url

print(f"\n📋 SQL to update lessons:")
# Bài 10 = lesson ID 6, Bài 11 = lesson ID 8
mapping = {10: 6, 11: 8}
for bai, url in results.items():
    lid = mapping[bai]
    print(f"UPDATE lessons SET document_url = '{url}' WHERE id = {lid};")
