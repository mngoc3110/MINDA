import SidebarWrapper from "@/components/layout/SidebarWrapper";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-[#020202] min-h-screen text-white font-outfit selection:bg-indigo-500/30">
      {/* Dynamic Sidebar based on User Role */}
      <SidebarWrapper />
      
      {/* Nội dung linh hoạt bên phải */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
