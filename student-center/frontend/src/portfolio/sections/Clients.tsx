"use client";
import { useEffect, useState } from "react";
import { Award } from "lucide-react"; // Fallback icon

interface Honor {
  id: number;
  student_name: string;
  teacher_name: string;
  title: string;
  description: string;
  image_url: string;
  academic_year: string;
  university_logo_url: string;
}

const getDirectImageUrl = (url: string | null) => {
  if (!url) return "";
  const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  return url;
};

export const Clients = () => {
  const [honors, setHonors] = useState<Honor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/honors/public`)
      .then(async res => {
         if (!res.ok) throw new Error("API not ok");
         return res.json();
      })
      .then(data => {
         if (Array.isArray(data) && data.length > 0) {
           setHonors(data);
         }
      })
      .catch(err => {
         console.error("Honors API fetch failed:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null; // or a loader if desired

  return (
    <section className="c-space my-20 bg-[#faedeb] text-black">
      <div className="flex flex-col items-center justify-center text-center mb-12">
        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 border border-orange-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="#f59e0b"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0"
            />
          </svg>
        </div>
        <h3 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mb-4 tracking-wider uppercase">
          HALL OF FAME
        </h3>
        <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg px-4">
          Học sinh của Minh Ngọc
        </p>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-10 px-4 md:px-10 max-w-6xl mx-auto snap-x snap-mandatory custom-scrollbar">
        {honors.map((h) => (
          <div key={h.id} className="bg-[#fcfaf7] border border-gray-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-[300px] md:w-[340px] flex flex-col shrink-0 snap-center">
            <div className="flex items-start gap-4 mb-4">
              <div className="relative">
                {/* Decorative border placeholder */}
                <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg blur-[2px] opacity-70"></div>
                {h.image_url ? (
                   <img src={getDirectImageUrl(h.image_url)} alt={h.student_name} className="relative w-20 h-20 object-cover rounded-md border-2 border-yellow-400" />
                ) : (
                   <div className="relative w-20 h-20 bg-gray-100 flex items-center justify-center rounded-md border-2 border-yellow-400">
                     <Award className="w-8 h-8 text-amber-500/50" />
                   </div>
                )}
              </div>
              
              <div className="flex flex-col pt-1">
                <h4 className="text-xl font-bold text-gray-900 leading-tight">{h.student_name}</h4>
                {h.academic_year && <p className="text-sm font-semibold text-gray-800 mt-1">Năm học: {h.academic_year}</p>}
                
                {h.university_logo_url && (
                  <div className="mt-3 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm overflow-hidden">
                    <img src={getDirectImageUrl(h.university_logo_url)} alt="Uni Logo" className="w-6 h-6 object-contain" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 mb-6">
              <div className="bg-orange-100/80 rounded-lg px-4 py-2.5 w-fit border border-orange-200">
                <p className="text-orange-500 font-bold text-xs uppercase tracking-wide leading-relaxed">
                  {h.title}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-5 border-t border-gray-200">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                HỌC SINH CỦA: <span className="text-orange-400">{h.teacher_name}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Scroll indicator bar */}
      <div className="w-full max-w-4xl mx-auto h-1.5 bg-gray-200 rounded-full mt-4 overflow-hidden relative">
        <div className="absolute top-0 left-0 h-full w-1/3 bg-gray-300 rounded-full"></div>
      </div>
    </section>
  );
};

