import JSZip from "jszip";

export interface LessonActivity {
  id: string;
  type: "warmup" | "knowledge" | "practice" | "application";
  title: string;
  subtitle: string;
  content: string;
  interactiveType?: "drag_drop" | "quiz" | "unit_scale" | "manim_video" | "discussion" | "case_study";
  interactiveData?: any;
}

export interface InteractiveLesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
  author: string;
  description: string;
  activities: LessonActivity[];
  manimVideoUrl?: string;
  createdAt: string;
}

/**
 * Tạo nội dung imsmanifest.xml chuẩn SCORM 1.2
 */
export function generateSCORM12Manifest(lesson: InteractiveLesson): string {
  const identifier = `MINDA_${lesson.id.replace(/[^a-zA-Z0-9_]/g, "_")}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="1.2"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                              http://www.imsglobal.org/xsd/imsmd_rootv1p2p2 imsmd_rootv1p2p2.xsd
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="${identifier}_ORG">
    <organization identifier="${identifier}_ORG">
      <title>${escapeXml(lesson.title)} - ${escapeXml(lesson.subject)} ${escapeXml(lesson.grade)}</title>
      <item identifier="ITEM_${identifier}" identifierref="RES_${identifier}">
        <title>${escapeXml(lesson.title)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES_${identifier}" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="SCORM_API_wrapper.js"/>
    </resource>
  </resources>
</manifest>`;
}

/**
 * File SCORM API Wrapper Javascript tiêu chuẩn
 */
