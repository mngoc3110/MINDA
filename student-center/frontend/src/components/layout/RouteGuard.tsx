"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function isTokenExpired(token: string) {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const decoded = JSON.parse(decodedJson);
    const exp = decoded.exp;
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
  } catch (e) {
    return true;
  }
}

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
      // Cho phép học sinh làm bài thi / luyện tập công khai mà không cần đăng nhập
      if (pathname.startsWith("/practice")) {
        setAuthorized(true);
        return;
      }

      const token = localStorage.getItem("minda_token");
      const portal = localStorage.getItem("minda_portal");

      // Không có token hoặc token đã hết hạn → chuyển về login
      if (!token || token === "undefined" || token === "null" || token.trim() === "" || isTokenExpired(token)) {
        localStorage.removeItem("minda_token");
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
      if (pathname.startsWith("/practice")) return;
      const token = localStorage.getItem("minda_token");
      if (!token || token === "undefined" || token === "null" || token.trim() === "" || isTokenExpired(token)) {
        localStorage.removeItem("minda_token");
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
