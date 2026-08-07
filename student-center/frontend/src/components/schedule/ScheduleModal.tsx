import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: number) => void;
  initialData?: any;
  courses: any[];
  students?: any[];
  userRole: string;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  courses,
  students = [],
  userRole
}: ScheduleModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    type: "personal",
    course_id: "",
    student_id: "",
    location: "",
    color: "#3b82f6",
    is_recurring: false,
    repeat_weeks: 12
  });

  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  const toLocalISOString = (date: Date | string) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        start_time: initialData.start_time ? toLocalISOString(initialData.start_time) : "",
        end_time: initialData.end_time ? toLocalISOString(initialData.end_time) : "",
        type: initialData.type || "personal",
        course_id: initialData.course_id?.toString() || "",
        student_id: initialData.student_id?.toString() || "",
        location: initialData.location || "",
        color: initialData.color || "#3b82f6",
        is_recurring: false,
        repeat_weeks: 12
      });
      if (initialData.student_ids && Array.isArray(initialData.student_ids) && initialData.student_ids.length > 0) {
        setSelectedStudentIds(initialData.student_ids);
      } else if (initialData.student_id) {
        setSelectedStudentIds([initialData.student_id]);
      } else {
        setSelectedStudentIds([]);
      }
    } else {
      setFormData({
        title: "",
        description: "",
        start_time: toLocalISOString(new Date()),
        end_time: toLocalISOString(new Date(Date.now() + 3600000)),
        type: "personal",
        course_id: "",
        student_id: "",
        location: "",
        color: "#3b82f6",
        is_recurring: false,
        repeat_weeks: 12
      });
      setSelectedStudentIds([]);
    }
    setStudentSearch("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      start_time: formData.start_time,
      end_time: formData.end_time,
      course_id: formData.type === "course_session" && formData.course_id ? parseInt(formData.course_id) : null,
      student_id: formData.type === "student" && selectedStudentIds.length > 0 ? selectedStudentIds[0] : (formData.student_id ? parseInt(formData.student_id) : null),
      student_ids: formData.type === "student" && selectedStudentIds.length > 0 ? selectedStudentIds : null,
    };
    onSave(payload);
  };

  const isReadOnly = initialData && initialData.user_id !== undefined && 
    (initialData.type === "course_session" || initialData.type === "student") && 
    userRole === "student";

  const filteredStudents = (students || []).filter(s =>
    s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const toggleStudent = (id: number) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllStudents = () => {
    setSelectedStudentIds(filteredStudents.map(s => s.id));
  };

  const deselectAllStudents = () => {
    setSelectedStudentIds([]);
  };

  const handleCourseChange = (courseIdStr: string) => {
    const selectedCourse = courses.find(c => c.id.toString() === courseIdStr);
    setFormData(prev => ({
      ...prev,
      course_id: courseIdStr,
      title: prev.title === "" || courses.some(c => c.title === prev.title) ? (selectedCourse?.title || prev.title) : prev.title
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            {initialData ? (isReadOnly ? "Chi tiết Lịch học" : "Cập nhật sự kiện") : "Tạo sự kiện mới"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề</label>
            <input
              type="text"
              required
              readOnly={isReadOnly}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Học nhóm Toán 10 - 2k11"
            />
          </div>

          {(userRole === "teacher" || userRole === "admin") && !isReadOnly && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại sự kiện</label>
              <select
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="personal">👤 Lịch cá nhân</option>
                <option value="course_session">📚 Chọn thẳng Lớp học (Tất cả học sinh trong lớp sẽ thấy)</option>
                <option value="student">👥 Lịch chọn theo Học sinh (Chọn 1 hoặc NHIỀU học sinh)</option>
              </select>
            </div>
          )}

          {formData.type === "course_session" && (!initialData || !isReadOnly) && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-1">
              <label className="block text-sm font-bold text-blue-900 mb-1">⚡ Chọn thẳng Lớp học</label>
              <select
                required
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-semibold"
                value={formData.course_id}
                onChange={(e) => handleCourseChange(e.target.value)}
              >
                <option value="">-- Chọn lớp học --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>📚 {c.title}</option>
                ))}
              </select>
              <p className="text-xs text-blue-600 mt-1">Hệ thống sẽ tự gán lịch cho tất cả học sinh đã ghi danh trong lớp này.</p>
            </div>
          )}

          {formData.type === "student" && (!initialData || !isReadOnly) && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-800">
                  👥 Chọn học sinh <span className="text-blue-600">({selectedStudentIds.length} đã chọn)</span>
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAllStudents} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                    Chọn tất cả
                  </button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={deselectAllStudents} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="🔍 Tìm tên hoặc email học sinh..."
                className="w-full px-3 py-1.5 border rounded-lg text-xs outline-none focus:border-blue-500 text-slate-900 bg-white"
              />

              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 bg-white p-2 rounded-lg border border-slate-200">
                {filteredStudents.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Không tìm thấy học sinh phù hợp</p>
                ) : (
                  filteredStudents.map(s => {
                    const isChecked = selectedStudentIds.includes(s.id);
                    return (
                      <label key={s.id} className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-xs transition-colors ${isChecked ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-slate-50 text-slate-700"}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStudent(s.id)}
                          className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                        />
                        <span className="truncate flex-1">{s.full_name} <span className="text-slate-400 font-normal">({s.email})</span></span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
          
          {isReadOnly && initialData.course_title && (
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Lớp học</label>
               <input type="text" readOnly className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-600" value={initialData.course_title} />
             </div>
          )}

          {isReadOnly && initialData.student_name && (
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Lịch gán cho</label>
               <input type="text" readOnly className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-600" value={initialData.student_name} />
             </div>
          )}



          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bắt đầu (1 buổi học)</label>
              <input
                type="datetime-local"
                required
                readOnly={isReadOnly}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kết thúc (1 buổi học)</label>
              <input
                type="datetime-local"
                required
                readOnly={isReadOnly}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          {!isReadOnly && (
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                />
                <span className="text-sm font-medium text-slate-700">Lặp lại hàng tuần (Dành cho Lịch cố định)</span>
              </label>
              
              {formData.is_recurring && (
                <div className="flex items-center gap-3 pl-6">
                  <label className="text-sm text-slate-600">Số tuần lặp lại:</label>
                  <select
                    className="px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={formData.repeat_weeks}
                    onChange={(e) => setFormData({ ...formData, repeat_weeks: parseInt(e.target.value) })}
                  >
                    <option value={4}>4 tuần (1 tháng)</option>
                    <option value={8}>8 tuần (2 tháng)</option>
                    <option value={12}>12 tuần (3 tháng)</option>
                    <option value={16}>16 tuần (4 tháng)</option>
                    <option value={24}>24 tuần (6 tháng)</option>
                    <option value={48}>48 tuần (1 năm)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Địa điểm / Link học</label>
            <input
              type="text"
              readOnly={isReadOnly}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="VD: Phòng 101, Google Meet..."
            />
          </div>

          {!isReadOnly && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Màu hiển thị</label>
              <input
                type="color"
                className="w-full h-10 border rounded-xl p-1 cursor-pointer"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          )}

          {!isReadOnly && (
            <div className="pt-4 flex justify-between gap-3">
              {initialData && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(initialData.id)}
                  className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl font-medium transition-colors"
                >
                  Xoá sự kiện
                </button>
              )}
              <div className="flex gap-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium shadow-md shadow-blue-500/20 transition-all"
                >
                  Lưu
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
