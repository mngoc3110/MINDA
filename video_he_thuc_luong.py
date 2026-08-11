from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService

# ==============================================================================
# HỆ THỨC LƯỢNG TRONG TAM GIÁC & GIÁ TRỊ LƯỢNG GIÁC (he-thuc-luong.tex)
# GV: NGUYỄN LÊ MINH NGỌC - CHUYÊN ĐỀ TỔNG ÔN LỚP 10 - 11 - 12
# ==============================================================================

class Scene1_GiaTriLuongGiac(VoiceoverScene):
    """Phần 1: Nửa đường tròn đơn vị, góc lượng giác, điểm M(x0, y0) di chuyển"""
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        header = Text("BÀI GIẢNG: HỆ THỨC LƯỢNG VÀ GIÁ TRỊ LƯỢNG GIÁC", font_size=22, color=YELLOW).to_edge(UP)
        sub_info = Text("GV: Nguyễn Lê Minh Ngọc | Chuyên đề Toán 10 - 11", font_size=16, color=BLUE_B).next_to(header, DOWN, buff=0.15)

        with self.voiceover(text="Chào mừng các em học sinh! Hôm nay chúng ta sẽ cùng nghiên cứu toàn bộ chuyên đề Hệ thức lượng trong tam giác và Giá trị lượng giác của một góc từ 0 đến 180 độ."):
            self.play(Write(header), FadeIn(sub_info))

        # 1. Nửa đường tròn đơn vị & Điểm M(x0, y0) di chuyển
        axes = Axes(x_range=[-1.5, 1.5, 0.5], y_range=[-0.2, 1.5, 0.5], x_length=5.0, y_length=2.8, axis_config={"include_tip": True}).to_edge(LEFT, buff=0.5).shift(DOWN * 0.4)
        
        # Unit semicircle
        semicircle = Arc(radius=1.8, start_angle=0, angle=PI, color=WHITE).move_to(axes.c2p(0, 0), aligned_edge=DOWN)
        
        # Rotating angle alpha and point M
        angle_vt = ValueTracker(45) # 45 degrees
        
        def get_m_pos():
            rad = angle_vt.get_value() * DEGREES
            return axes.c2p(np.cos(rad), np.sin(rad))

        dot_M = always_redraw(lambda: Dot(get_m_pos(), color=RED))
        line_OM = always_redraw(lambda: Line(axes.c2p(0, 0), get_m_pos(), color=YELLOW))
        
        # Dashed projection lines to Ox and Oy
        line_px = always_redraw(lambda: DashedLine(get_m_pos(), axes.c2p(np.cos(angle_vt.get_value()*DEGREES), 0), color=GRAY))
        line_py = always_redraw(lambda: DashedLine(get_m_pos(), axes.c2p(0, np.sin(angle_vt.get_value()*DEGREES)), color=GRAY))

        lbl_M = always_redraw(lambda: Text("M(x₀, y₀)", font_size=14, color=RED).next_to(dot_M, UP))

        box_def = RoundedRectangle(corner_radius=0.15, height=3.0, width=5.8, color=TEAL).to_edge(RIGHT, buff=0.5).shift(DOWN * 0.4)
        txt_def = Text(
            "ĐỊNH NGHĨA GIÁ TRỊ LƯỢNG GIÁC:\n"
            "• Tung độ y₀ = sin α\n"
            "• Hoành độ x₀ = cos α\n"
            "• tan α = y₀ / x₀  (với x₀ ≠ 0)\n"
            "• cot α = x₀ / y₀  (với y₀ ≠ 0)\n"
            "Góc lượng giác: Góc xOM tạo bởi\n"
            "bán kính OM trên đường tròn đơn vị.",
            font_size=14, color=WHITE, line_spacing=1.3
        ).move_to(box_def)

        with self.voiceover(text="Trong mặt phẳng tọa độ Oxy, xét nửa đường tròn đơn vị bán kính R bằng 1 nằm phía trên trục hoành. Cho trước góc alpha từ 0 đến 180 độ, có duy nhất điểm M hoành độ x0, tung độ y0 sao cho góc xOM bằng alpha. Khi đó, tung độ y0 được định nghĩa là sin alpha, hoành độ x0 là cosin alpha, tỉ số y0 trên x0 là tang alpha và tỉ số x0 trên y0 là côtang alpha."):
            self.play(Create(axes), Create(semicircle))
            self.play(Create(line_OM), FadeIn(dot_M, lbl_M, line_px, line_py))
            self.play(Create(box_def), Write(txt_def))

        # Animate M moving from 30 deg to 135 deg
        with self.voiceover(text="Quan sát điểm M di chuyển trên nửa đường tròn đơn vị. Khi góc alpha thay đổi, tọa độ x0 và y0 thay đổi liên tục, tạo nên các giá trị lượng giác tương ứng."):
            self.play(angle_vt.animate.set_value(135), run_time=3)
            self.play(angle_vt.animate.set_value(60), run_time=2)

        self.wait(1.5)
        self.clear()


