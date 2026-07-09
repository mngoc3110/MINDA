import re

with open("frontend/src/app/(dashboard)/my-students/page.tsx", "r") as f:
    content = f.read()

# 1. Add ClassGroup interface
content = re.sub(
    r"interface Student \{",
    r"interface ClassGroup {\n  class_name: string;\n  academic_year: string | null;\n  is_graduated: boolean;\n}\n\ninterface Student {",
    content
)

# 2. Update classes state
content = re.sub(
    r"const \[classes, setClasses\] = useState<string\[\]>\(\[\]\);",
    r"const [classes, setClasses] = useState<ClassGroup[]>([]);\n  const [newAcademicYear, setNewAcademicYear] = useState(\"\");",
    content
)

# 3. Update fetch API
content = content.replace(
    "/api/profile/my-classes",
    "/api/profile/my-class-groups"
)
content = re.sub(
    r"setExpandedClasses\(new Set\(\[\"__all__\", \"__unclassified__\", \.\.\.cls\]\)\);",
    r"setExpandedClasses(new Set([\"__all__\", \"__unclassified__\", ...cls.map((c: any) => c.class_name)]));",
    content
)

# 4. Handle Create Class
create_class_old = """  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    if (!classes.includes(newClassName.trim())) {
      setClasses((prev) => [...prev, newClassName.trim()]);
      setExpandedClasses((prev) => new Set([...prev, newClassName.trim()]));
    }
    setNewClassName("");
    setShowNewClass(false);
  };"""
create_class_new = """  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    if (!classes.some(c => c.class_name === newClassName.trim())) {
      setClasses((prev) => [...prev, { class_name: newClassName.trim(), academic_year: newAcademicYear || null, is_graduated: false }]);
      setExpandedClasses((prev) => new Set([...prev, newClassName.trim()]));
    }
    setNewClassName("");
    setNewAcademicYear("");
    setShowNewClass(false);
  };

  const handleGraduate = async (className: string, isGraduated: boolean) => {
    try {
      const res = await fetch(`${API}/api/profile/graduate-class`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ class_name: className, is_graduated: isGraduated })
      });
      if (res.ok) {
        setClasses(prev => prev.map(c => c.class_name === className ? { ...c, is_graduated: isGraduated } : c));
      }
    } catch (e) { console.error(e); }
  };"""
content = content.replace(create_class_old, create_class_new)

# 5. Grouping logic
group_old = """  classes.forEach((c) => {
    if (!studentsByClass.has(c)) studentsByClass.set(c, []);
  });

  const allClassNames = [...classes, ...Array.from(studentsByClass.keys())].filter((v, i, a) => a.indexOf(v) === i);"""
group_new = """  classes.forEach((c) => {
    if (!studentsByClass.has(c.class_name)) studentsByClass.set(c.class_name, []);
  });

  const activeClasses = classes.filter(c => !c.is_graduated);
  const graduatedClasses = classes.filter(c => c.is_graduated);

  const groupedActiveClasses = new Map<string, ClassGroup[]>();
  activeClasses.forEach(c => {
    const year = c.academic_year || "Chưa phân năm học";
    if (!groupedActiveClasses.has(year)) groupedActiveClasses.set(year, []);
    groupedActiveClasses.get(year)!.push(c);
  });
  
  const activeClassNames = activeClasses.map(c => c.class_name);
  const graduatedClassNames = graduatedClasses.map(c => c.class_name);
  const allClassNames = classes.map(c => c.class_name);"""
content = content.replace(group_old, group_new)

# 6. Render Group Header - add action buttons slot
header_old = """        <span className={`text-xs px-3 py-1 rounded-full font-bold ${colorClass === 'text-indigo-400' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-text-muted border border-white/10'}`}>
          {students.length} HS
        </span>
      </div>"""
header_new = """        <span className={`text-xs px-3 py-1 rounded-full font-bold ${colorClass === 'text-indigo-400' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-text-muted border border-white/10'}`}>
          {students.length} HS
        </span>
        {groupKey !== "__unclassified__" && !groupKey.startsWith("__year__") && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const c = classes.find(x => x.class_name === groupKey);
              if (c) handleGraduate(c.class_name, !c.is_graduated);
            }}
            className="ml-2 p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors"
            title="Đổi trạng thái Tốt nghiệp"
          >
            🎓
          </button>
        )}
      </div>"""
content = content.replace(header_old, header_new)

