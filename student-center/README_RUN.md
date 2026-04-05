# 🚀 Cẩm Nang Vận Hành Hệ Thống MINDA

Chào sếp! Đây là tài liệu hướng dẫn toàn diện nhất để sếp làm chủ hệ thống MINDA, từ lúc code trên máy Mac (Local) cho đến khi "bung lụa" trên server thực tế (Vietnix VPS).

---

## 💻 PHẦN I: CHẠY TRÊN MÁY MAC (LOCAL - DEV MODE)

Để việc phát triển đồ án nhanh nhất, sếp hãy dùng bộ script tự động hoá sau:

### 1. Khởi động Thần tốc (Bật 4 Service cùng lúc)
Mở **Terminal** tại thư mục gốc `MINDA` và gõ:
```bash
./run_minda_dev.sh
```
*   **Service 1**: Frontend (Next.js) - Cổng 3000
*   **Service 2**: Backend (FastAPI) - Cổng 8000
*   **Service 3**: AI Engine (PyTorch) - Cổng 8001
*   **Service 4**: Peer Server (WebRTC) - Cổng 9000

### 2. Xem Logs và Tắt hệ thống
- **Xem lỗi**: Để xem các service đang chạy gì, sếp gõ: `tail -f /tmp/*.log`
- **Tắt hệ thống**: Nhấn **Ctrl + C** trong Terminal chạy script, mọi thứ sẽ dừng lại an toàn.

---

## ☁️ PHẦN II: LÊN MÂY (GITHUB & VPS DEPLOYMENT)

### 1. Quy trình Cập nhật Code (GitHub Workflow)
Mỗi khi sếp sửa code xong trên máy Mac và muốn đưa nó lên Web thật cho mọi người thấy, sếp hãy chạy 3 lệnh này:
```bash
# Thêm các thay đổi
git add .
# Ghi chú nội dung sửa
git commit -m "feat: [tên tính năng vừa sửa]"
# Đẩy lên GitHub
git push origin main
```

### 2. Cập nhật trên VPS (Báo hiệu thay đổi)
Sau khi đã "Push" lên GitHub, sếp cần báo cho VPS kéo code mới về. Sếp **SSH** vào VPS và gõ:
```bash
# 1. Di chuyển vào thư mục code
cd /var/www/minda/student-center

# 2. Kéo code mới nhất từ GitHub
git pull

# 3. Khởi động lại ứng dụng (Để tính năng mới có hiệu lực)
pm2 restart all
```

### 3. Cách xem Web đang chạy thực tế
Đăng nhập vào địa chỉ: 👉 **[https://minda.io.vn](https://minda.io.vn)**

---

## ⚠️ LƯU Ý BẢO MẬT (QUAN TRỌNG)
> [!CAUTION]
> **Không bao giờ đẩy file `.env` hoặc `drive_credentials.json` lên GitHub.**  
> Em đã cấu hình chặn các file này giúp sếp. Nếu sếp cần cấu hình lại cho VPS, hãy dùng lệnh `nano .env` trực tiếp trên server để chỉnh sửa nhé.

🎉 *Chúc sếp bảo vệ đồ án thành công rực rỡ với điểm 10 tuyệt đối!*