class Scene2A_Special_Angles(VoiceoverScene):
    """Phần 2A: Bảng giá trị lượng giác các góc đặc biệt"""
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("BẢNG GIÁ TRỊ LƯỢNG GIÁC CÁC GÓC ĐẶC BIỆT", font_size=22, color=YELLOW).to_edge(UP)
        self.add(title)

        t_data = [
            ["α", "0°", "30°", "45°", "60°", "90°", "180°"],
            ["sin α", "0", "1/2", "√2/2", "√3/2", "1", "0"],
            ["cos α", "1", "√3/2", "√2/2", "1/2", "0", "-1"],
            ["tan α", "0", "√3/3", "1", "√3", "KXĐ", "0"],
            ["cot α", "KXĐ", "√3", "1", "√3/3", "0", "KXĐ"]
        ]
        
        tbl = Table(t_data, include_outer_lines=True).scale(0.55).next_to(title, DOWN, buff=0.4)

        with self.voiceover(text="Dưới đây là bảng giá trị lượng giác của các góc đặc biệt 0, 30, 45, 60, 90 và 180 độ. Các em cần ghi nhớ kỹ các giá trị 1 phần 2, căn 2 trên 2, căn 3 trên 2 để làm tốt các bài tập lượng giác."):
            self.play(Create(tbl))

        self.wait(2)
        self.clear()


