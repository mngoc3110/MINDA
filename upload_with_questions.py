"""
MINDA Upload Tool - Đề thi Tin học
- Split Bộ 10/20 đề thành từng assignment riêng
- Parse đáp án từ nhiều dạng bảng Word
- Xoá assignment cũ rồi upload lại
"""
import requests, json, os, re, sys
import docx
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph

BASE_URL  = "http://14.225.206.241:8000"
EMAIL     = "darber3110@gmail.com"
PASSWORD  = "Bin@31102004"
FOLDER_ID = 10
EXAM_FORMAT = "tin_thptqg"
TARGET_DIR = "/Users/macbook/Desktop/coding/projects/MINDA/de_tin_hoc"

# ── helpers ───────────────────────────────────────────────
def login():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      data={"username": EMAIL, "password": PASSWORD})
    if r.status_code == 200:
        print("✅ Đăng nhập thành công!")
        return r.json()["access_token"]
    sys.exit(f"❌ Login thất bại: {r.text}")

def delete_old(token):
    h = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/api/assignments/teacher/dashboard/assignments", headers=h)
    if r.status_code != 200: return
    cnt = 0
    for a in r.json():
        if a.get("folder_id") == FOLDER_ID:
            requests.delete(f"{BASE_URL}/api/assignments/{a['id']}", headers=h)
            print(f"  🗑  [{a['id']}] {a['title']}")
            cnt += 1
    print(f"✅ Đã xoá {cnt} assignment cũ.\n")

def create_assignment(token, title, quiz_data):
    h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "title": title, "assignment_type": "quiz",
        "folder_id": FOLDER_ID, "is_assigned_to_all": True,
        "exam_format": EXAM_FORMAT, "max_score": 10,
        "quiz_data": quiz_data,
        "description": "Đề thi thử TN THPT môn Tin học"
    }
    r = requests.post(f"{BASE_URL}/api/assignments", headers=h, json=payload)
    if r.status_code == 200:
        aid = r.json()["id"]
        print(f"  ✅ [{aid}] {title}")
        return aid
    print(f"  ❌ {r.text}")

# ── document element iterator ─────────────────────────────
def iter_blocks(doc):
    """Yield Paragraph / Table in document body order."""
    body = doc.element.body
    for child in body:
        if child.tag == qn('w:p'):
            yield Paragraph(child, doc)
        elif child.tag == qn('w:tbl'):
            yield Table(child, doc)

# ── answer table parsers ──────────────────────────────────
def parse_mcq_table(table):
    """Return {q_num: letter} from any MCQ answer table."""
    ans = {}
    rows = table.rows
    if not rows: return ans
    cells0 = [c.text.strip() for c in rows[0].cells]
    h0 = [c.lower() for c in cells0]

    # Format A (vertical pairs):  Câu | Đáp án | Câu | Đáp án …
    if h0[0] in ('câu', 'cầu') and len(rows) > 1:
        pair_cols = []
        i = 0
        while i < len(h0):
            if h0[i] in ('câu', 'cầu'):
                for j in range(i+1, min(i+4, len(h0))):
                    hj = h0[j]
                    if 'đáp' in hj or hj in ('a','b','c','d','chọn'):
                        pair_cols.append((i, j)); break
                i = j+1 if pair_cols else i+1
            else:
                i += 1
        if not pair_cols:
            pair_cols = [(i, i+1) for i in range(0, len(h0)-1, 2)]
        for row in rows[1:]:
            cs = [c.text.strip() for c in row.cells]
            for qc, ac in pair_cols:
                if qc >= len(cs) or ac >= len(cs): continue
                q, a = cs[qc].strip(), cs[ac].strip().upper()
                if q.isdigit() and a in 'ABCD':
                    ans[int(q)] = a
        if ans: return ans

    # Format B (horizontal with header): Câu | 1 2 3 ... / Chọn | A B C ...
    # Format C (horizontal NO header):   1 2 3 ...  /  A B C ...
    i = 0
    while i < len(rows) - 1:
        r0 = [c.text.strip() for c in rows[i].cells]
        r1 = [c.text.strip() for c in rows[i+1].cells]
        r0l = r0[0].lower()
        r1l = r1[0].lower()
        # Format B: explicit header labels
        if r0l in ('câu', 'cầu') and r1l in ('chọn', 'đáp án', 'đáp an'):
            for col in range(1, min(len(r0), len(r1))):
                q, a = r0[col].strip(), r1[col].strip().upper()
                if q.isdigit() and a in 'ABCD':
                    ans[int(q)] = a
            i += 2
        # Format C: first row all digits, second row all letters
        elif all(c.strip().isdigit() or c.strip()=='' for c in r0) and \
             all(c.strip().upper() in ('A','B','C','D','') for c in r1) and \
             any(c.strip().isdigit() for c in r0):
            for col in range(len(r0)):
                q = r0[col].strip()
                a = r1[col].strip().upper() if col < len(r1) else ''
                if q.isdigit() and a in 'ABCD':
                    ans[int(q)] = a
            i += 2
        else:
            i += 1
    return ans