export function getSCORMAPIWrapperScript(): string {
  return `
var findAPITries = 0;
function findAPI(win) {
  while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
    findAPITries++;
    if (findAPITries > 500) return null;
    win = win.parent;
  }
  return win.API;
}

function getAPI() {
  var theAPI = findAPI(window);
  if ((theAPI == null) && (window.opener != null) && (typeof(window.opener) != "undefined")) {
    theAPI = findAPI(window.opener);
  }
  return theAPI;
}

var scormAPI = null;
function initSCORM() {
  scormAPI = getAPI();
  if (scormAPI) {
    scormAPI.LMSInitialize("");
    scormAPI.LMSSetValue("cmi.core.lesson_status", "incomplete");
    scormAPI.LMSCommit("");
    console.log("[SCORM] Initialized successfully");
  } else {
    console.warn("[SCORM] API not found (Running in standalone offline mode)");
  }
}

function completeSCORM(score) {
  if (scormAPI) {
    scormAPI.LMSSetValue("cmi.core.lesson_status", "passed");
    if (score !== undefined) {
      scormAPI.LMSSetValue("cmi.core.score.raw", String(score));
      scormAPI.LMSSetValue("cmi.core.score.min", "0");
      scormAPI.LMSSetValue("cmi.core.score.max", "100");
    }
    scormAPI.LMSCommit("");
    console.log("[SCORM] Lesson marked as passed with score:", score);
  }
}

function finishSCORM() {
  if (scormAPI) {
    scormAPI.LMSFinish("");
  }
}

window.addEventListener("load", initSCORM);
window.addEventListener("beforeunload", finishSCORM);
`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

/**
 * Sinh file HTML độc lập chạy trực tiếp trong trình duyệt hoặc SCORM LMS
 */
export function generateStandaloneHTML(lesson: InteractiveLesson): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(lesson.title)} - Bài Giảng Tương Tác MINDA</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <script src="SCORM_API_wrapper.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; }
    .scale-enter { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-rose-500/30">

  <!-- Header -->
  <header class="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 sm:px-8 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-rose-500/20">
        M
      </div>
      <div>
        <span class="text-[10px] uppercase font-bold tracking-widest text-rose-400 block">${escapeXml(lesson.subject)} ${escapeXml(lesson.grade)}</span>
        <h1 class="text-base sm:text-lg font-black text-white leading-tight">${escapeXml(lesson.title)}</h1>
      </div>
    </div>

    <!-- Progress Indicator -->
    <div class="flex items-center gap-2">
      <span id="progress-text" class="text-xs font-bold text-slate-400">Hoạt động 1 / 4</span>
      <div class="w-24 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div id="progress-bar" class="h-full bg-gradient-to-r from-rose-500 to-indigo-500 transition-all duration-500" style="width: 25%"></div>
      </div>
    </div>
  </header>

  <!-- Activities Navigation Tabs -->
  <nav class="bg-slate-900/50 border-b border-slate-800/80 px-4 py-2 flex gap-2 overflow-x-auto justify-start sm:justify-center">
    <button onclick="goToActivity(0)" id="nav-btn-0" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white transition shrink-0">1. 🎬 Khởi Động</button>
    <button onclick="goToActivity(1)" id="nav-btn-1" class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition shrink-0">2. 💡 Kiến Thức</button>
    <button onclick="goToActivity(2)" id="nav-btn-2" class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition shrink-0">3. 🎮 Luyện Tập</button>
    <button onclick="goToActivity(3)" id="nav-btn-3" class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition shrink-0">4. 🚀 Vận Dụng</button>
  </nav>

  <!-- Main Viewport -->
  <main class="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">

    <!-- 1. KHỞI ĐỘNG -->
    <section id="act-0" class="activity-section space-y-6">
      <div class="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl"></div>
        <span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider">Hoạt động 1: Khởi động</span>
        <h2 class="text-2xl sm:text-3xl font-black text-white mt-3">🎯 Phân loại: Thiết Bị Số vs Thiết Bị Truyền Thống</h2>
        <p class="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
          Hãy quan sát các đồ vật xung quanh em và phân loại xem đâu là <strong>Thiết bị số</strong> (làm việc với dữ liệu số bit 0/1) và đâu là <strong>Thiết bị truyền thống</strong>:
        </p>

        <!-- Mini Game Sorter -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          <div class="sorter-item p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-rose-500 transition cursor-pointer text-center" onclick="checkItem(this, true)">
            <span class="text-3xl block mb-2">💾</span>
            <p class="font-bold text-sm">Thẻ nhớ 1 TB</p>
            <span class="feedback text-xs font-bold mt-1 block opacity-0"></span>
          </div>
          <div class="sorter-item p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-rose-500 transition cursor-pointer text-center" onclick="checkItem(this, false)">
            <span class="text-3xl block mb-2">🕰️</span>
            <p class="font-bold text-sm">Đồng hồ cơ lên dây cót</p>
            <span class="feedback text-xs font-bold mt-1 block opacity-0"></span>
          </div>
          <div class="sorter-item p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-rose-500 transition cursor-pointer text-center" onclick="checkItem(this, false)">
            <span class="text-3xl block mb-2">📻</span>
            <p class="font-bold text-sm">Đĩa hát than (Vinyl)</p>
            <span class="feedback text-xs font-bold mt-1 block opacity-0"></span>
          </div>
          <div class="sorter-item p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-rose-500 transition cursor-pointer text-center" onclick="checkItem(this, true)">
            <span class="text-3xl block mb-2">💻</span>
            <p class="font-bold text-sm">Máy tính xách tay</p>
            <span class="feedback text-xs font-bold mt-1 block opacity-0"></span>
          </div>
          <div class="sorter-item p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-rose-500 transition cursor-pointer text-center" onclick="checkItem(this, true)">
            <span class="text-3xl block mb-2">📡</span>
            <p class="font-bold text-sm">Bộ thu phát Wifi</p>
            <span class="feedback text-xs font-bold mt-1 block opacity-0"></span>
          </div>
          <div class="sorter-item p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-rose-500 transition cursor-pointer text-center" onclick="checkItem(this, false)">
            <span class="text-3xl block mb-2">✉️</span>
            <p class="font-bold text-sm">Thư viết tay bưu điện</p>
            <span class="feedback text-xs font-bold mt-1 block opacity-0"></span>
          </div>
        </div>

        <div class="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm">
          💡 <strong>Câu hỏi gợi mở:</strong> Máy tính xử lý thông tin như thế nào? Dữ liệu và Thông tin khác nhau ở điểm nào? Hãy cùng khám phá trong phần tiếp theo!
        </div>
      </div>
    </section>

    <!-- 2. HÌNH THÀNH KIẾN THỨC -->
    <section id="act-1" class="activity-section hidden space-y-6">
      <div class="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
        <span class="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">Hoạt động 2: Hình thành kiến thức</span>
        <h2 class="text-2xl sm:text-3xl font-black text-white">💡 Quá trình Xử lý Thông tin & Đơn vị Lưu trữ</h2>

        <!-- Sơ đồ Xử lý Thông tin 3 Bước -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div class="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 relative">
            <div class="w-10 h-10 rounded-xl bg-indigo-500 text-white font-black text-sm flex items-center justify-center mx-auto mb-3">1</div>
            <h3 class="font-bold text-base text-indigo-400 mb-1">Tiếp nhận dữ liệu</h3>
            <p class="text-xs text-slate-300 leading-relaxed">Thu nhận từ bàn phím, chuột, máy quét, camera biến thành các dãy bit (0 và 1).</p>
          </div>
          <div class="p-5 rounded-2xl bg-purple-950/40 border border-purple-500/30 relative">
            <div class="w-10 h-10 rounded-xl bg-purple-500 text-white font-black text-sm flex items-center justify-center mx-auto mb-3">2</div>
            <h3 class="font-bold text-base text-purple-400 mb-1">Xử lí dữ liệu</h3>
            <p class="text-xs text-slate-300 leading-relaxed">CPU biến đổi dữ liệu trong bộ nhớ để tạo ra dữ liệu mới và thông tin có ích.</p>
          </div>
          <div class="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 relative">
            <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center mx-auto mb-3">3</div>
            <h3 class="font-bold text-base text-emerald-400 mb-1">Đưa ra kết quả</h3>
            <p class="text-xs text-slate-300 leading-relaxed">Xuất qua màn hình, loa, máy in hoặc lưu trữ vào thẻ nhớ, ổ cứng, USB.</p>
          </div>
        </div>

        <!-- Bảng tương tác Zoom Đơn vị đo lượng thông tin -->
        <div class="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-4">
          <h3 class="font-bold text-sm sm:text-base text-amber-400 flex items-center gap-2">
            <span>📏</span> Thước đo dung lượng dữ liệu (Hệ số 2¹⁰ = 1024)
          </h3>
          <input type="range" id="unit-slider" min="0" max="8" value="3" class="w-full accent-rose-500 cursor-pointer" oninput="updateUnitScale(this.value)">
          
          <div id="unit-detail-card" class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p id="unit-name" class="text-lg font-black text-white">Megabyte (MB)</p>
              <p id="unit-calc" class="text-xs text-rose-400 font-mono">1 MB = 1024 KB = 2²⁰ Byte</p>
            </div>
            <div class="text-right">
              <span id="unit-analogy" class="text-xs bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-medium">Tương đương ~1 cuốn sách 500 trang</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. LUYỆN TẬP -->
    <section id="act-2" class="activity-section hidden space-y-6">
      <div class="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
        <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">Hoạt động 3: Luyện tập</span>
        <h2 class="text-2xl sm:text-3xl font-black text-white">🎮 Thử Thách Tính Toán & Quy Đổi</h2>

        <!-- Quiz Item 1 -->
        <div class="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
          <p class="font-bold text-sm sm:text-base text-white">Câu 1: Định nghĩa nào về Byte là chính xác nhất?</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button onclick="answerQuiz(this, false)" class="quiz-opt p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-400 text-left text-xs font-semibold text-slate-200 transition">A. Là một kí tự</button>
            <button onclick="answerQuiz(this, true)" class="quiz-opt p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-400 text-left text-xs font-semibold text-slate-200 transition">B. Là đơn vị dữ liệu gồm 8 bit</button>
            <button onclick="answerQuiz(this, false)" class="quiz-opt p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-400 text-left text-xs font-semibold text-slate-200 transition">C. Là đơn vị đo tốc độ máy tính</button>
            <button onclick="answerQuiz(this, false)" class="quiz-opt p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-400 text-left text-xs font-semibold text-slate-200 transition">D. Là một dãy 8 chữ số</button>
          </div>
        </div>

        <!-- Quiz Item 2 (Quy đổi) -->
        <div class="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
          <p class="font-bold text-sm sm:text-base text-white">Câu 2: Quy đổi 3 MB và 2048 B ra KB:</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button onclick="answerQuiz(this, true)" class="quiz-opt p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-400 text-left text-xs font-semibold text-slate-200 transition">A. 3 MB = 3072 KB; 2048 B = 2 KB</button>
            <button onclick="answerQuiz(this, false)" class="quiz-opt p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-400 text-left text-xs font-semibold text-slate-200 transition">B. 3 MB = 3000 KB; 2048 B = 2.048 KB</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. VẬN DỤNG -->
    <section id="act-3" class="activity-section hidden space-y-6">
      <div class="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
        <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">Hoạt động 4: Vận dụng thực tế</span>
        <h2 class="text-2xl sm:text-3xl font-black text-white">🚀 Ứng Dụng Thiết Bị Số & Chuyển Đổi Số</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
            <h3 class="font-bold text-amber-400 text-sm flex items-center gap-2"><span>🪪</span> Thẻ CCCD Gắn Chip</h3>
            <p class="text-xs text-slate-300 leading-relaxed">
              Mã QR giúp quét thông tin cơ bản nhanh chóng bằng điện thoại; trong khi chip điện tử lưu trữ an toàn dữ liệu sinh trắc học (vân tay, khuôn mặt) có tính bảo mật cao và chống làm giả.
            </p>
          </div>
          <div class="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
            <h3 class="font-bold text-amber-400 text-sm flex items-center gap-2"><span>📚</span> Số Hóa Thư Viện</h3>
            <p class="text-xs text-slate-300 leading-relaxed">
              2000 cuốn sách (50 MB/cuốn) = 100.000 MB ≈ 100 GB. Thẻ nhớ 256 GB hoàn toàn đủ sức chứa toàn bộ thư viện sách của trường học!
            </p>
          </div>
        </div>

        <div class="text-center pt-4">
          <button onclick="finishLesson()" class="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/30 hover:scale-105 transition">
            🎉 Hoàn Thành Bài Giảng & Nộp Kết Quả
          </button>
        </div>
      </div>
    </section>

  </main>

  <!-- Bottom Navigation Controller -->
  <footer class="sticky bottom-0 z-30 bg-slate-900/90 backdrop-blur border-t border-slate-800 px-4 py-3 sm:px-8 flex items-center justify-between">
    <button onclick="prevActivity()" id="prev-btn" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition disabled:opacity-30" disabled>
      ← Hoạt động trước
    </button>
    <button onclick="nextActivity()" id="next-btn" class="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition shadow-lg shadow-rose-500/20">
      Tiếp theo →
    </button>
  </footer>

  <script>
    let currentIdx = 0;
    const totalActivities = 4;
    const units = [
      { name: "Bit (b)", calc: "Đơn vị nhỏ nhất (0 hoặc 1)", analogy: "1 bóng đèn bật/tắt" },
      { name: "Byte (B)", calc: "1 Byte = 8 bit", analogy: "1 ký tự chữ cái (VD: 'A')" },
      { name: "Kilobyte (KB)", calc: "1 KB = 1024 Byte = 2¹⁰ B", analogy: "~1 trang văn bản ngắn" },
      { name: "Megabyte (MB)", calc: "1 MB = 1024 KB = 2²⁰ B", analogy: "~1 cuốn sách 500 trang / 1 bài hát MP3" },
      { name: "Gigabyte (GB)", calc: "1 GB = 1024 MB = 2³⁰ B", analogy: "~1 tập phim HD / 250 bài hát" },
      { name: "Terabyte (TB)", calc: "1 TB = 1024 GB = 2⁴⁰ B", analogy: "~1 thư viện sách trường học / 250.000 ảnh" },
      { name: "Petabyte (PB)", calc: "1 PB = 1024 TB = 2⁵⁰ B", analogy: "~Toàn bộ thư viện Quốc hội Mỹ" },
      { name: "Exabyte (EB)", calc: "1 EB = 1024 PB = 2⁶⁰ B", analogy: "~Toàn bộ video phát trên Internet 1 năm" },
      { name: "Zettabyte / Yottabyte", calc: "Dung lượng dữ liệu toàn cầu", analogy: "Toàn bộ kho dữ liệu thế giới" }
    ];

    function updateUnitScale(val) {
      const u = units[val];
      document.getElementById('unit-name').innerText = u.name;
      document.getElementById('unit-calc').innerText = u.calc;
      document.getElementById('unit-analogy').innerText = u.analogy;
    }

    function goToActivity(idx) {
      currentIdx = idx;
      for (let i = 0; i < totalActivities; i++) {
        const sec = document.getElementById('act-' + i);
        const btn = document.getElementById('nav-btn-' + i);
        if (i === idx) {
          sec.classList.remove('hidden');
          btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white transition shrink-0";
        } else {
          sec.classList.add('hidden');
          btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition shrink-0";
        }
      }
      document.getElementById('prev-btn').disabled = (currentIdx === 0);
      document.getElementById('next-btn').style.display = (currentIdx === totalActivities - 1) ? 'none' : 'block';
      document.getElementById('progress-text').innerText = 'Hoạt động ' + (currentIdx + 1) + ' / ' + totalActivities;
      document.getElementById('progress-bar').style.width = ((currentIdx + 1) / totalActivities * 100) + '%';
    }

    function nextActivity() {
      if (currentIdx < totalActivities - 1) goToActivity(currentIdx + 1);
    }

    function prevActivity() {
      if (currentIdx > 0) goToActivity(currentIdx - 1);
    }

    function checkItem(el, isDigital) {
      const fb = el.querySelector('.feedback');
      if (isDigital) {
        el.classList.add('border-emerald-500', 'bg-emerald-500/10');
        fb.innerText = '✅ Thiết bị số';
        fb.classList.add('text-emerald-400');
      } else {
        el.classList.add('border-amber-500', 'bg-amber-500/10');
        fb.innerText = '📻 Thiết bị truyền thống';
        fb.classList.add('text-amber-400');
      }
      fb.classList.remove('opacity-0');
    }

    function answerQuiz(btn, isCorrect) {
      const parent = btn.parentElement;
      const buttons = parent.querySelectorAll('button');
      buttons.forEach(b => b.disabled = true);
      if (isCorrect) {
        btn.classList.add('border-emerald-500', 'bg-emerald-500/20', 'text-emerald-300');
        if (window.confetti) confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      } else {
        btn.classList.add('border-red-500', 'bg-red-500/20', 'text-red-300');
      }
    }

    function finishLesson() {
      if (window.confetti) {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      }
      if (typeof completeSCORM === 'function') {
        completeSCORM(100);
      }
      alert('🎉 Chúc mừng bạn đã hoàn thành xuất sắc Bài 1: Thông tin và Xử lí thông tin!');
    }
  </script>
</body>
</html>`;
}

/**
 * Đóng gói toàn bộ bài giảng thành file SCORM .zip
 */
export async function packageLessonToSCORMZip(lesson: InteractiveLesson): Promise<Blob> {
  const zip = new JSZip();

  // 1. Manifest
  zip.file("imsmanifest.xml", generateSCORM12Manifest(lesson));

  // 2. SCORM API Wrapper
  zip.file("SCORM_API_wrapper.js", getSCORMAPIWrapperScript());

  // 3. Main HTML Sco
  zip.file("index.html", generateStandaloneHTML(lesson));

  // 4. Metadata JSON
  zip.file("lesson_meta.json", JSON.stringify(lesson, null, 2));

  return await zip.generateAsync({ type: "blob" });
}
