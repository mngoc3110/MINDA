"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("minda_token");
      const portal = localStorage.getItem("minda_portal");
      
      // Nếu không có Token (chưa đăng nhập)
      if (!token) {
        if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
            router.replace("/admin/login");
        } else {
            router.replace("/login");
        }
        return;
      }

      // /admin chỉ dành cho phần mềm đăng nhập từ Admin Portal
      if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        if (portal !== "admin") {
          // Logged in but not from admin portal → redirect to teacher dashboard
          router.replace("/dashboard");
          return;
        }
      }
      
      setAuthorized(true);
    };

    checkAuth();
  }, [pathname, router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#020202] text-white flex flex-col gap-4 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-gray-400 font-outfit">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  return <>{children}</>;
}
