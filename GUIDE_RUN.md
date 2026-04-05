# 🚀 Hướng dẫn Chạy Toàn bộ Dự án MINDA

Tài liệu này hướng dẫn sếp cách khởi động đồng bộ 3 thành phần:
1.  **Frontend**: Giao diện người dùng Next.js (Port 3000)
2.  **Backend**: API FastAPI (Port 8000)
3.  **AI Model**: RAPT-CLIP Inference Server (Port 8001)

---

## ⚡ Cách 1: Chạy Chế độ Phát triển (Dev Mode)
Phù hợp khi sếp muốn xem log trực tiếp trong terminal và code sẽ tự động reload khi sếp thay đổi.

1.  Mở terminal tại thư mục gốc của dự án (`/Users/minhngoc/HCMUE/MINDA`).
2.  Chạy lệnh:
    ```bash
    bash run_minda_dev.sh
    ```
3.  **Để dừng**: Bấm `Ctrl + C`. Toàn bộ 3 service sẽ được dừng cùng lúc.

---

## 🛡️ Cách 2: Chạy "Vĩnh viễn" (Persistent Mode) - Khuyên dùng
Phù hợp khi sếp muốn hệ thống chạy ổn định, tự động khởi động lại nếu bị lỗi, và chạy ngầm (background).

### 1. Cài đặt PM2 (Chỉ thực hiện 1 lần duy nhất)
Sếp cần cài đặt công cụ quản lý process (PM2) toàn cục:
```bash
npm install -g pm2
```

### 2. Khởi động toàn bộ
Tại thư mục gốc, sếp chạy lệnh:
```bash
pm2 start ecosystem.config.js
```

### 3. Các lệnh quản lý PM2 hữu ích:
- **Xem trạng thái**: `pm2 status` (Kiểm tra 3 service có online không).
- **Xem nhật ký (Log)**: `pm2 logs` (Xem log realtime của cả 3).
- **Dừng toàn bộ**: `pm2 stop all` (Hoặc `pm2 delete all`).
- **Khởi động lại**: `pm2 restart all`.
- **Theo dõi UI Dashboard**: `pm2 monit`.

---

## ⚠️ Lưu ý Quan trọng
- Đảm bảo sếp đã tạo đầy đủ môi trường ảo (`venv` cho backend và `venv_inference` cho RAPT-CLIP) trước khi chạy.
- Nếu service không khởi động được, hãy kiểm tra file log chi tiết để biết nguyên nhân (Database hoặc Port bị trùng).
