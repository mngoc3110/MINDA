"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import StudentSidebar from "./StudentSidebar";
import TeacherSidebar from "./TeacherSidebar";
import AdminSidebar from "./AdminSidebar";
import StudentAICopilot from "./StudentAICopilot";

export default function SidebarWrapper() {
  const [role, setRole] = useState<string | null>(null);
  const [portal, setPortal] = useState<string | null>(null);

  const pathname = usePathname();

  useEffect(() => {
    // Only access localStorage on the client side
    const savedRole = localStorage.getItem("minda_role");
    const savedPortal = localStorage.getItem("minda_portal");
    setRole(savedRole || "student");
    setPortal(savedPortal);
  }, []);

  // Prevent flicker by not rendering on server/initial mount until role is known
  if (role === null) {
    return <aside className="w-[280px] h-screen bg-bg-main hidden lg:block border-r border-border-card"></aside>;
  }

  // Ẩn sidebar hoàn toàn khi đang trong phòng Live (để học sinh thấy full màn hình)
  if (pathname.match(/^\/live\/[^/]+/)) {
    return null;
  }

  // Admin Context: only when logged in via Admin Portal AND currently on /admin, /honors, or /testimonials routes
  if (role === "admin" && portal === "admin" && (pathname.startsWith("/admin") || pathname.startsWith("/honors") || pathname.startsWith("/testimonials"))) {
    return <AdminSidebar />;
  }

  return (
    <>
      {role === "teacher" || role === "admin" ? <TeacherSidebar /> : <StudentSidebar />}
      {role === "student" && <StudentAICopilot />}
    </>
  );
}
