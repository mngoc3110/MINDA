#!/usr/bin/env python3
"""
Fix SCORM v2 - Xử lý MOV trong cả subfolder, rename entry → index.html, zip lại.
"""
import os, re, shutil, zipfile

BASE_DIR = "/Users/minhngoc/HCMUE/MINDA/SVTT-MINH NGỌC - BỘ GIÁO ÁN BÀI DẠY"
OUTPUT_DIR = os.path.join(BASE_DIR, "_SCORM_FIXED")

SCORM_FOLDERS = {
    5: "scorm_package",
    6: "scorm_package",
    7: "bai7-scorm",
    8: "scorm-b8",
    9: "baigiang_scorm",
    10: "scorm_package",
    11: "GiaoAn_Tuan10_SCORM",
}

def process_bai(bai_num, scorm_folder):
    src = os.path.join(BASE_DIR, f"Bài {bai_num}", scorm_folder)
    if not os.path.isdir(src):
        print(f"  ❌ Not found: {src}")
        return False

    work = os.path.join(OUTPUT_DIR, f"Bai_{bai_num}_scorm")
    if os.path.exists(work):
        shutil.rmtree(work)
    shutil.copytree(src, work)

    # 1. Find ALL .mov/.MOV files recursively and rename → .mp4
    mov_map = {}  # old_rel_path → new_rel_path
    for root, dirs, files in os.walk(work):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            if f.lower().endswith('.mov'):
                old_abs = os.path.join(root, f)
                new_name = os.path.splitext(f)[0] + ".mp4"
                new_abs = os.path.join(root, new_name)
                os.rename(old_abs, new_abs)
                old_rel = os.path.relpath(old_abs, work)
                new_rel = os.path.relpath(new_abs, work)
                mov_map[old_rel] = new_rel
                # Also map just the filename for simpler references
                mov_map[f] = new_name
                print(f"    🔄 {old_rel} → {new_rel}")

    # 2. Fix all HTML and JS files - replace .mov references
    if mov_map:
        for root, dirs, files in os.walk(work):
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for f in files:
                if f.endswith(('.html', '.js', '.xml')):
                    fpath = os.path.join(root, f)
                    with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                        content = fp.read()
                    original = content
                    for old, new in mov_map.items():
                        content = content.replace(old, new)
                    # Also do case-insensitive .MOV → .mp4
                    content = re.sub(r'\.MOV', '.mp4', content)
                    content = re.sub(r'\.mov', '.mp4', content)
                    if content != original:
                        with open(fpath, 'w', encoding='utf-8') as fp:
                            fp.write(content)
                        print(f"    ✅ Fixed refs: {os.path.relpath(fpath, work)}")

    # 2.5. Fix typo filenames (e.g. indedx.html → index.html) 
    for f in os.listdir(work):
        if f.lower().endswith('.html') and f != 'index.html':
            # Check for common typos of index.html
            if f.lower().replace(' ', '') in ['indedx.html', 'idnex.html', 'indx.html']:
                old_p = os.path.join(work, f)
                new_p = os.path.join(work, "index.html")
                if not os.path.exists(new_p):
                    os.rename(old_p, new_p)
                    print(f"    🔤 Fixed typo: {f} → index.html")

    # 3. Rename entry point to index.html (from manifest)
    manifest = os.path.join(work, "imsmanifest.xml")
    if os.path.exists(manifest):
        with open(manifest, 'r', encoding='utf-8') as f:
            mc = f.read()
        match = re.search(r'<resource[^>]+href="([^"]+)"', mc)
        if match:
            old_entry = match.group(1)
            if old_entry != "index.html":
                old_path = os.path.join(work, old_entry)
                new_path = os.path.join(work, "index.html")
                
                if os.path.exists(old_path):
                    if os.path.exists(new_path) and old_path != new_path:
                        # index.html exists as a DIFFERENT file - backup it
                        backup_name = f"_original_index.html"
                        backup_path = os.path.join(work, backup_name)
                        os.rename(new_path, backup_path)
                        # Update all references to old index.html in other HTML/JS files
                        for root2, _, files2 in os.walk(work):
                            for f2 in files2:
                                if f2.endswith(('.html', '.js')):
                                    fp2 = os.path.join(root2, f2)
                                    if fp2 == old_path: continue
                                    with open(fp2, 'r', encoding='utf-8', errors='ignore') as fh:
                                        c2 = fh.read()
                                    # Replace href="index.html" with backup name (only exact matches)
                                    c2_new = c2.replace('"index.html"', f'"{backup_name}"')
                                    c2_new = c2_new.replace("'index.html'", f"'{backup_name}'")
                                    if c2_new != c2:
                                        with open(fp2, 'w', encoding='utf-8') as fh:
                                            fh.write(c2_new)
                                        print(f"    📝 Updated ref in {os.path.relpath(fp2, work)}")
                        # Also update manifest
                        mc = mc.replace(f'<file href="index.html"/>', f'<file href="{backup_name}"/>')
                        print(f"    💾 Backed up index.html → {backup_name}")
                    
                    os.rename(old_path, new_path)
                    mc = mc.replace(f'href="{old_entry}"', 'href="index.html"')
                    mc = mc.replace(f'<file href="{old_entry}"/>', '<file href="index.html"/>')
                    print(f"    🔄 Entry: {old_entry} → index.html")
        with open(manifest, 'w', encoding='utf-8') as f:
            f.write(mc)

    # 4. Clean junk
    for junk in ['.vscode', '__MACOSX', '.DS_Store']:
        jp = os.path.join(work, junk)
        if os.path.isdir(jp): shutil.rmtree(jp)
        elif os.path.isfile(jp): os.remove(jp)

    # 5. Zip
    out_zip = os.path.join(OUTPUT_DIR, f"Bai_{bai_num}_SCORM.zip")
    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(work):
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for f in files:
                if f.startswith('.'): continue
                abs_p = os.path.join(root, f)
                rel_p = os.path.relpath(abs_p, work)
                zf.write(abs_p, rel_p)
    sz = os.path.getsize(out_zip) / (1024*1024)
    print(f"    📦 {os.path.basename(out_zip)} ({sz:.1f} MB)")
    return True

def main():
    print("=" * 60)
    print("🔧 Fix SCORM v2 - Recursive MOV fix + index.html")
    print("=" * 60)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ok = 0
    for bai in sorted(SCORM_FOLDERS):
        print(f"\n{'─'*50}\n📄 Bài {bai}")
        if process_bai(bai, SCORM_FOLDERS[bai]): ok += 1
    print(f"\n{'='*60}\n✅ {ok}/{len(SCORM_FOLDERS)} done → {OUTPUT_DIR}\n{'='*60}")

if __name__ == "__main__":
    main()
