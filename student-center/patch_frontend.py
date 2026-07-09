import sys

with open("frontend/src/app/(dashboard)/my-students/page.tsx", "r") as f:
    content = f.read()

# 1. handleSearch
search_old = """      const res = await fetch(`${API}/api/profile/search-students?q=${encodeURIComponent(q)}`, {"""
search_new = """      const res = await fetch(`${API}/api/profile/search-students?q=${encodeURIComponent(q)}&class_name=${encodeURIComponent(addClassName)}`, {"""
content = content.replace(search_old, search_new)

# 2. handleRemoveStudent signature
remove_old = """  const handleRemoveStudent = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá "${name}" khỏi lớp?`)) return;
    try {
      const res = await fetch(`${API}/api/profile/remove-student/${id}`, {"""
remove_new = """  const handleRemoveStudent = async (id: number, name: string, className: string) => {
    if (!confirm(`Bạn có chắc muốn xoá "${name}" khỏi lớp?`)) return;
    try {
      const res = await fetch(`${API}/api/profile/remove-student/${id}?class_name=${encodeURIComponent(className)}`, {"""
content = content.replace(remove_old, remove_new)

# 3. handleMoveStudent signature
move_old = """  const handleMoveStudent = async (studentId: number, className: string) => {
    try {
      await fetch(`${API}/api/profile/update-student-class/${studentId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ class_name: className }),
      });"""
move_new = """  const handleMoveStudent = async (studentId: number, newClassName: string, oldClassName: string) => {
    try {
      await fetch(`${API}/api/profile/update-student-class/${studentId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ class_name: newClassName, old_class_name: oldClassName }),
      });"""
content = content.replace(move_old, move_new)

# 4. renderStudent
render_student_old = """          <button
            onClick={(e) => { e.stopPropagation(); setMovingStudent(s); }}
            className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
            title="Đổi lớp"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRemoveStudent(s.id, s.full_name); }}
            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Xoá khỏi lớp"
          >"""
render_student_new = """          <button
            onClick={(e) => { e.stopPropagation(); setMovingStudent(s); }}
            className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
            title="Đổi lớp"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRemoveStudent(s.id, s.full_name, s.class_name || "__unclassified__"); }}
            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Xoá khỏi lớp"
          >"""
content = content.replace(render_student_old, render_student_new)

# 5. Move Modal
move_modal_old = """              <button
                onClick={() => handleMoveStudent(movingStudent.id, "")}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${!movingStudent.class_name ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold' : 'border-border-card hover:bg-bg-hover'}`}
              >
                Không phân lớp
              </button>
              {allClassNames.map((c) => (
                <button
                  key={c}
                  onClick={() => handleMoveStudent(movingStudent.id, c)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm flex items-center gap-2 ${movingStudent.class_name === c ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold' : 'border-border-card hover:bg-bg-hover'}`}
                >"""
move_modal_new = """              <button
                onClick={() => handleMoveStudent(movingStudent.id, "", movingStudent.class_name || "__unclassified__")}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${!movingStudent.class_name ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold' : 'border-border-card hover:bg-bg-hover'}`}
              >
                Không phân lớp
              </button>
              {allClassNames.map((c) => (
                <button
                  key={c}
                  onClick={() => handleMoveStudent(movingStudent.id, c, movingStudent.class_name || "__unclassified__")}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm flex items-center gap-2 ${movingStudent.class_name === c ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold' : 'border-border-card hover:bg-bg-hover'}`}
                >"""
content = content.replace(move_modal_old, move_modal_new)

with open("frontend/src/app/(dashboard)/my-students/page.tsx", "w") as f:
    f.write(content)
