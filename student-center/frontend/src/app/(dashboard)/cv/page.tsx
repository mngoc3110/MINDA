"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import TeacherCVView from "@/components/profile/TeacherCVView";

export default function CVPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUserId(localStorage.getItem("minda_user_id"));
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main text-gray-500">
        Bạn cần đăng nhập để xem kỷ yếu của mình.
      </div>
    );
  }

  return <TeacherCVView teacherId={userId} enableGoBack={false} />;
}
