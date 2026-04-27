"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

    const forceClearAndReload = () => {
      localStorage.clear();
      sessionStorage.clear();
      
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
      
      alert("Phiên bản cập nhật mới hoặc phiên làm việc đã hết hạn. Hệ thống sẽ tự động tải lại!");
      window.location.href = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    };

    const checkCacheExpiry = () => {
      const now = Date.now();
      const lastRefresh = localStorage.getItem("minda_last_refresh");
      
      if (!lastRefresh) {
        localStorage.setItem("minda_last_refresh", now.toString());
        return true;
      } 
      
      if (now - parseInt(lastRefresh) > CACHE_EXPIRY_MS) {
        forceClearAndReload();
        return false;
      }
      
      return true;
    };

    const checkAuth = () => {
      // 1. Kiểm tra bộ nhớ đệm và thời hạn phiên bản
      if (!checkCacheExpiry()) return;

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

    // 2. Thiết lập vòng lặp giám sát liên tục để quét thời hạn nếu người dùng treo máy
    const interval = setInterval(() => {
      checkCacheExpiry();
    }, 60000); // 1 phút / lượt kiểm tra

    return () => clearInterval(interval);
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