class Scene2B_Visual_Geometric_Relations(VoiceoverScene):
    """Phần 2B: HÌNH VẼ MINH HỌA TRỰC QUAN GÓC BÙ NHAU, PHỤ NHAU, ĐỐI NHAU TRÊN ĐƯỜNG TRÒN ĐƠN VỊ"""
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("HÌNH VẼ MINH HỌA TRỰC QUAN: GÓC BÙ NHAU VÀ GÓC PHỤ NHAU", font_size=22, color=YELLOW).to_edge(UP)
        self.add(title)

        # ----------------------------------------------------------------------
        # 1. HÌNH VẼ MINH HỌA HAI GÓC BÙ NHAU (α và 180° - α)
        # ----------------------------------------------------------------------
        sec1_title = Text("1. Hình vẽ minh họa Hai Góc Bù Nhau (α và 180° - α)", font_size=16, color=TEAL).next_to(title, DOWN, buff=0.2)
        
        axes_bu = Axes(x_range=[-1.5, 1.5, 0.5], y_range=[-0.2, 1.4, 0.5], x_length=4.5, y_length=2.5, axis_config={"include_tip": True}).to_edge(LEFT, buff=0.6).shift(DOWN * 0.4)
        circle_bu = Arc(radius=1.6, start_angle=0, angle=PI, color=WHITE).move_to(axes_bu.c2p(0,0), aligned_edge=DOWN)
        
        # Angle alpha = 30 deg -> M(cos 30, sin 30) = (0.86, 0.5)
        # Angle 180 - alpha = 150 deg -> M'(-cos 30, sin 30) = (-0.86, 0.5)
        p_M = axes_bu.c2p(np.cos(30*DEGREES), np.sin(30*DEGREES))
        p_M_prime = axes_bu.c2p(-np.cos(30*DEGREES), np.sin(30*DEGREES))
        
        dot_M = Dot(p_M, color=GREEN)
        dot_M_prime = Dot(p_M_prime, color=RED)
        
        line_OM = Line(axes_bu.c2p(0,0), p_M, color=GREEN)
        line_OM_prime = Line(axes_bu.c2p(0,0), p_M_prime, color=RED)

        lbl_M = Text("M(x₀, y₀)\nα = 30°", font_size=11, color=GREEN).next_to(dot_M, RIGHT)
        lbl_M_prime = Text("M'(-x₀, y₀)\n180°-α = 150°", font_size=11, color=RED).next_to(dot_M_prime, LEFT)

        # Horizontal dashed line connecting M and M' showing SAME HEIGHT y0!
        line_same_height = DashedLine(p_M_prime, p_M, color=YELLOW, stroke_width=3)
        lbl_same_h = Text("Cùng tung độ y₀ => sin(180°-α) = sin α", font_size=12, color=YELLOW).next_to(line_same_height, UP, buff=0.1)

        box_bu_formulas = RoundedRectangle(corner_radius=0.15, height=2.6, width=6.2, color=ORANGE).to_edge(RIGHT, buff=0.5).shift(DOWN * 0.4)
        txt_bu_formulas = Text(
            "CÔNG THỨC HAI GÓC BÙ NHAU:\n"
            "• M và M' đối xứng qua trục tung Oy!\n"
            "• sin(180° - α) = sin α    (CÙNG TUNG ĐỘ y₀)\n"
            "• cos(180° - α) = -cos α   (HOÀNH ĐỘ ĐỐI NHAU)\n"
            "• tan(180° - α) = -tan α\n"
            "• cot(180° - α) = -cot α",
            font_size=13, color=WHITE, line_spacing=1.25
        ).move_to(box_bu_formulas)

        with self.voiceover(text="Đây là hình vẽ minh họa trực quan hai góc bù nhau alpha và 180 độ trừ alpha trên nửa đường tròn đơn vị. Điểm M đại diện cho góc alpha 30 độ, điểm M phẩy đại diện cho góc bù 150 độ. Do M và M phẩy đối xứng qua trục tung Oy nên chúng có CÙNG TUNG ĐỘ y0. Do đó, sin của 180 độ trừ alpha BẰNG sin alpha, còn cosin hoành độ thì trái dấu âm x0."):
            self.play(Write(sec1_title))
            self.play(Create(axes_bu), Create(circle_bu))
            self.play(Create(line_OM), FadeIn(dot_M, lbl_M))
            self.play(Create(line_OM_prime), FadeIn(dot_M_prime, lbl_M_prime))
            self.play(Create(line_same_height), Write(lbl_same_h))
            self.play(Create(box_bu_formulas), Write(txt_bu_formulas))

        self.wait(2.5)
        self.clear()

        # ----------------------------------------------------------------------
        # 2. HÌNH VẼ MINH HỌA HAI GÓC PHỤ NHAU (α và 90° - α)
        # ----------------------------------------------------------------------
        sec2_title = Text("2. Hình vẽ minh họa Hai Góc Phụ Nhau (α và 90° - α)", font_size=16, color=YELLOW).to_edge(UP)
        self.add(sec2_title)

        axes_phu = Axes(x_range=[-0.2, 1.5, 0.5], y_range=[-0.2, 1.5, 0.5], x_length=3.5, y_length=3.5, axis_config={"include_tip": True}).to_edge(LEFT, buff=0.8).shift(DOWN * 0.3)
        circle_phu = Arc(radius=2.6, start_angle=0, angle=PI/2, color=WHITE).move_to(axes_phu.c2p(0,0), aligned_edge=DOWN+LEFT)

        # Alpha = 30 deg -> M(cos 30, sin 30) = (0.86, 0.5)
        # 90 - Alpha = 60 deg -> N(cos 60, sin 60) = (0.5, 0.86)
        p_M2 = axes_phu.c2p(np.cos(30*DEGREES), np.sin(30*DEGREES))
        p_N2 = axes_phu.c2p(np.cos(60*DEGREES), np.sin(60*DEGREES))

        dot_M2 = Dot(p_M2, color=GREEN)
        dot_N2 = Dot(p_N2, color=BLUE)

        line_OM2 = Line(axes_phu.c2p(0,0), p_M2, color=GREEN)
        line_ON2 = Line(axes_phu.c2p(0,0), p_N2, color=BLUE)

        # Symmetry line y = x
        line_bisector = DashedLine(axes_phu.c2p(0,0), axes_phu.c2p(1.2, 1.2), color=PINK)
        lbl_bis = Text("Đường đối xứng y = x", font_size=11, color=PINK).next_to(line_bisector.get_end(), RIGHT)

        lbl_M2 = Text("M(x₀, y₀) [30°]", font_size=11, color=GREEN).next_to(dot_M2, RIGHT)
        lbl_N2 = Text("N(y₀, x₀) [60°]", font_size=11, color=BLUE).next_to(dot_N2, UP)

        box_phu_formulas = RoundedRectangle(corner_radius=0.15, height=3.0, width=6.2, color=GREEN_B).to_edge(RIGHT, buff=0.5).shift(DOWN * 0.3)
        txt_phu_formulas = Text(
            "CÔNG THỨC HAI GÓC PHỤ NHAU:\n"
            "• M và N đối xứng qua đường y = x!\n"
            "• Tọa độ N hoán đổi: (x₀, y₀) ➔ (y₀, x₀)\n"
            "• sin(90° - α) = cos α\n"
            "• cos(90° - α) = sin α\n"
            "• tan(90° - α) = cot α\n"
            "• cot(90° - α) = tan α",
            font_size=13, color=WHITE, line_spacing=1.25
        ).move_to(box_phu_formulas)

        with self.voiceover(text="Bây giờ là hình vẽ minh họa hai góc phụ nhau alpha 30 độ và 90 độ trừ alpha 60 độ. Hai điểm M và N đối xứng với nhau qua đường phân giác y bằng x. Tọa độ điểm N bị hoán đổi thành y0, x0. Do đó, sin của 90 độ trừ alpha BẰNG cosin alpha, và cosin của 90 độ trừ alpha BẰNG sin alpha. Sin góc này chính là Cosin góc kia!"):
            self.play(Create(axes_phu), Create(circle_phu))
            self.play(Create(line_OM2), FadeIn(dot_M2, lbl_M2))
            self.play(Create(line_ON2), FadeIn(dot_N2, lbl_N2))
            self.play(Create(line_bisector), Write(lbl_bis))
            self.play(Create(box_phu_formulas), Write(txt_phu_formulas))

        self.wait(2.5)
        self.clear()


