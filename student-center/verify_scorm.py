#!/usr/bin/env python3
"""
Kiểm tra toàn bộ SCORM packages lần cuối + nén vào 1 folder sạch.
"""
import os, zipfile, re

FIXED = "/Users/minhngoc/HCMUE/MINDA/SVTT-MINH NGỌC - BỘ GIÁO ÁN BÀI DẠY/_SCORM_FIXED"
OUTPUT = "/Users/minhngoc/HCMUE/MINDA/SVTT-MINH NGỌC - BỘ GIÁO ÁN BÀI DẠY/SCORM_READY"

BAIS = [5, 6, 7, 8, 9, 10, 11]
errors = []

os.makedirs(OUTPUT, exist_ok=True)

print("=" * 65)
print("🔍 KIỂM TRA TOÀN BỘ SCORM PACKAGES")
print("=" * 65)

for bai in BAIS:
    work = os.path.join(FIXED, f"Bai_{bai}_scorm")
    print(f"\n{'─'*55}")
    print(f"📄 Bài {bai}")
    
    if not os.path.isdir(work):
        print(f"  ❌ Folder không tồn tại!")
        errors.append(f"Bài {bai}: missing folder")
        continue
    
    # Check 1: imsmanifest.xml
    manifest = os.path.join(work, "imsmanifest.xml")
    if not os.path.exists(manifest):
        print(f"  ❌ Thiếu imsmanifest.xml!")
        errors.append(f"Bài {bai}: no manifest")
        continue
    print(f"  ✅ imsmanifest.xml tồn tại")
    
    # Check 2: index.html entry point
    if not os.path.exists(os.path.join(work, "index.html")):
        print(f"  ❌ Thiếu index.html!")
        errors.append(f"Bài {bai}: no index.html")
        continue
    print(f"  ✅ index.html tồn tại")
    
    # Check 3: manifest trỏ đúng index.html
    with open(manifest, 'r', encoding='utf-8') as f:
        mc = f.read()
    match = re.search(r'<resource[^>]+href="([^"]+)"', mc)
    entry = match.group(1) if match else "???"
    if entry == "index.html":
        print(f"  ✅ Manifest href → index.html")
    else:
        print(f"  ⚠️  Manifest href → {entry} (không phải index.html)")
        errors.append(f"Bài {bai}: manifest href={entry}")
    
    # Check 4: Không còn .mov/.MOV references
    mov_refs = []
    for root, dirs, files in os.walk(work):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            if f.endswith(('.html', '.js', '.xml')):
                fp = os.path.join(root, f)
                with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
                    content = fh.read()
                if '.mov' in content.lower():
                    rel = os.path.relpath(fp, work)
                    mov_refs.append(rel)
    if mov_refs:
        print(f"  ⚠️  Còn .mov refs trong: {', '.join(mov_refs)}")
        errors.append(f"Bài {bai}: .mov refs in {mov_refs}")
    else:
        print(f"  ✅ Không còn .mov references")
    
    # Check 5: Không còn file .mov
    mov_files = []
    for root, dirs, files in os.walk(work):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            if f.lower().endswith('.mov'):
                mov_files.append(os.path.relpath(os.path.join(root, f), work))
    if mov_files:
        print(f"  ⚠️  Còn file .mov: {', '.join(mov_files)}")
        errors.append(f"Bài {bai}: .mov files {mov_files}")
    else:
        print(f"  ✅ Không còn file .mov")
    
    # Check 6: SCORM JS wrapper
    has_scorm = False
    for root, dirs, files in os.walk(work):
        for f in files:
            if f.endswith('.js'):
                fp = os.path.join(root, f)
                with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
                    if 'LMSInitialize' in fh.read() or 'scorm' in f.lower():
                        has_scorm = True
                        break
    print(f"  {'✅' if has_scorm else '⚠️ '} SCORM JS wrapper: {'có' if has_scorm else 'không tìm thấy'}")
    
    # List files
    all_files = []
    total_size = 0
    for root, dirs, files in os.walk(work):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            if f.startswith('.'): continue
            fp = os.path.join(root, f)
            sz = os.path.getsize(fp)
            total_size += sz
            all_files.append((os.path.relpath(fp, work), sz))
    
    print(f"  📁 {len(all_files)} files, tổng {total_size/1024/1024:.1f} MB")
    
    # Re-zip into OUTPUT folder  
    out_zip = os.path.join(OUTPUT, f"Bai_{bai}_SCORM.zip")
    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(work):
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for f in files:
                if f.startswith('.'): continue
                abs_p = os.path.join(root, f)
                rel_p = os.path.relpath(abs_p, work)
                zf.write(abs_p, rel_p)
    zip_sz = os.path.getsize(out_zip) / (1024*1024)
    print(f"  📦 → {os.path.basename(out_zip)} ({zip_sz:.1f} MB)")

print(f"\n{'='*65}")
if errors:
    print(f"⚠️  {len(errors)} VẤN ĐỀ CẦN XEM LẠI:")
    for e in errors:
        print(f"   • {e}")
else:
    print("✅ TẤT CẢ SCORM ĐỀU CHUẨN!")

print(f"\n📁 Output folder: {OUTPUT}")
print(f"{'='*65}")

# List final output
print(f"\nDanh sách file:")
for f in sorted(os.listdir(OUTPUT)):
    if f.endswith('.zip'):
        sz = os.path.getsize(os.path.join(OUTPUT, f)) / (1024*1024)
        print(f"  📦 {f} ({sz:.1f} MB)")
