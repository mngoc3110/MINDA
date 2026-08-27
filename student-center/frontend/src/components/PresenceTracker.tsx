"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn";

/**
 * Trả về mô tả hoạt động thân thiện dựa trên pathname và trạng thái hiện tại
 */
function getActivityFromPath(pathname: string): { activity: string; type: string } {
  // 1. Kiểm tra nếu có custom activity do trang con gán (VD: trang giải bài code hoặc thi)
  if (typeof window !== "undefined") {
    const custom = (window as any).__minda_current_activity;
    if (custom && typeof custom === "string" && custom.trim()) {
      return { activity: custom.trim(), type: "coding" };
    }
  }

  if (!pathname || pathname === "/") {
    return { activity: "Đang xem trang chủ", type: "browsing" };
  }
  if (pathname.startsWith("/code/exam/")) {
    return { activity: "Đang làm bài thi lập trình HSG", type: "coding_exam" };
  }
  if (pathname.startsWith("/code/")) {
    return { activity: "Đang giải bài tập MINDA Code", type: "coding" };
  }
  if (pathname === "/code") {
    return { activity: "Duyệt kho bài tập MINDA Code", type: "coding" };
  }
  if (pathname.startsWith("/assignments")) {
    return { activity: "Xem danh sách bài tập về nhà", type: "assignment" };
  }
  if (pathname.startsWith("/practice/")) {
    return { activity: "Đang làm bài luyện tập trắc nghiệm", type: "practice" };
  }
  if (pathname.startsWith("/live/")) {
    return { activity: "Đang trong lớp học trực tuyến Live", type: "live" };
  }
  if (pathname.startsWith("/courses/")) {
    return { activity: "Đang học bài giảng khóa học", type: "course" };
  }
  if (pathname.startsWith("/revision")) {
    return { activity: "Ôn tập kiến thức với AI", type: "revision" };
  }
  if (pathname.startsWith("/ranks") || pathname.startsWith("/leaderboard")) {
    return { activity: "Xem Bảng xếp hạng", type: "gamification" };
  }
  if (pathname.startsWith("/session-reports") || pathname.startsWith("/my-reports")) {
    return { activity: "Xem báo cáo học tập", type: "report" };
  }
  if (pathname.startsWith("/dashboard")) {
    return { activity: "Xem Bảng điều khiển", type: "dashboard" };
  }
  if (pathname.startsWith("/my-students")) {
    return { activity: "Quản lý danh sách học sinh", type: "management" };
  }

  return { activity: "Đang duyệt hệ thống", type: "general" };
}

export default function PresenceTracker() {
  const pathname = usePathname();
  const lastPingTime = useRef<number>(0);

  const sendHeartbeat = async (forcedActivity?: string) => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("minda_token");
    if (!token || token === "undefined" || token === "null" || token.trim() === "") {
      return;
    }

    const { activity, type } = getActivityFromPath(pathname);
    const finalActivity = forcedActivity || activity;

    try {
      await fetch(`${API}/api/profile/presence-heartbeat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_url: pathname,
          current_activity: finalActivity,
          activity_type: type,
        }),
      });
      lastPingTime.current = Date.now();
    } catch (e) {
      // Silent error on network/background failure
    }
  };

  // 1. Ping mỗi khi chuyển trang
  useEffect(() => {
    sendHeartbeat();
  }, [pathname]);

  // 2. Ping định kỳ mỗi 25 giây
  useEffect(() => {
    const interval = setInterval(() => {
      sendHeartbeat();
    }, 25 * 1000);

    // 3. Ping khi tab trở lại active (visibilitychange)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (Date.now() - lastPingTime.current > 15 * 1000) {
          sendHeartbeat();
        }
      }
    };

    // 4. Lắng nghe custom event khi học sinh chọn bài tập mới
    const handleCustomActivity = (e: any) => {
      if (e?.detail?.activity) {
        sendHeartbeat(e.detail.activity);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("minda_activity_update", handleCustomActivity);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("minda_activity_update", handleCustomActivity);
    };
  }, [pathname]);

  return null;
}