class Scene3_PhuongTrinhLuongGiac(VoiceoverScene):
    """Phần 3: Phương trình lượng giác cơ bản & Các trường hợp đặc biệt"""
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("GIẢI PHƯƠNG TRÌNH LƯỢNG GIÁC VÀ TRƯỜNG HỢP ĐẶC BIỆT", font_size=22, color=YELLOW).to_edge(UP)
        self.add(title)

        box_eq = RoundedRectangle(corner_radius=0.15, height=2.4, width=11.0, color=GREEN).next_to(title, DOWN, buff=0.3)
        txt_eq = Text(
            "PHƯƠNG TRÌNH LƯỢNG GIÁC CƠ BẢN:\n"
            "1. sin u = sin v  ⇔  u = v + k2π  hoặc  u = π - v + k2π (k ∈ ℤ)\n"
            "2. cos u = cos v  ⇔  u = v + k2π  hoặc  u = -v + k2π (k ∈ ℤ)\n"
            "3. tan u = tan v  ⇔  u = v + kπ (với điều kiện xác định)\n"
            "4. cot u = cot v  ⇔  u = v + kπ (với điều kiện xác định)",
            font_size=14, color=WHITE, line_spacing=1.3
        ).move_to(box_eq)

        box_spec = RoundedRectangle(corner_radius=0.15, height=2.4, width=11.0, color=RED).next_to(box_eq, DOWN, buff=0.3)
        txt_spec = Text(
            "CÁC TRƯỜNG HỢP ĐẶC BIỆT CẦN NHỚ:\n"
            "• sin u = 0  ⇔  u = kπ              |  cos u = 0  ⇔  u = π/2 + kπ\n"
            "• sin u = 1  ⇔  u = π/2 + k2π       |  cos u = 1  ⇔  u = k2π\n"
            "• sin u = -1 ⇔  u = -π/2 + k2π      |  cos u = -1 ⇔  u = π + k2π",
            font_size=14, color=YELLOW_B, line_spacing=1.3
        ).move_to(box_spec)

        with self.voiceover(text="Tiếp theo là phần Giải phương trình lượng giác. Phương trình sin u bằng sin v có 2 họ nghiệm v cộng k 2 pi và pi trừ v cộng k 2 pi. Phương trình cos u bằng cos v có 2 họ nghiệm cộng trừ v cộng k 2 pi. Các trường hợp đặc biệt sin u, cos u bằng 0, bằng 1 hoặc bằng trừ 1 chỉ có duy nhất 1 họ nghiệm gộp cần ghi nhớ chính xác."):
            self.play(Create(box_eq), Write(txt_eq))
            self.play(Create(box_spec), Write(txt_spec))

        self.wait(2)
        self.clear()


