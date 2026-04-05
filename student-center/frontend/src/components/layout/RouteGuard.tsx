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
      const role = localStorage.getItem("minda_role");
      
      // Nếu không có Token (chưa đăng nhập)
      if (!token) {
        if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
            router.replace("/admin/login");
        } else {
            router.replace("/login");
        }
        return;
      }

      // Admin path protection (Đã có token nhưng sai role)
      if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        if (role !== "admin") {
          // You do not have permission, booting out!
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
