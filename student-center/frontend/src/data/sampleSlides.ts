import { SlideData } from "@/lib/pptxExporter";

export const TIN10_BAI1_SLIDES: SlideData[] = [
  {
    id: "slide-1",
    slideNumber: 1,
    activityType: "intro",
    badge: "Mở đầu",
    title: "Bài 1: Thông tin và Xử lí thông tin",
    subtitle: "Môn Tin học 10 • Bộ sách Kết nối tri thức với cuộc sống",
    bulletPoints: [
      "📌 Phân biệt bản chất giữa Dữ liệu (Data) và Thông tin (Information).",
      "📌 Nắm vững chu trình 3 bước xử lý thông tin của máy tính.",
      "📌 Sử dụng thành thạo bảng quy đổi đơn vị lưu trữ dữ liệu (Bit -> Byte -> Yottabyte).",
      "📌 Nhận diện 4 ưu điểm vượt trội của thiết bị số trong cuộc cách mạng 4.0.",
      "🚀 MỞ RỘNG: Trí tuệ nhân tạo (AI), Điện toán đám mây & An toàn dữ liệu số."
    ],
    callout: {
      title: "Mục tiêu bài học",
      content: "Trang bị cho học sinh nền tảng tư duy số vững chắc theo chuẩn chương trình GDPT 2018."
    },
    notes: "Giáo viên chào lớp, giới thiệu chủ đề Bài 1 và nhấn mạnh tầm quan trọng của thông tin trong thời đại số."
  },
  {
    id: "slide-2",
    slideNumber: 2,
    activityType: "warmup",
    badge: "Hoạt động 1: Khởi động",
    title: "Tình huống thực tế & Thế giới số quanh em",
    subtitle: "Chúng ta tiếp nhận thông tin từ môi trường như thế nào?",
    cards: [
      { title: "Tiếng chuông báo thức", desc: "Tai nghe thấy âm thanh (dữ liệu) -> Bộ não hiểu rằng 'Đã 6h sáng, phải dậy đi học' (thông tin).", icon: "⏰" },
      { title: "Đèn giao thông chuyển đỏ", desc: "Mắt nhìn thấy màu đỏ (dữ liệu) -> Hiểu là 'Phải dừng xe lại ngay lập tức' (thông tin).", icon: "🚦" },
      { title: "Dự báo thời tiết 39°C", desc: "Con số 39°C (dữ liệu) -> Rút ra quyết định 'Trời rất nắng nóng, cần mang áo chống nắng' (thông tin).", icon: "☀️" }
    ],
    callout: {
      title: "Câu hỏi gợi mở",
      content: "Con người tiếp nhận dữ liệu bằng các giác quan rồi xử lý bằng não bộ. Vậy máy tính tiếp nhận và xử lý dữ liệu bằng cách nào?"
    },
    notes: "Giáo viên đặt câu hỏi cho 2-3 học sinh chia sẻ thêm các ví dụ trong cuộc sống hàng ngày."
  },
  {
    id: "slide-3",
    slideNumber: 3,
    activityType: "warmup",
    badge: "Hoạt động 1: Khởi động",
    title: "Phân loại: Thiết bị Số vs Thiết bị Truyền thống",
    subtitle: "Nhận biết các thiết bị lưu trữ và truyền tin trong đời sống",
    comparison: {
      leftTitle: "💻 Thiết Bị Số (Digital)",
      leftContent: "• Thẻ nhớ MicroSD 1 TB (lưu 250.000 ảnh)\n• Máy tính xách tay, Smartphone\n• Bộ phát Wifi, Router Internet\n• Máy ảnh kỹ thuật số (DSLR)\n-> Làm việc với các tín hiệu bit 0 và 1.",
      rightTitle: "📻 Thiết Bị Truyền Thống (Analog)",
      rightContent: "• Đồng hồ cơ lên dây cót bằng bánh răng\n• Đĩa hát than (Vinyl), Băng cassette từ tính\n• Thư viết tay gửi qua bưu điện\n• Máy chụp ảnh dùng cuộn phim nhựa\n-> Dựa vào cơ học hoặc biến đổi liên tục."
    },
    notes: "Giáo viên cho học sinh chơi mini-game phân loại trên bảng tương tác."
  },
  {
    id: "slide-4",
    slideNumber: 4,
    activityType: "knowledge",
    badge: "Hoạt động 2: Hình thành kiến thức",
    title: "Sơ đồ 3 Bước Xử lý Thông tin của Máy Tính",
    subtitle: "Cách thức máy tính thu nhận, biến đổi và trả lại kết quả cho con người",
    cards: [
      { title: "1. Tiếp nhận (Input)", desc: "Thu nhận dữ liệu thô từ bàn phím, chuột, camera, cảm biến... chuyển thành dãy bit 0 và 1.", icon: "⌨️" },
      { title: "2. Xử lí (Processing)", desc: "CPU biến đổi, tính toán các bit trong bộ nhớ để tạo ra dữ liệu mới và thông tin có ích.", icon: "🧠" },
      { title: "3. Đưa ra kết quả (Output)", desc: "Xuất ra màn hình, loa, máy in hoặc lưu trữ vào ổ cứng, thẻ nhớ, Google Drive.", icon: "🖥️" }
    ],
    callout: {
      title: "Ghi nhớ cốt lõi",
      content: "Quá trình xử lí thông tin của máy tính gồm 3 bước: Tiếp nhận dữ liệu -> Xử lí dữ liệu -> Đưa ra kết quả."
    },
    notes: "Chiếu video hoạt họa Manim mô phỏng luồng dữ liệu chạy qua CPU."
  },
  {
    id: "slide-5",
    slideNumber: 5,
    activityType: "knowledge",
    badge: "Hoạt động 2: Hình thành kiến thức",
    title: "Phân biệt Bản chất: Dữ liệu vs Thông tin",
    subtitle: "Dữ liệu là đầu vào thô — Thông tin là tri thức có ý nghĩa",
    comparison: {
      leftTitle: "📄 Dữ Liệu (Data)",
      leftContent: "• Là các con số, văn bản, hình ảnh, âm thanh thô được lưu trữ trong máy tính.\n• Là phương tiện mang thông tin.\n• Ví dụ: Chuỗi ký tự '39°C', dãy số '100110', bức ảnh chụp X-quang thô.",
      rightTitle: "💡 Thông Tin (Information)",
      rightContent: "• Là ý nghĩa, tri thức mà con người rút ra được từ dữ liệu trong một ngữ cảnh cụ thể.\n• Cùng 1 dữ liệu '39°C':\n  + Trong dự báo thời tiết: 'Trời rất nóng'.\n  + Trong bệnh án: 'Bệnh nhân sốt cao'."
    },
    callout: {
      title: "Tính toàn vẹn",
      content: "Dữ liệu có thể được sao chép nguyên vẹn, nhưng thông tin thu nhận được phụ thuộc vào người tiếp nhận và ngữ cảnh."
    },
    notes: "Nhấn mạnh với học sinh câu hỏi thường gặp trong đề thi THPT về sự khác nhau giữa Data và Info."
  },
  {
    id: "slide-6",
    slideNumber: 6,
    activityType: "knowledge",
    badge: "Hoạt động 2: Hình thành kiến thức",
    title: "Đơn vị Đo Lượng Thông Tin & Lưu Trữ Dữ Liệu",
    subtitle: "Quy ước lũy thừa cơ số 2 (Hệ số 2¹⁰ = 1024)",
    bulletPoints: [
      "🔹 Bit (b): Đơn vị nhỏ nhất, nhận giá trị 0 hoặc 1 (tương ứng đóng/mở công tắc điện).",
      "🔹 Byte (B): Gồm 8 bit. Là đơn vị cơ bản để lưu trữ 1 ký tự chữ cái (Ví dụ: 'A', 'B').",
      "🔹 Kilobyte (KB): 1 KB = 1024 Byte = 2¹⁰ B (~1 trang văn bản ngắn).",
      "🔹 Megabyte (MB): 1 MB = 1024 KB = 2²⁰ B (~1 cuốn sách 500 trang / 1 bài hát MP3).",
      "🔹 Gigabyte (GB): 1 GB = 1024 MB = 2³⁰ B (~1 tập phim HD / 250 bài hát).",
      "🔹 Terabyte (TB): 1 TB = 1024 GB = 2⁴⁰ B (~Thư viện sách trường học / 250.000 ảnh).",
      "🔹 PB -> EB -> ZB -> YB: Các đơn vị lưu trữ dữ liệu quy mô toàn cầu."
    ],
    callout: {
      title: "Quy tắc vàng quy đổi",
      content: "Mỗi đơn vị đo dữ liệu lớn hơn liền kề gấp 1024 lần (2¹⁰) đơn vị đo nhỏ hơn trước nó."
    },
    notes: "Mở công cụ Thước đo tương tác InteractiveUnitScale trên bài giảng cho học sinh kéo thanh trượt."
  },
  {
    id: "slide-7",
    slideNumber: 7,
    activityType: "knowledge",
    badge: "Hoạt động 2: Hình thành kiến thức",
    title: "Bốn Ưu Điểm Vượt Trội Của Thiết Bị Số",
    subtitle: "Tại sao công nghệ số lại thay thế hoàn toàn công nghệ tương tự?",
    cards: [
      { title: "Lưu trữ khổng lồ", desc: "Một chiếc đĩa cứng nhỏ 2 TB có thể chứa trọn vẹn toàn bộ thư viện sách của một trường đại học lớn.", icon: "📚" },
      { title: "Xử lý siêu tốc độ", desc: "Thực hiện hàng trăm triệu đến hàng tỉ phép tính mỗi giây với độ chính xác tuyệt đối không mệt mỏi.", icon: "⚡" },
      { title: "Truyền tin tức thời", desc: "Truyền hàng triệu ký tự / giây qua mạng cáp quang và Internet đi vòng quanh Trái Đất trong tích tắc.", icon: "🌐" },
      { title: "Tự động hoá liên tục", desc: "Có thể lập trình để tự động thực hiện các quy trình phức tạp 24/7 mà không cần con người can thiệp.", icon: "🤖" }
    ],
    notes: "Phân tích vì sao smartphone ngày nay thay thế cả máy ảnh, radio, máy nghe nhạc, máy ghi âm."
  },
  {
    id: "slide-8",
    slideNumber: 8,
    activityType: "expansion",
    badge: "🚀 Mở rộng 1: Ngoài SGK",
    title: "Trí Tuệ Nhân Tạo (AI) & Big Data Xử Lý Dữ Liệu Thế Nào?",
    subtitle: "Từ Dữ liệu khổng lồ (Big Data) tạo ra Trí tuệ máy (Artificial Intelligence)",
    cards: [
      { title: "Mô hình ngôn ngữ lớn (LLM)", desc: "ChatGPT, Gemini được đào tạo trên hàng Petabyte văn bản toàn cầu để hiểu và trò chuyện như con người.", icon: "🤖" },
      { title: "Thị giác máy tính (Vision)", desc: "Camera AI quét hàng triệu điểm ảnh mỗi giây để nhận diện khuôn mặt, biển số xe và điều khiển xe tự lái.", icon: "👁️" },
      { title: "Thuật toán gợi ý (Recommend)", desc: "TikTok, YouTube, Shopee phân tích lịch sử bấm chuột của bạn để đề xuất video, món hàng bạn thích.", icon: "🎯" }
    ],
    callout: {
      title: "Bài học rút ra",
      content: "Trong kỷ nguyên AI: 'Dữ liệu (Data) chính là nguồn dầu mỏ mới' của thế giới."
    },
    notes: "Mở rộng liên hệ thực tế về cách ChatGPT xử lý dữ liệu văn bản thành câu trả lời thông minh."
  },
  {
    id: "slide-9",
    slideNumber: 9,
    activityType: "expansion",
    badge: "🚀 Mở rộng 2: Ngoài SGK",
    title: "Điện Toán Đám Mây & Trung Tâm Dữ Liệu (Data Center)",
    subtitle: "Dữ liệu Google Drive, iCloud, Facebook của chúng ta được lưu ở đâu?",
    bulletPoints: [
      "☁️ Điện toán đám mây (Cloud Computing): Dữ liệu không lưu trên máy tính của bạn mà lưu trên các siêu máy chủ khổng lồ đặt tại Data Center.",
      "🏢 Trung tâm dữ liệu (Data Center): Những toà nhà rộng hàng chục hecta chứa hàng trăm nghìn máy chủ hoạt động 24/7 với hệ thống làm mát bằng chất lỏng chuyên dụng.",
      "🔄 Tự động đồng bộ: Bạn sửa tài liệu trên điện thoại, máy tính ở nhà sẽ tự động cập nhật ngay lập tức.",
      "🛡️ An toàn dự phòng: Dữ liệu được sao lưu ở nhiều quốc gia khác nhau, không sợ bị mất khi hỏng điện thoại."
    ],
    callout: {
      title: "Ứng dụng trong MINDA",
      content: "Bài giảng và bài tập của bạn đang được lưu trữ trực tiếp trên đám mây Google Drive và máy chủ MINDA."
    },
    notes: "Giải thích cho học sinh hiểu khái niệm 'Lưu trên mây' thực chất là lưu ở các trung tâm máy chủ khổng lồ."
  },
  {
    id: "slide-10",
    slideNumber: 10,
    activityType: "expansion",
    badge: "🚀 Mở rộng 3: Ngoài SGK",
    title: "An Toàn Thông Tin & Bảo Vệ Dữ Liệu Cá Nhân",
    subtitle: "Bảo vệ bản thân trên không gian mạng và phòng ngừa lừa đảo Deepfake",
    cards: [
      { title: "Bảo mật số CCCD & OTP", desc: "Không chụp ảnh CCCD, không gửi mã OTP ngân hàng cho bất kỳ ai trên mạng xã hội.", icon: "🔒" },
      { title: "Cảnh giác Deepfake AI", desc: "Kẻ xấu dùng AI giả giọng nói, giả khuôn mặt người thân gọi video call để vay tiền.", icon: "🎭" },
      { title: "Mật khẩu mạnh & 2FA", desc: "Dùng mật khẩu dài gồm chữ hoa, số, ký tự đặc biệt và bật xác thực 2 lớp qua điện thoại.", icon: "🔑" }
    ],
    callout: {
      title: "Thông điệp an toàn số",
      content: "Thông tin cá nhân chính là tài sản số của bạn. Hãy bảo vệ cẩn trọng như ví tiền của mình!"
    },
    notes: "Nhắc nhở học sinh về các quy tắc an ninh mạng cơ bản theo Luật An ninh mạng Việt Nam."
  },
  {
    id: "slide-11",
    slideNumber: 11,
    activityType: "practice",
    badge: "Hoạt động 3: Luyện tập",
    title: "Mini-Game: Ghép Đôi Quy Đổi Đơn Vị Dung Lượng",
    subtitle: "Thực hành tính toán nhanh các đơn vị dữ liệu chuẩn SGK",
    bulletPoints: [
      "📌 Ghép cặp 1: 3 MB  ➔  3.072 KB (vì 3 × 1024)",
      "📌 Ghép cặp 2: 2 GB  ➔  2.097.152 KB (vì 2 × 1024 × 1024)",
      "📌 Ghép cặp 3: 2048 B  ➔  2 KB (vì 2048 / 1024)",
      "📌 Ghép cặp 4: 1 Byte  ➔  8 bit (1 B = 8 b)"
    ],
    callout: {
      title: "Mẹo tính nhẩm",
      content: "Nhớ các lũy thừa của 2: 2¹⁰ = 1024, 2²⁰ = 1.048.576, 2³⁰ = 1.073.741.824."
    },
    notes: "Cho học sinh xung phong lên bảng tương tác thực hiện kéo thả ghép cặp."
  },
  {
    id: "slide-12",
    slideNumber: 12,
    activityType: "practice",
    badge: "Hoạt động 3: Luyện tập",
    title: "Bài Toán Thực Tế: Sức Chứa Thẻ Nhớ Máy Ảnh Số",
    subtitle: "Ứng dụng tính toán dung lượng trong đời sống hàng ngày",
    cards: [
      { title: "Đề bài", desc: "Một thẻ nhớ máy ảnh có dung lượng 16 GB. Biết mỗi bức ảnh JPG có kích thước trung bình 10 MB. Thẻ nhớ có thể chứa tối đa bao nhiêu bức ảnh?", icon: "📷" },
      { title: "Bước 1: Đổi đơn vị", desc: "Đổi dung lượng thẻ nhớ từ GB sang MB:\n16 GB = 16 × 1024 MB = 16.384 MB", icon: "📐" },
      { title: "Bước 2: Tính số ảnh", desc: "Số lượng bức ảnh có thể chứa được:\n16.384 / 10 = 1.638,4 ảnh\n-> Khoảng 1.638 bức ảnh!", icon: "✅" }
    ],
    notes: "Hướng dẫn học sinh các bước đổi đơn vị về cùng một thứ nguyên trước khi chia."
  },
  {
    id: "slide-13",
    slideNumber: 13,
    activityType: "application",
    badge: "Hoạt động 4: Vận dụng",
    title: "Công Nghệ Thẻ Căn Cước Công Dân Gắn Chip",
    subtitle: "Tại sao thẻ CCCD lại kết hợp cả Mã QR và Chip nhớ điện tử?",
    comparison: {
      leftTitle: "📱 Mã QR Code (In trên mặt thẻ)",
      leftContent: "• Mục đích: Quét nhanh bằng camera điện thoại thông thường.\n• Chứa: Số CCCD, Họ tên, Ngày sinh, Giới tính, Nơi thường trú.\n• Ưu điểm: Đọc tức thì, không cần thiết bị đầu đọc chuyên dụng.",
      rightTitle: "🛡️ Chip Nhớ Điện Tử (Gắn chìm)",
      rightContent: "• Mục đích: Lưu trữ dữ liệu bảo mật mức độ cao.\n• Chứa: Dữ liệu sinh trắc học mã hoá (vân tay 2 ngón, đặc điểm nhận dạng khuôn mặt).\n• Ưu điểm: Chống làm giả tuyệt đối, chỉ thiết bị của cơ quan chức năng mới giải mã được."
    },
    notes: "Liên hệ thực tiễn việc chuyển đổi số và tài khoản định danh điện tử VNeID."
  },
  {
    id: "slide-14",
    slideNumber: 14,
    activityType: "application",
    badge: "Hoạt động 4: Vận dụng",
    title: "Dự Án Số Hóa 2.000 Cuốn Sách Thư Viện",
    subtitle: "Giải quyết bài toán lưu trữ tài nguyên tri thức số",
    bulletPoints: [
      "📚 Thư viện trường học có 2.000 cuốn sách giáo khoa và tham khảo.",
      "💾 Mỗi cuốn sách khi số hóa gồm toàn bộ chữ và hình ảnh màu sắc nét có dung lượng khoảng 50 MB.",
      "🔢 Tổng dung lượng cần thiết: 2.000 cuốn × 50 MB = 100.000 MB.",
      "📐 Đổi ra Gigabyte: 100.000 / 1024 ≈ 97,65 GB (< 100 GB).",
      "🏆 KẾT LUẬN: Một chiếc thẻ nhớ nhỏ xíu 256 GB (giá ~300.000 VNĐ) có thể chứa trọn vẹn cả thư viện sách của trường và còn dư hơn 150 GB!"
    ],
    callout: {
      title: "Ý nghĩa của chuyển đổi số",
      content: "Giúp tiết kiệm không gian, chi phí in ấn và học sinh ở vùng sâu vùng xa đều có thể tiếp cận sách dễ dàng qua Internet."
    },
    notes: "Khuyến khích học sinh phát biểu cảm nghĩ về sự kỳ diệu của công nghệ số."
  },
  {
    id: "slide-15",
    slideNumber: 15,
    activityType: "summary",
    badge: "Tổng kết bài học",
    title: "Ghi Nhớ Trọng Tâm & Dặn Dò Về Nhà",
    subtitle: "Hệ thống hóa toàn bộ kiến thức Tin học 10 Bài 1",
    cards: [
      { title: "1. Quá trình xử lý", desc: "Tiếp nhận (Input) -> Xử lí (Processing) -> Xuất kết quả (Output).", icon: "🔄" },
      { title: "2. Dữ liệu vs Thông tin", desc: "Dữ liệu là vật mang tin; Thông tin là ý nghĩa được rút ra.", icon: "💡" },
      { title: "3. Thang đo dung lượng", desc: "Bit -> Byte -> KB -> MB -> GB -> TB -> PB (hệ số 1024).", icon: "📏" },
      { title: "4. Nhiệm vụ về nhà", desc: "Làm bài tập trên MINDA LMS, chuẩn bị Bài 2: Sự ưu việt của máy tính.", icon: "📝" }
    ],
    notes: "Giáo viên dặn học sinh quét mã QR làm bài tập củng cố trên MINDA LMS."
  }
];