def parse_tf_table(table):
    """Return {q_num: {label: bool}} from TF answer table."""
    ans = {}
    rows = table.rows
    if not rows: return ans
    cells0 = [c.text.strip() for c in rows[0].cells]
    h0 = [c.lower() for c in cells0]

    def to_bool(s):
        return s.strip().lower() in ('đ', 'đúng', 'true', 't')

    def decode_compact(q_num, compact):
        """Decode 'ĐSĐS' or 'ĐSSĐ' string to {a:T/F, b:T/F, c:T/F, d:T/F}."""
        mapping = {}
        labels = ['a','b','c','d']
        for idx, ch in enumerate(compact.strip()):
            if idx >= 4: break
            mapping[labels[idx]] = ch.upper() in ('Đ', 'T', 'D')
        return mapping

    # Format COMPACT: row 0 = question numbers, row 1 = 'ĐSĐS' strings
    # e.g. ['25','26','27'] / ['ĐSĐS','ĐSSĐ','SĐSĐ']
    if len(rows) == 2:
        r0 = [c.text.strip() for c in rows[0].cells]
        r1 = [c.text.strip() for c in rows[1].cells]
        is_compact = all(c.isdigit() or c=='' for c in r0) and \
                     all(re.match(r'^[ĐđSs]{2,4}$', c) or c=='' for c in r1)
        if is_compact:
            for col in range(len(r0)):
                q = r0[col].strip()
                v = r1[col].strip() if col < len(r1) else ''
                if q.isdigit() and v:
                    ans[int(q)] = decode_compact(int(q), v)
            if ans: return ans

    # Format A: Câu | a | b | c | d  (label columns)
    labels_as_cols = [h for h in h0 if h in ('a','b','c','d')]
    if len(labels_as_cols) >= 2:
        label_idx = {h: i for i, h in enumerate(h0) if h in ('a','b','c','d')}
        q_idx = next((i for i, h in enumerate(h0) if 'câu' in h or h.isdigit() or h == ''), 0)
        for row in rows[1:]:
            cs = [c.text.strip() for c in row.cells]
            if q_idx >= len(cs): continue
            q_txt = cs[q_idx].strip()
            if not q_txt.isdigit(): continue
            q_num = int(q_txt)
            ans[q_num] = {}
            for lbl, idx in label_idx.items():
                if idx < len(cs):
                    ans[q_num][lbl] = to_bool(cs[idx])
        if ans: return ans

    # Format B: 3-column groups (Câu | Lệnh hỏi | Đáp án Đ/S)
    is_tf = any('lệnh' in h or 'đ/s' in h or 'đúng' in h for h in h0)
    if is_tf:
        ncols = len(cells0)
        for row in rows[1:]:
            cs = [c.text.strip() for c in row.cells]
            for g in range(ncols // 3):
                b = g * 3
                if b+2 >= len(cs): continue
                q_txt, lbl_txt, ans_txt = cs[b], cs[b+1].lower(), cs[b+2]
                if q_txt.isdigit() and lbl_txt in ('a','b','c','d'):
                    q_num = int(q_txt)
                    if q_num not in ans: ans[q_num] = {}
                    ans[q_num][lbl_txt] = to_bool(ans_txt)
        if ans: return ans

    return ans

def is_exam_header(table):
    """Return (exam_num, title) if table is a ĐỀ N header, else None."""
    if not table.rows: return None
    first = table.rows[0].cells[0].text.strip()
    m = re.match(r'^(?:ĐỀ|DE)\s*(\d+)', first, re.IGNORECASE)
    if m:
        title = table.rows[0].cells[-1].text.strip().split('\n')[0] if len(table.rows[0].cells) > 1 else first
        return int(m.group(1)), title
    return None

def is_mcq_answer_table(table):
    if not table.rows or len(table.rows) < 2: return False
    h = [c.text.strip().lower() for c in table.rows[0].cells]
    r1 = [c.text.strip().lower() for c in table.rows[1].cells]
    
    # Format B: row 0 has 'câu', row 1 has 'đáp' or 'chọn'
    if any(x in ('câu', 'cầu') for x in h) and any('đáp' in x or 'chọn' in x for x in r1):
        return True
        
    # Format A: Vertical explicitly
    has_cau = any(x in ('câu', 'cầu') for x in h)
    has_ans = any('đáp' in x or x in ('chọn', 'a','b','c','d') for x in h)
    if has_cau and has_ans: return True
    
    # No-header format: row 0 all digits, row 1 all A/B/C/D
    if all(c.isdigit() or c=='' for c in h) and \
       all(c.upper() in ('A','B','C','D','') for c in r1) and \
       any(c.isdigit() for c in h) and any(c.upper() in 'ABCD' for c in r1):
        return True
    return False

def is_tf_answer_table(table):
    if not table.rows: return False
    h = [c.text.strip().lower() for c in table.rows[0].cells]
    joined = ' '.join(h)
    if 'lệnh' in joined or 'đ/s' in joined or 'đúng' in joined: return True
    if all(x in ('a','b','c','d','câu','') for x in h) and \
       len([x for x in h if x in ('a','b','c','d')]) >= 2: return True
    # Compact format: row 0 = numbers, row 1 = 'ĐSĐS' strings
    if len(table.rows) == 2:
        r0 = [c.text.strip() for c in table.rows[0].cells]
        r1 = [c.text.strip() for c in table.rows[1].cells]
        if any(c.isdigit() for c in r0) and \
           any(re.match(r'^[ĐđSsDdTt]{2,4}$', c) for c in r1 if c):
            return True
    return False

# ── question paragraph parser ─────────────────────────────
re_q   = re.compile(r'^Câu\s+(\d+)[.\s](.+)', re.IGNORECASE)
re_ch_inline = re.compile(r'([ABCD])\.\s+(.+?)(?=\s+[ABCD]\.\s+|$)')
re_ch_solo   = re.compile(r'^\s*([ABCD])[.)]\s+(.+)', re.IGNORECASE)
re_part1 = re.compile(r'PH[AẦ]N\s+I(?!\s*I)', re.IGNORECASE)
re_part2 = re.compile(r'PH[AẦ]N\s+II', re.IGNORECASE)
re_tf_item = re.compile(r'^([abcd])[.)]\s+(.+)', re.IGNORECASE)

def table_to_text(table):
    """Extract all text from a table, preserving code formatting."""
    lines = []
    
    # Check for 2x2 Python/C++ code table
    if len(table.rows) == 2 and len(table.columns) == 2:
        r0 = [c.text.lower() for c in table.rows[0].cells]
        if any('python' in x or 'c++' in x for x in r0):
            for col in range(2):
                h = table.rows[0].cells[col].text.strip()
                c = table.rows[1].cells[col].text.strip()
                lines.append(f"[{h}]\n{c}\n")
            return '\n'.join(lines)

    for row in table.rows:
        cells = [c.text.strip() for c in row.cells if c.text.strip()]
        if not cells: continue
        
        # If it's a multi-column row with line breaks, separate them to avoid garbled code
        if len(cells) >= 2 and any('\n' in c for c in cells):
            for i, c in enumerate(cells):
                lines.append(f"--- Cột {i+1} ---")
                lines.append(c)
            lines.append("") # spacer
        else:
            lines.append('  |  '.join(cells))
    return '\n'.join(lines)


def build_quiz(mixed_blocks, mcq_ans, tf_ans):
    """Parse mixed list of (str | Table) → quiz_data.
    Strings are paragraph text; Tables are non-answer content tables."""
    mcq_qs = []
    tf_qs_chung = []
    tf_qs_khmt = []
    tf_qs_thud = []
    cur_tf_track = 'chung'
    cur_q = None
    cur_ch = {}
    cur_tf_q = None
    cur_tf_items = []
    cur_tf_stem = ""
    in2 = False
    pending_context = ""
    last_mcq_num = 0
    last_tf_num = 0

    def flush_mcq():
        nonlocal cur_q, cur_ch
        if cur_q and len(cur_ch) >= 2:
            n = cur_q['n']
            correct_letter = mcq_ans.get(n, 'A')
            letter_to_idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
            options = [cur_ch.get(k, '') for k in 'ABCD' if k in cur_ch]
            correct_idx = letter_to_idx.get(correct_letter, 0)
            correct_idx = min(correct_idx, len(options) - 1)
            mcq_qs.append({
                "id": f"q{n}", "text": cur_q['t'],
                "options": options,
                "correctAnswer": correct_idx
            })
        cur_q = None; cur_ch = {}

    def flush_tf():
        nonlocal cur_tf_q, cur_tf_items, cur_tf_stem
        if cur_tf_q and cur_tf_items:
            n = cur_tf_q
            ta = tf_ans.get(n, {})
            q_obj = {
                "id": f"q{n}", "text": cur_tf_stem,
                "items": [{"label": it['l'], "text": it['t'],
                           "isTrue": ta.get(it['l'], False)}
                          for it in cur_tf_items]
            }
            if cur_tf_track == 'chung': tf_qs_chung.append(q_obj)
            elif cur_tf_track == 'khmt': tf_qs_khmt.append(q_obj)
            else: tf_qs_thud.append(q_obj)
        cur_tf_q = None; cur_tf_items = []; cur_tf_stem = ""

    for block in mixed_blocks:
        # Non-answer table → append text to current question
        if isinstance(block, Table):
            ttext = table_to_text(block)
            if not ttext.strip(): continue
            if cur_tf_q:
                cur_tf_stem += '\n[Bảng]\n' + ttext
            elif cur_q:
                cur_q['t'] += '\n[Code]\n' + ttext
            else:
                pending_context += '\n[Bảng/Code]\n' + ttext + '\n'
            continue

        text = block  # it's a string
        if not text.strip(): continue
        
        # Detect track changes based on short headers
        lower_txt = text.strip().lower()
        if 'khoa học máy tính' in lower_txt and 'tin học ứng dụng' not in lower_txt and len(lower_txt) < 80:
            cur_tf_track = 'khmt'
        elif 'tin học ứng dụng' in lower_txt and 'khoa học máy tính' not in lower_txt and len(lower_txt) < 80:
            cur_tf_track = 'thud'
            
        if re_part2.search(text): in2 = True; flush_mcq(); continue
        if re_part1.search(text): in2 = False; continue

        if not in2:
            m = re_q.match(text)
            if m:
                flush_mcq()
                n = int(m.group(1))
                last_mcq_num = n
                stem = m.group(2).strip()
                if pending_context:
                    stem = pending_context.strip() + '\n\n' + stem
                    pending_context = ""
                inline = re_ch_inline.findall(text)
                if inline:
                    for lbl, txt in inline: cur_ch[lbl.upper()] = txt.strip()
                    stem = re.sub(r'\s+[ABCD]\.\s+.+$','', stem).strip()
                cur_q = {'n': n, 't': stem}
            else:
                inline = re_ch_inline.findall(text)
                ms = re_ch_solo.match(text)
                
                # Auto-infer missing Câu N if we suddenly see options
                if (inline or ms) and not cur_q:
                    flush_mcq()
                    last_mcq_num += 1
                    cur_q = {'n': last_mcq_num, 't': pending_context.strip()}
                    pending_context = ""
                    
                if cur_q:
                    if inline:
                        for lbl, txt in inline: cur_ch[lbl.upper()] = txt.strip()
                    else:
                        if ms: cur_ch[ms.group(1).upper()] = ms.group(2).strip()
                        else: cur_q['t'] += '\n' + text.strip()
                else:
                    pending_context += text.strip() + '\n'
        else:
            m = re_q.match(text)
            if m:
                flush_tf()
                n = int(m.group(1))
                last_tf_num = n
                cur_tf_q = n
                stem = m.group(2).strip()
                if pending_context:
                    stem = pending_context.strip() + '\n\n' + stem
                    pending_context = ""
                cur_tf_stem = stem
            else:
                mi = re_tf_item.match(text)
                
                # Auto-infer missing Câu N if we suddenly see a) b) c) d)
                if mi and not cur_tf_q:
                    flush_tf()
                    last_tf_num += 1
                    cur_tf_q = last_tf_num
                    cur_tf_stem = pending_context.strip()
                    pending_context = ""
                    
                if cur_tf_q:
                    if mi: cur_tf_items.append({'l': mi.group(1).lower(), 't': mi.group(2).strip()})
                    else: cur_tf_stem += '\n' + text.strip()
                else:
                    pending_context += text.strip() + '\n'

    flush_mcq(); flush_tf()

    sections = []
    if mcq_qs: 
        sections.append({"type":"mcq","title":"Phần I - Trắc nghiệm","questions":mcq_qs})
    if tf_qs_chung:  
        sections.append({"type":"true_false","title":"Phần II - Đúng/Sai (Phần Chung)","questions":tf_qs_chung})
    if tf_qs_khmt:   
        sections.append({"type":"true_false","title":"Phần II - Định hướng Khoa học máy tính","questions":tf_qs_khmt})
    if tf_qs_thud:   
        sections.append({"type":"true_false","title":"Phần II - Định hướng Tin học ứng dụng","questions":tf_qs_thud})
    return {"sections": sections}

# ── main parser: split multi-exam doc ────────────────────
def parse_doc(filepath):
    """Returns list of (title, quiz_data) — 1 item for single exam, N for multi."""
    doc = docx.Document(filepath)
    blocks = list(iter_blocks(doc))

    # Check if multi-exam (has ĐỀ N header tables)
    exam_starts = []
    for i, b in enumerate(blocks):
        if isinstance(b, Table):
            h = is_exam_header(b)
            if h: exam_starts.append((i, h[0], h[1]))

    if not exam_starts:
        # Single exam — pass mixed blocks (para text + content tables)
        mixed = []
        mcq_ans, tf_ans = {}, {}
        for b in blocks:
            if isinstance(b, Table):
                if is_tf_answer_table(b):  tf_ans.update(parse_tf_table(b))
                elif is_mcq_answer_table(b): mcq_ans.update(parse_mcq_table(b))
                elif not is_exam_header(b): mixed.append(b)  # content table
            else:
                mixed.append(b.text)
        qd = build_quiz(mixed, mcq_ans, tf_ans)
        base = os.path.basename(filepath).replace('.docx','').replace('thuvienhoclieu.com-','')
        return [(base.replace('-',' '), qd)]

    # Multi-exam: split by ĐỀ N markers
    results = []
    for idx_e, (start_i, exam_num, exam_title_raw) in enumerate(exam_starts):
        end_i = exam_starts[idx_e+1][0] if idx_e+1 < len(exam_starts) else len(blocks)
        seg = blocks[start_i+1:end_i]

        mixed = []
        mcq_ans, tf_ans = {}, {}
        for b in seg:
            if isinstance(b, Table):
                if is_tf_answer_table(b):  tf_ans.update(parse_tf_table(b))
                elif is_mcq_answer_table(b): mcq_ans.update(parse_mcq_table(b))
                elif not is_exam_header(b): mixed.append(b)  # content table
            else:
                mixed.append(b.text)

        qd = build_quiz(mixed, mcq_ans, tf_ans)
        total = sum(len(s.get('questions',[])) for s in qd.get('sections',[]))

        # Build title: clean from raw
        raw = exam_title_raw.replace('\n',' ').strip()
        m_nam = re.search(r'(NĂM\s+\d{4}|2025|2026)', raw, re.IGNORECASE)
        year = m_nam.group(0) if m_nam else ''
        title = f"Đề {exam_num} - Tin học THPT {year}".strip()

        print(f"  📄 Đề {exam_num}: MCQ ans={len(mcq_ans)}, TF ans={len(tf_ans)}, total câu={total}")
        if total > 0:
            results.append((title, qd))

    return results

# ── entry point ───────────────────────────────────────────
def main():
    print("="*60)
    print("🚀 MINDA Upload - Đề thi Tin học THPT")
    print("="*60)
    token = login()

    print("\n🗑  Xoá assignments cũ...")
    delete_old(token)

    files = sorted(f for f in os.listdir(TARGET_DIR) if f.endswith('.docx'))
    total_ok = 0

    for fname in files:
        path = os.path.join(TARGET_DIR, fname)
        print(f"\n📂 {fname}")
        try:
            exams = parse_doc(path)
            print(f"   → {len(exams)} đề")
            for title, qd in exams:
                n = sum(len(s.get('questions',[])) for s in qd.get('sections',[]))
                if n == 0:
                    print(f"  ⚠️  Bỏ qua (0 câu): {title}")
                    continue
                print(f"  💡 {n} câu | {title}")
                if create_assignment(token, title, qd):
                    total_ok += 1
        except Exception as e:
            import traceback; traceback.print_exc()
            print(f"  ❌ Lỗi: {e}")

    print(f"\n{'='*60}")
    print(f"🎉 Hoàn tất! {total_ok} assignments đã upload.")
    print("="*60)

if __name__ == "__main__":
    main()
