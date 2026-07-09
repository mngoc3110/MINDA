"use client";

import { useEffect, useState } from "react";
import { Star, CheckCircle, XCircle, Trash2, MessageSquareQuote } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("minda_role");
    if (role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchTestimonials();
  }, [router]);

  const fetchTestimonials = async () => {
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/testimonials/admin`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/testimonials/${id}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setTestimonials(testimonials.map(t => t.id === id ? { ...t, status } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTestimonial = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xoá cảm nhận này?")) return;
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/testimonials/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setTestimonials(testimonials.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-card p-6 rounded-2xl border border-border-card shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-t-primary flex items-center gap-3">
            <MessageSquareQuote className="w-8 h-8 text-pink-500" /> Quản lý Cảm nhận
          </h1>
          <p className="text-t-secondary mt-1 text-sm">Duyệt và quản lý những lời đánh giá từ học sinh trên trang chủ.</p>
        </div>
      </header>

      {testimonials.length === 0 ? (
        <div className="text-center py-20 bg-bg-card rounded-3xl border border-dashed border-border-card text-t-secondary">
          Chưa có đánh giá nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.id} className="bg-bg-card border border-border-card p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-hover">
                    <img src={t.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.student_name)}&background=6366f1&color=fff`} alt={t.student_name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-t-primary">{t.student_name}</h3>
                    <p className="text-xs text-t-secondary">{new Date(t.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? "fill-current" : "text-border-card"}`} />
                  ))}
                </div>
              </div>
              
              <p className="text-t-secondary text-sm italic bg-bg-main p-3 rounded-lg border border-border-card flex-1">
                "{t.content}"
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-card">
                <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg ${
                  t.status === "approved" ? "bg-emerald-500/10 text-emerald-500" :
                  t.status === "rejected" ? "bg-rose-500/10 text-rose-500" :
                  "bg-amber-500/10 text-amber-500"
                }`}>
                  {t.status === "approved" ? "Đã duyệt" : t.status === "rejected" ? "Từ chối" : "Chờ duyệt"}
                </span>

                <div className="flex items-center gap-2">
                  {t.status !== "approved" && (
                    <button onClick={() => updateStatus(t.id, "approved")} className="w-8 h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white flex items-center justify-center transition-colors" title="Duyệt">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {t.status !== "rejected" && (
                    <button onClick={() => updateStatus(t.id, "rejected")} className="w-8 h-8 rounded-full bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white flex items-center justify-center transition-colors" title="Từ chối">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deleteTestimonial(t.id)} className="w-8 h-8 rounded-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition-colors" title="Xoá">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
