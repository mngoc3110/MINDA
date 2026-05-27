"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkAuth = () => {
      const token = localStorage.getItem("minda_token");
      const portal = localStorage.getItem("minda_portal");

      // Không có token → chuyển về login
      if (!token || token === "undefined" || token === "null" || token.trim() === "") {
        if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
          router.replace("/admin/login");
        } else {
          router.replace("/login");
        }
        return;
      }

      // /admin chỉ dành cho admin portal
      if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        if (portal !== "admin") {
          router.replace("/dashboard");
          return;
        }
      }

      setAuthorized(true);
    };

    checkAuth();

    // Kiểm tra session mỗi 5 phút
    const interval = setInterval(() => {
      const token = localStorage.getItem("minda_token");
      if (!token || token === "undefined" || token === "null" || token.trim() === "") {
        window.location.href = "/login";
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [mounted, pathname, router]);

  if (!mounted || !authorized) {
    return (
      <div className="min-h-screen bg-[#020202] text-white flex flex-col gap-4 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-gray-400 font-outfit">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  return <>{children}</>;
}
