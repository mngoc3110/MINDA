# 🚀 Hướng Dẫn Khởi Chạy Lên Máy Chủ Hệ Thống MINDA EduCenter

Tài liệu này hướng dẫn chi tiết cách khởi động song song 2 phân hệ Backend và Frontend của nền tảng MINDA (Hệ thống Khóa luận KLTN).
Hãy làm theo đúng thứ tự dưới đây để đảm bảo hệ thống không bị lỗi nghẽn Port hoặc đụng độ với các phiên bản lỗi cũ còn chạy ngầm.

---

## Bước 1: Khởi Chạy Backend (FastAPI - Port 8000)

Mở một tab/cửa sổ **Terminal 1**, copy và dán toàn bộ đoạn mã dưới đây vào rồi bấm `Enter`:

```bash
# 1. Dọn dẹp tiến trình cũ đang kẹt ở port 8000 (nếu có) và di chuyển vào Backend
kill $(lsof -t -i:8000) 2>/dev/null; cd /Users/minhngoc/HCMUE/MINDA/student-center/backend

# 2. Kích hoạt môi trường ảo Python (Virtual Environment)
source venv/bin/activate

# 3. Khởi chạy Server Backend Uvicorn
uvicorn app.main:app --reload --port 8000
```

> [!NOTE]
> Chờ khoảng vài giây, khi màn hình Terminal hiện lên dòng chữ xanh lá `Application startup complete.` thì điều đó đồng nghĩa với việc Hệ thống Cơ sở Dữ liệu & API đã sống dậy!

---

## Bước 2: Khởi Chạy Frontend (Next.js - Port 3000)

Tiếp tục mở thêm một **Terminal 2** hoàn toàn mới (Đừng tắt Terminal 1 nhé), copy khối lệnh sau và bấm `Enter`:

```bash
# 1. Dọn dẹp tiến trình cũ đang kẹt ở port 3000 (nếu có) và di chuyển vào Frontend
kill $(lsof -t -i:3000) 2>/dev/null; cd /Users/minhngoc/HCMUE/MINDA/student-center/frontend

# 2. Khởi chạy Server Frontend
npm run dev
```

> [!NOTE]
> Khi Terminal này báo `✓ Ready in xxx ms (Local: http://localhost:3000)`, đó là lúc bộ máy biên dịch Turbopack của Next.js đã hoàn thành kết xuất Giao diện.

---

## Bước 3: Truy Cập Tận Hưởng 🌐

Sau khi CẢ HAI Terminal đều xanh xịn xò 100%, bạn chỉ cần bật Trình duyệt Web (khuyên dùng Google Chrome hoặc Cốc Cốc) và tự do truy cập vào địa chỉ quen thuộc:

👉 **[http://localhost:3000](http://localhost:3000)**

🎉 *Vậy là xong! Mọi phân hệ cốt lõi gồm Upload Google Drive, Hệ thống WebRTC, và AI RAPT-CLIP đều sẵn sàng nạp năng lượng!*
