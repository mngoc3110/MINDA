"use client";

import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import vi from "date-fns/locale/vi";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react";

import ScheduleModal from "@/components/schedule/ScheduleModal";

const locales = {
  "vi": vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function SchedulePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("student");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const role = localStorage.getItem("minda_role") || "student";
      const token = localStorage.getItem("minda_token");
      setUserRole(role);

      // Fetch schedules
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/schedules/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const formattedEvents = data.map((item: any) => ({
          ...item,
          start: new Date(item.start_time),
          end: new Date(item.end_time),
        }));
        setEvents(formattedEvents);
      }

      // Fetch courses for dropdown
      if (role === "teacher" || role === "admin") {
        const courseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/courses/teacher/courses`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (courseRes.ok) {
          setCourses(await courseRes.json());
        }

        const studentRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/profile/students`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (studentRes.ok) {
          setStudents(await studentRes.json());
        }
      }
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    }
    setLoading(false);
  };

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedEvent({
      start_time: slotInfo.start,
      end_time: slotInfo.end
    });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (data: any) => {
    try {
      const token = localStorage.getItem("minda_token");
      if (selectedEvent && selectedEvent.id) {
        // Update
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/schedules/${selectedEvent.id}`, {
          method: "PUT",
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });
      } else {
        // Create
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/schedules/`, {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Đã có lỗi xảy ra. Vui lòng kiểm tra lại quyền của bạn.");
      console.error(error);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xoá sự kiện này?")) return;
    try {
      const token = localStorage.getItem("minda_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/schedules/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Xoá thất bại!");
      console.error(error);
    }
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor = event.color || "#3b82f6";
    // Tự động set màu cho các sự kiện không có màu tuỳ chỉnh (ví dụ: Lớp học)
    if (event.type === "course_session" && !event.color) {
      backgroundColor = "#10b981"; // Emerald cho lớp học
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        padding: "2px 6px",
      }
    };
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-600" /> Lịch học / Thời khoá biểu
          </h1>
          <p className="text-slate-500 mt-2">
            Quản lý và theo dõi các buổi học lớp và sự kiện cá nhân của bạn.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedEvent(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-5 h-5" /> Thêm sự kiện
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 h-[700px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%", fontFamily: "inherit" }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            defaultView={Views.WEEK}
            messages={{
              next: "Tiếp",
              previous: "Trước",
              today: "Hôm nay",
              month: "Tháng",
              week: "Tuần",
              day: "Ngày",
              noEventsInRange: "Không có sự kiện nào trong thời gian này."
            }}
          />
        )}
      </div>

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialData={selectedEvent}
        courses={courses}
        students={students}
        userRole={userRole}
      />
    </div>
  );
}
