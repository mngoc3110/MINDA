import { InteractiveLesson } from "@/lib/scormPackager";

export const SAMPLE_LESSONS: InteractiveLesson[] = [
  {
    id: "tin-10-bai-1",
    title: "Bài 1: Thông tin và Xử lí thông tin",
    subject: "Tin học",
    grade: "Lớp 10",
    author: "MINDA AI & GDPT 2018 (Kết nối tri thức)",
    description: "Khám phá bản chất của thông tin, phân biệt dữ liệu và thông tin, bảng đơn vị lưu trữ dữ liệu từ Bit đến Yottabyte, và ưu điểm vượt bậc của thiết bị số trong đời sống.",
    manimVideoUrl: "/media/manim_tin10_bai1.mp4",
    createdAt: "2026-08-11T00:00:00Z",
    activities: [
      {
        id: "act-warmup",
        type: "warmup",
        title: "Khởi động: Phân loại Thiết bị Số & Gợi mở Tri thức",
        subtitle: "Quan sát thực tế và phân biệt thế giới số",
        content: `Tin học được định nghĩa là khoa học nghiên cứu các phương pháp và quá trình xử lí thông tin tự động bằng các phương tiện kĩ thuật, chủ yếu bằng máy tính. 
Chúng ta đã biết thông tin được biểu diễn trong máy tính bằng các dãy bit (gồm các kí hiệu 0, 1). Vậy dữ liệu và thông tin khác nhau như thế nào? Thiết bị số có gì ưu việt so với thiết bị truyền thống?`,
        interactiveType: "case_study",
        interactiveData: {
          items: [
            { id: "1", name: "Thẻ nhớ MicroSD 1 TB", type: "digital", icon: "💾", desc: "Chứa được ~250.000 bức ảnh độ phân giải cao" },
            { id: "2", name: "Đồng hồ cơ lên dây cót", type: "analog", icon: "🕰️", desc: "Hoạt động bằng bánh răng cơ học, không xử lý bit" },
            { id: "3", name: "Đĩa hát than (Vinyl)", type: "analog", icon: "📻", desc: "Lưu sóng âm dạng rãnh vật lý, không phải dữ liệu số" },
            { id: "4", name: "Máy tính xách tay (Laptop)", type: "digital", icon: "💻", desc: "Xử lý hàng tỷ phép tính số học mỗi giây" },
            { id: "5", name: "Bộ thu phát Wifi", type: "digital", icon: "📡", desc: "Truyền dữ liệu số qua sóng vô tuyến với tốc độ hàng trăm Mbps" },
            { id: "6", name: "Thư tay gửi bưu điện", type: "analog", icon: "✉️", desc: "Mất vài ngày để truyền tin thủ công bằng giấy mực" },
          ],
          prompt: "Hãy phân loại các đồ vật trên vào nhóm THIẾT BỊ SỐ hoặc THIẾT BỊ TRUYỀN THỐNG."
        }
      },
      {
        id: "act-knowledge",
        type: "knowledge",
        title: "Hình thành kiến thức: Quá trình Xử lý Thông tin & Đơn vị Đo lường",
        subtitle: "3 bước xử lý thông tin, phân biệt Dữ liệu - Thông tin, thang đo bit -> Byte -> YB",
        content: `**1. Quá trình xử lí thông tin của máy tính gồm 3 bước:**
- **Bước 1: Tiếp nhận dữ liệu:** Máy tính nhận dữ liệu từ bàn phím, chuột, camera, máy quét... chuyển thành dãy bit.
- **Bước 2: Xử lí dữ liệu:** Biến đổi dữ liệu trong bộ nhớ (CPU) để tạo ra dữ liệu mới và thông tin có ích.
- **Bước 3: Đưa ra kết quả:** Xuất dữ liệu/thông tin ra màn hình, loa, máy in hoặc lưu trữ vào vật mang tin.

**2. Phân biệt Dữ liệu và Thông tin:**
- *Dữ liệu:* Là các số, chữ, hình ảnh, âm thanh thô được đưa vào máy tính (Dãy bit).
- *Thông tin:* Là ý nghĩa, tri thức mà con người rút ra được từ dữ liệu. Cùng 1 dữ liệu "39°C": trong dự báo thời tiết có nghĩa là "Trời rất nóng", trong bệnh án y tế có nghĩa là "Bệnh nhân sốt cao".

**3. Đơn vị lưu trữ dữ liệu:**
Các đơn vị đo dữ liệu hơn kém nhau 2¹⁰ = 1024 lần (Byte, KB, MB, GB, TB, PB, EB, ZB, YB).`,
        interactiveType: "unit_scale",
        interactiveData: {
          processSteps: [
            { step: 1, title: "Tiếp nhận dữ liệu (Input)", icon: "⌨️", desc: "Từ bàn phím, chuột, micro, camera, máy quét..." },
            { step: 2, title: "Xử lí dữ liệu (Processing)", icon: "🧠", desc: "CPU biến đổi dữ liệu trong bộ nhớ RAM/ROM" },
            { step: 3, title: "Đưa ra kết quả (Output)", icon: "🖥️", desc: "Màn hình, loa, máy in, lưu vào ổ cứng / Drive" },
          ],
          advantages: [
            { title: "Lưu trữ dung lượng khổng lồ", desc: "Một đĩa cứng 2 TB chứa được thư viện sách của cả trường đại học.", icon: "📚" },
            { title: "Tốc độ xử lý siêu tốc", desc: "Thực hiện hàng trăm triệu đến hàng tỉ phép tính mỗi giây không sai sót.", icon: "⚡" },
            { title: "Truyền tin tức thời", desc: "Truyền hàng triệu ký tự / giây qua cáp quang và Internet toàn cầu.", icon: "🌐" },
            { title: "Tự động hoá công việc", desc: "Làm việc liên tục 24/7, ổn định với chi phí thấp.", icon: "🤖" },
          ]
        }
      },
      {
        id: "act-practice",
        type: "practice",
        title: "Luyện tập: Thử thách Quy đổi Đơn vị & Tính toán Sức chứa",
        subtitle: "Thực hành tính toán đơn vị dung lượng chuẩn SGK",
        content: `Thực hành kiểm tra kiến thức về đơn vị lưu trữ dữ liệu và giải quyết bài toán thực tế về dung lượng thẻ nhớ máy ảnh số.`,
        interactiveType: "drag_drop",
        interactiveData: {
          dragPairs: [
            { left: "3 MB", right: "3072 KB", hint: "3 x 1024" },
            { left: "2 GB", right: "2097152 KB", hint: "2 x 1024 x 1024" },
            { left: "2048 B", right: "2 KB", hint: "2048 / 1024" },
            { left: "1 Byte", right: "8 bit", hint: "1 Byte = 8 bit" },
          ],
          quizQuestions: [
            {
              question: "Định nghĩa nào về Byte là chính xác nhất?",
              options: ["A. Là một kí tự", "B. Là đơn vị dữ liệu gồm 8 bit", "C. Là đơn vị đo tốc độ máy tính", "D. Là một dãy 8 chữ số"],
              correctIndex: 1,
              explanation: "Byte là đơn vị dữ liệu nhỏ nhất mà máy tính có thể truy cập trực tiếp, gồm 8 bit."
            },
            {
              question: "Một thẻ nhớ máy ảnh có dung lượng 16 GB. Biết mỗi bức ảnh JPG có kích thước trung bình 10 MB. Thẻ nhớ đó có thể chứa tối đa khoảng bao nhiêu bức ảnh?",
              options: ["A. Khoảng 160 ảnh", "B. Khoảng 1000 ảnh", "C. Khoảng 1638 ảnh", "D. Khoảng 16000 ảnh"],
              correctIndex: 2,
              explanation: "16 GB = 16 x 1024 MB = 16384 MB. Số ảnh chứa được = 16384 / 10 ≈ 1638 bức ảnh."
            }
          ]
        }
      },
      {
        id: "act-application",
        type: "application",
        title: "Vận dụng: Công nghệ Thẻ CCCD & Chuyển đổi Số",
        subtitle: "Ứng dụng thiết bị số trong chuyển đổi số quốc gia",
        content: `**Tình huống 1:** Trong thẻ Căn cước công dân (CCCD) có gắn chip:
- *Mã QR code:* In trên bề mặt thẻ để máy quét/điện thoại đọc nhanh thông tin cơ bản (Số CCCD, Họ tên, Ngày sinh, Địa chỉ).
- *Chip điện tử:* Lưu trữ mã hóa dữ liệu sinh trắc học (vân tay, khuôn mặt, đặc điểm nhận dạng), chỉ các thiết bị chuyên dụng của cơ quan chức năng mới đọc được, giúp bảo mật tối đa và chống làm giả thẻ.

**Tình huống 2:** Số hóa thư viện trường học:
- Một cuốn sách số hóa (gồm cả chữ và hình ảnh) có dung lượng khoảng 50 MB.
- Thư viện trường có 2.000 cuốn sách. Tổng dung lượng cần lưu trữ: $2.000 \times 50\text{ MB} = 100.000\text{ MB} \approx 97.65\text{ GB} < 100\text{ GB}$.
- **Kết luận:** Thẻ nhớ 256 GB hoàn toàn có thể lưu trữ trọn vẹn toàn bộ thư viện sách!`,
        interactiveType: "discussion",
        interactiveData: {
          questions: [
            "1. Theo em, việc chuyển từ chụp ảnh bằng phim nhựa sang máy ảnh số (smartphone) đã mang lại những lợi ích gì cho con người?",
            "2. Hãy nêu một ví dụ trong gia đình em về việc dữ liệu được thiết bị số thu thập và chuyển thành thông tin hữu ích."
          ]
        }
      }
    ]
  }
];
