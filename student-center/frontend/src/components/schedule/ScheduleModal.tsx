import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: number) => void;
  initialData?: any;
  courses: any[];
  userRole: string;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  courses,
  userRole
}: ScheduleModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    type: "personal",
    course_id: "",
    location: "",
    color: "#3b82f6"
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        start_time: initialData.start_time ? new Date(initialData.start_time).toISOString().slice(0, 16) : "",
        end_time: initialData.end_time ? new Date(initialData.end_time).toISOString().slice(0, 16) : "",
        type: initialData.type || "personal",
        course_id: initialData.course_id?.toString() || "",
        location: initialData.location || "",
        color: initialData.color || "#3b82f6"
      });
    } else {
      setFormData({
        title: "",
        description: "",
        start_time: new Date().toISOString().slice(0, 16),
        end_time: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        type: "personal",
        course_id: "",
        location: "",
        color: "#3b82f6"
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
      course_id: formData.type === "course_session" && formData.course_id ? parseInt(formData.course_id) : null
    };
    onSave(payload);
  };

  const isReadOnly = initialData && initialData.user_id !== undefined && initialData.type === "course_session" && userRole === "student";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">
            {initialData ? (isReadOnly ? "Chi tiết Lịch học" : "Cập nhật sự kiện") : "Tạo sự kiện mới"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề</label>
            <input
              type="text"
              required
              readOnly={isReadOnly}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Học nhóm Toán"
            />
          </div>

          {(userRole === "teacher" || userRole === "admin") && !initialData && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại sự kiện</label>
              <select
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="personal">Lịch cá nhân</option>
                <option value="course_session">Lịch lớp học (Học sinh sẽ thấy)</option>
              </select>
            </div>
          )}

          {formData.type === "course_session" && (!initialData || !isReadOnly) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chọn lớp học</label>
              <select
                required
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              >
                <option value="">-- Chọn lớp --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}
          
          {isReadOnly && initialData.course_title && (
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Lớp học</label>
               <input type="text" readOnly className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-600" value={initialData.course_title} />
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bắt đầu</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Kết thúc</label>
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