class Scene4_DinhLySinCosin(VoiceoverScene):
    """Phần 4: Định lý hàm Sin, Định lý Cosin và Chứng minh công thức chi tiết"""
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("ĐỊNH LÝ COSIN VÀ ĐỊNH LÝ SIN - CÔNG THỨC & CHỨNG MINH", font_size=22, color=YELLOW).to_edge(UP)
        self.add(title)

        # Render Triangle ABC
        pA = [0.0, 1.8, 0]
        pB = [-2.2, -1.0, 0]
        pC = [2.2, -1.0, 0]

        tri = Polygon(pA, pB, pC, color=WHITE).to_edge(LEFT, buff=0.8).shift(DOWN * 0.3)
        lblA = Text("A", font_size=16, color=RED).next_to(tri.get_vertices()[0], UP)
        lblB = Text("B", font_size=16, color=GREEN).next_to(tri.get_vertices()[1], LEFT)
        lblC = Text("C", font_size=16, color=BLUE).next_to(tri.get_vertices()[2], RIGHT)
        lbl_a = Text("a", font_size=15, color=YELLOW).next_to(tri, DOWN)

        box_proof = RoundedRectangle(corner_radius=0.15, height=4.2, width=6.2, color=BLUE_B).to_edge(RIGHT, buff=0.5).shift(DOWN * 0.3)
        txt_proof = Text(
            "1. ĐỊNH LÝ COSIN:\n"
            "   a² = b² + c² - 2bc cos A\n"
            "   b² = c² + a² - 2ca cos B\n"
            "   c² = a² + b² - 2ab cos C\n"
            "CHỨNG MINH:\n"
            "• Ta có vectơ BC⃗ = AC⃗ - AB⃗\n"
            "• Bình phương 2 vế: BC⃗² = (AC⃗ - AB⃗)²\n"
            "  a² = AC² + AB² - 2 AC⃗·AB⃗\n"
            "  a² = b² + c² - 2bc cos A (ĐPCM!)\n\n"
            "2. ĐỊNH LÝ SIN:\n"
            "   a/sin A = b/sin B = c/sin C = 2R",
            font_size=13, color=WHITE, line_spacing=1.25
        ).move_to(box_proof)

        with self.voiceover(text="Định lý Cosin phát biểu: Trong tam giác ABC, bình phương một cạnh bằng tổng bình phương hai cạnh còn lại trừ đi hai lần tích hai cạnh đó nhân với cosin góc kẹp giữa. Chứng minh cực kỳ đơn giản bằng tích vô hướng véc tơ: véc tơ BC bằng AC trừ AB, bình phương hai vế ta thu được a bình bằng b bình cộng c bình trừ 2bc cos A. Định lý Sin phát biểu tỷ số a trên sin A bằng b trên sin B bằng c trên sin C bằng 2R."):
            self.play(Create(tri), FadeIn(lblA, lblB, lblC, lbl_a))
            self.play(Create(box_proof), Write(txt_proof))

        self.wait(2)
        self.clear()


