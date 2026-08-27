import SidebarWrapper from "@/components/layout/SidebarWrapper";
import RouteGuard from "@/components/layout/RouteGuard";
import MobileHeader from "@/components/layout/MobileHeader";
import PresenceTracker from "@/components/PresenceTracker";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <PresenceTracker />
      <div className="flex bg-bg-main min-h-screen text-foreground font-outfit selection:bg-indigo-500/30">
        {/* Desktop Sidebar (hidden on mobile) */}
        <SidebarWrapper />

        {/* Nội dung linh hoạt bên phải */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Mobile Header with hamburger (hidden on desktop) */}
          <MobileHeader />

          <main className="flex-1 overflow-y-auto w-full pt-[120px] lg:pt-[100px]">
            {children}
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
