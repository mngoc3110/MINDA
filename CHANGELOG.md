# 🚀 MINDA SYSTEM TRACKER

> File này được thiết kế để tóm tắt các tính năng cốt lõi, kiến trúc Giao diện (UI) và lưu lại lịch sử Cập nhật (Version Log) mỗi lần hệ thống được đẩy lên VPS qua SSH.

## 🌟 TỔNG QUAN HỆ THỐNG & TÍNH NĂNG (FEATURES)

1. **Hệ Thống SCORM & Khoá Học Tương Tác:**
   - Tải lên tự động gói `.zip` SCORM 1.2 (Hỗ trợ nhúng video MP4 và các file HTML bài tập kéo thả/trắc nghiệm tương tác).
   - Tracking quá trình học qua API: Theo dõi phần trăm hoàn thành, cập nhật trạng thái `completed` liền mạch trên Server.

2. **Hệ Quản Trị Bài Tập & Đề Thi (Assignments):**
   - Chức năng giao bài nhanh qua `QuizBuilderModal` (Phân tích PDF/LaTeX/MathJax).
   - Quản lý logic dạng rễ cây (**Tree View**): Nhóm bài tập vào các Thư mục (Virtual Folders).
   - Sinh viên có tính năng phân rã bài tập theo thư mục, và nút **Refresh thủ công** tiện lợi.

3. **Quản Lý Học Sinh & Dòng Tiền (Tuition):**
   - **My Students:** Giao diện quản lý danh sách học sinh thông minh, phân tầng tự động theo từng Lớp học (`class_name`).
   - **Tuition (Học phí):** Bảng thống kê tài chính được gộp dưới dạng Accordion (Đóng/Mở theo Tháng hoặc Chu kỳ nộp).

4. **Công Nghệ Live Session & Trí Tuệ Nhân Tạo (P2P + AI):**
   - Phòng học tương tác tức thời (WebRTC / PeerJS) hỗ trợ mọi thiết bị bao gồm **MacOS & iOS Safari** (Chia sẻ màn hình).
   - Tích hợp bảng vẽ kỹ thuật số (Annotation Board).
   - Tự động nhận diện mức độ tập trung (DAiSEE) và cảm xúc qua luồng Neural AI độc quyền - RAPT-CLIP.

## 🎨 TỔNG QUAN GIAO DIỆN (UI / UX)
- **Thiết Kế Chủ Đạo:** Theo đuổi phong cách Hiện đại, Bóng bẩy (`Glassmorphism`), Giao diện Tối (`Dark Mode`) cao cấp phối với dải màu Gradient Pastel.
- **Tính Chuyên Nghiệp:** Các khối thống kê đếm số linh động (Số bài tập, Tỉ lệ hoàn thành, Cần chấm - Đã chấm).
- **Hoạt Ảnh:** Sử dụng `<motion.div>` từ thư viện Framer Motion để tạo các hiệu ứng Slide In, Fade In cho Modals và Accordions siêu mượt, xoá mờ ranh giới sự trễ nải của web cũ.
- **Responsive:** Tối ưu hóa layout bằng CSS Grid & Flexbox, bảo đảm tỷ lệ hiển thị vàng trên cả Smart Phone lẫn Màn hình Rộng.

---

## 📝 NHẬT KÝ ĐẨY VPS QUY MÔ LỚN (CHANGELOG)

### 🟢 [v1.1.0] - 2026-04-27
- **Môi trường Deploy:** Production (VPS Cloud `14.225.206.241` via SSH).
- **Tính năng / Cập nhật:**
  1. **UI Học Sinh (`practice/page.tsx`):** Nhóm bài kiểm tra theo "Folder", gom các bài mồ côi vào "Bài tập tự do". Thêm nút Cập nhật (Refresh call) không tải lại trang.
  2. **UI Cấu Trúc Lớp (`my-students/page.tsx`):** Ra mắt cơ chế thẻ tab phân rõ học sinh đang thuộc lớp nào.
  3. **UI Học Phí Cải Tiến (`tuition/page.tsx`):** Triển khai giao diện thiết kế gộp (Accordion) thống kê phiếu nộp theo Thuộc tính tháng.
  4. **Teacher Screen Share (`live/page.tsx`):** Vá triệt để lỗi "Cannot block/lock on getDisplayMedia" của Apple/iOS.
  5. **Tối Ưu SCORM (Bài 8):** Dữ liệu source video .mov được encode sang .mp4 nhẹ, tương thích cao. Khắc phục Validation Error nhờ xoá file khai báo rác trong `imsmanifest.xml`.

=========================================

### ⚪️ [Mẫu Thêm Phiên Bản] - Ngày/Tháng/Năm
- **Môi trường Deploy:** [Ngrok / VPS ...]
- **Tính năng / Cập nhật:**
  1. ...