class Scene5_DienTichVaGiaiTamGiac(VoiceoverScene):
    """Phần 5: Các công thức tính diện tích tam giác, bán kính R, r, trung tuyến và chứng minh"""
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("CÔNG THỨC DIỆN TÍCH TAM GIÁC VÀ ĐƯỜNG TRUNG TUYẾN", font_size=22, color=YELLOW).to_edge(UP)
        self.add(title)

        box_area = RoundedRectangle(corner_radius=0.15, height=4.6, width=11.5, color=TEAL).next_to(title, DOWN, buff=0.2)
        txt_area = Text(
            "CÁC CÔNG THỨC DIỆN TÍCH TAM GIÁC ABC (CÓ CHỨNG MINH):\n"
            "1. S = 1/2 a hₐ = 1/2 bc sin A = 1/2 ca sin B = 1/2 ab sin C\n"
            "   (Chứng minh: Hạ chiều cao hₐ = c sin B vào công thức S = 1/2 a hₐ)\n"
            "2. S = abc / (4R)   ⇔   R = abc / (4S) (Kết hợp với định lý Sin: a/sin A = 2R)\n"
            "3. S = p r          ⇔   r = S / p   (với p = (a+b+c)/2 là nửa chu vi)\n"
            "4. Công thức Heron: S = √[p(p - a)(p - b)(p - c)]\n"
            "5. Độ dài đường trung tuyến mₐ:\n"
            "   mₐ² = (b² + c²)/2 - a²/4",
            font_size=14, color=WHITE, line_spacing=1.3
        ).move_to(box_area)

        with self.voiceover(text="Về diện tích tam giác ABC: Ta có công thức 1 phần 2 tích hai cạnh nhân sin góc kẹp giữa. Thay sin A bằng a trên 2R ta được công thức S bằng abc trên 4R. Công thức S bằng p nhân r với p là nửa chu vi giúp tính bán kính đường tròn nội tiếp r bằng S trên p. Công thức Heron tính diện tích khi biết 3 cạnh và công thức đường trung tuyến m a bình bằng b bình cộng c bình trên 2 trừ a bình trên 4."):
            self.play(Create(box_area), Write(txt_area))

        self.wait(2)
        self.clear()


