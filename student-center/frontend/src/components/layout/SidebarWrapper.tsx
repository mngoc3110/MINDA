"use client";

import { useEffect, useState } from "react";
import StudentSidebar from "./StudentSidebar";
import TeacherSidebar from "./TeacherSidebar";
import AdminSidebar from "./AdminSidebar";

export default function SidebarWrapper() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Only access localStorage on the client side
    const savedRole = localStorage.getItem("minda_role");
    setRole(savedRole || "student");
  }, []);

  // Prevent flicker by not rendering on server/initial mount until role is known
  if (role === null) {
    return <aside className="w-[280px] h-screen bg-bg-main hidden lg:block border-r border-white/5"></aside>;
  }

  if (role === "admin") return <AdminSidebar />;
  return role === "teacher" ? <TeacherSidebar /> : <StudentSidebar />;
}