# 7. Add New Class Form with Academic Year
new_class_old = """<input
            type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
            placeholder="Tên lớp mới (VD: Lớp 12-2026)..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 text-text-primary"
            onKeyDown={(e) => e.key === "Enter" && handleCreateClass()}
            autoFocus
          />"""
new_class_new = """<input
            type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
            placeholder="Tên lớp mới..."
            className="w-1/3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 text-text-primary"
            autoFocus
          />
          <input
            type="text" value={newAcademicYear} onChange={(e) => setNewAcademicYear(e.target.value)}
            placeholder="Năm học (VD: 2024-2025)..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 text-text-primary"
            onKeyDown={(e) => e.key === "Enter" && handleCreateClass()}
          />"""
content = content.replace(new_class_old, new_class_new)

# 8. Render Classes Logic
render_old = """            {/* Classes */}
            {allClassNames.map((className) => {
              const students = studentsByClass.get(className) || [];
              const isExpanded = expandedClasses.has(className);

              return (
                <div key={className} className="bg-bg-card rounded-2xl border border-border-card overflow-hidden">
                  {renderGroupHeader(className, students, <GraduationCap className="w-5 h-5 text-indigo-400 shrink-0" />, "text-indigo-400", className)}
                  {isExpanded && (
                    <div className="border-t border-border-card divide-y divide-border-card">
                      {students.length === 0 ? (
                        <p className="text-sm text-text-muted px-6 py-4 italic">Chưa có học sinh nào trong lớp này. Bấm "Chọn nhiều HS" để gán hàng loạt!</p>
                      ) : (
                        students.map((s) => renderStudent(s))
                      )}
                    </div>
                  )}
                </div>
              );
            })}"""
render_new = """            {/* Active Classes Grouped By Year */}
            {Array.from(groupedActiveClasses.entries()).map(([year, classGroups]) => (
              <div key={year} className="mb-6">
                <h3 className="font-bold text-text-muted text-sm uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Năm học: {year}
                </h3>
                <div className="space-y-3">
                  {classGroups.map((c) => {
                    const students = studentsByClass.get(c.class_name) || [];
                    const isExpanded = expandedClasses.has(c.class_name);
                    return (
                      <div key={c.class_name} className="bg-bg-card rounded-2xl border border-border-card overflow-hidden shadow-sm">
                        {renderGroupHeader(c.class_name, students, <GraduationCap className="w-5 h-5 text-indigo-400 shrink-0" />, "text-indigo-400", c.class_name)}
                        {isExpanded && (
                          <div className="border-t border-border-card divide-y divide-border-card">
                            {students.length === 0 ? (
                              <p className="text-sm text-text-muted px-6 py-4 italic">Chưa có học sinh nào trong lớp này.</p>
                            ) : (
                              students.map((s) => renderStudent(s))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}"""
content = content.replace(render_old, render_new)

# 9. Add Graduated Section at the bottom
unclassified_old = """            {/* Unclassified */}"""
unclassified_new = """            {/* Graduated Classes */}
            {graduatedClasses.length > 0 && (
              <div className="mb-6 opacity-70 hover:opacity-100 transition-opacity">
                <h3 className="font-bold text-text-muted text-sm uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                  Lưu trữ / Đã Tốt Nghiệp 🎓
                </h3>
                <div className="space-y-3">
                  {graduatedClasses.map((c) => {
                    const students = studentsByClass.get(c.class_name) || [];
                    const isExpanded = expandedClasses.has(c.class_name);
                    return (
                      <div key={c.class_name} className="bg-bg-card rounded-2xl border border-border-card overflow-hidden">
                        {renderGroupHeader(c.class_name, students, <GraduationCap className="w-5 h-5 text-gray-400 shrink-0" />, "text-gray-400", c.class_name)}
                        {isExpanded && (
                          <div className="border-t border-border-card divide-y divide-border-card">
                            {students.length === 0 ? (
                              <p className="text-sm text-text-muted px-6 py-4 italic">Chưa có học sinh nào.</p>
                            ) : (
                              students.map((s) => renderStudent(s))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unclassified */}"""
content = content.replace(unclassified_old, unclassified_new)

# 10. Update Add Students Modal to use academic year
# Wait, add-student-to-class API just takes academic_year from the class automatically in backend! So we just pass class_name.
# But if it's a new class? We don't have new class in the modal, we only select existing classes. So it's fine!

with open("frontend/src/app/(dashboard)/my-students/page.tsx", "w") as f:
    f.write(content)