class Scene6_BaiTapVanDung(VoiceoverScene):
    """Phần 6: Giải bài tập vận dụng trong file LaTeX với hình vẽ và giải thích chi tiết lý do trước khi chọn"""
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("BÀI TẬP VẬN DỤNG HỆ THỨC LƯỢNG CHI TIẾT", font_size=22, color=YELLOW).to_edge(UP)
        self.add(title)

        # CÂU 1 (Bài 1 LaTeX)
        q1 = Text("Câu 1 (Bài 1 LaTeX): Cho △ABC có BC = 12, AC = 15, Ĉ = 60°. Tính AB.", font_size=18).next_to(title, DOWN, buff=0.2)
        opts1 = VGroup(
            Text("A. AB = 6√7", font_size=16),
            Text("B. AB = 3√7", font_size=16, color=GREEN),
            Text("C. AB = 6√21", font_size=16),
            Text("D. AB = 3√21", font_size=16)
        ).arrange(RIGHT, buff=0.4).next_to(q1, DOWN, buff=0.2)

        # Render Triangle ABC with labels
        pA = [0.2, 1.2, 0]
        pB = [-1.8, -0.8, 0]
        pC = [1.8, -0.8, 0]
        tri1 = Polygon(pA, pB, pC, color=WHITE).scale(0.8).to_edge(LEFT, buff=0.5).shift(DOWN * 0.8)
        lbl_C = Text("C=60°", font_size=13, color=YELLOW).next_to(tri1.get_vertices()[2], RIGHT)
        lbl_a = Text("a=12", font_size=13, color=YELLOW).next_to(tri1, DOWN)
        lbl_b = Text("b=15", font_size=13, color=YELLOW).next_to(tri1, UP+RIGHT)

        sol1 = Text(
            "PHÂN TÍCH VÀ GIẢI THÍCH CHI TIẾT:\n"
            "1. Đặt a = BC = 12, b = AC = 15, c = AB.\n"
            "2. Áp dụng Định lý Cosin tại đỉnh C:\n"
            "   c² = a² + b² - 2ab cos C\n"
            "   c² = 12² + 15² - 2(12)(15) cos 60°\n"
            "   c² = 144 + 225 - 360 · (1/2) = 369 - 180 = 189.\n"
            "3. Rút căn: c = √189 = √(9 · 21) = 3√7.\n"
            "=> Kết luận: Độ dài AB = 3√7.",
            font_size=13, color=LIGHT_GRAY, line_spacing=1.2
        ).to_edge(RIGHT, buff=0.5).shift(DOWN * 0.6)

        b1 = SurroundingRectangle(opts1[1], color=GREEN, buff=0.1)

        with self.voiceover(text="Câu 1: Áp dụng định lý Cosin tính cạnh AB. Ta có AB bình bằng BC bình cộng AC bình trừ 2 BC nhân AC nhân cos C. Thay BC bằng 12, AC bằng 15 và cos 60 độ bằng 1 phần 2: AB bình bằng 144 cộng 225 trừ 180 bằng 189. Rút căn AB bằng căn 189 bằng 3 căn 7. Do đó ta chọn đáp án B."):
            self.play(Write(q1), FadeIn(opts1))
            self.play(Create(tri1), FadeIn(lbl_C, lbl_a, lbl_b))
            self.play(Write(sol1))
            # HIGHLIGHT ONLY AFTER REASONING IS EXPLAINED!
            self.play(Create(b1))

        self.wait(2)
        self.clear()


class FullLesson_HeThucLuong(Scene1_GiaTriLuongGiac, Scene2A_Special_Angles, Scene2B_Visual_Geometric_Relations, Scene3_PhuongTrinhLuongGiac, Scene4_DinhLySinCosin, Scene5_DienTichVaGiaiTamGiac, Scene6_BaiTapVanDung):
    def construct(self):
        Scene1_GiaTriLuongGiac.construct(self)
        Scene2A_Special_Angles.construct(self)
        Scene2B_Visual_Geometric_Relations.construct(self)
        Scene3_PhuongTrinhLuongGiac.construct(self)
        Scene4_DinhLySinCosin.construct(self)
        Scene5_DienTichVaGiaiTamGiac.construct(self)
        Scene6_BaiTapVanDung.construct(self)
