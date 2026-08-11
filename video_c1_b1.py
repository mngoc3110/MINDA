from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService

# ==============================================================================
# CHƯƠNG 1 BÀI 1: TÍNH ĐƠN ĐIỆU VÀ CỰC TRỊ CỦA HÀM SỐ
# ==============================================================================

class Scene1_Intro_And_Theory(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        # Welcome Header
        header = Text("CHƯƠNG 1 - BÀI 1: TÍNH ĐƠN ĐIỆU VÀ CỰC TRỊ CỦA HÀM SỐ", font_size=26, color=YELLOW).to_edge(UP)
        gv_text = Text("GV: Nguyễn Lê Minh Ngọc | Lớp 12", font_size=20, color=BLUE_B).next_to(header, DOWN, buff=0.2)

        with self.voiceover(text="Chào mừng các em học sinh đến với Bài 1: Tính đơn điệu và cực trị của hàm số trong chương trình Đại số và Giải tích 12."):
            self.play(Write(header))
            self.play(FadeIn(gv_text))

        # Theory Section: Monotonicity
        t1_title = Text("1. Tính đơn điệu (Đồng biến / Nghịch biến)", font_size=22, color=TEAL).next_to(gv_text, DOWN, buff=0.4)
        
        # 2 Sub-axes for Increasing and Decreasing curves
        axes1 = Axes(x_range=[0, 4, 1], y_range=[0, 3, 1], x_length=3.5, y_length=2.2, axis_config={"include_tip": True}).to_edge(LEFT, buff=0.8).shift(DOWN * 0.8)
        lbl1 = Text("Hàm số đồng biến (Đồ thị đi lên)", font_size=15, color=GREEN).next_to(axes1, UP)
        curve1 = axes1.plot(lambda x: 0.2*x**2 + 0.5, x_range=[0.5, 3.2], color=GREEN)

        axes2 = Axes(x_range=[0, 4, 1], y_range=[0, 3, 1], x_length=3.5, y_length=2.2, axis_config={"include_tip": True}).to_edge(RIGHT, buff=0.8).shift(DOWN * 0.8)
        lbl2 = Text("Hàm số nghịch biến (Đồ thị đi xuống)", font_size=15, color=RED_B).next_to(axes2, UP)
        curve2 = axes2.plot(lambda x: -0.2*(x-3.5)**2 + 2.5, x_range=[0.5, 3.2], color=RED_B)

        with self.voiceover(text="Hàm số f(x) đồng biến khi x tăng thì f(x) tăng, đồ thị đi lên từ trái sang phải. Ngược lại, hàm số nghịch biến khi đồ thị đi xuống từ trái sang phải. Mối quan hệ với đạo hàm: f' dương thì đồng biến, f' âm thì nghịch biến."):
            self.play(Write(t1_title))
            self.play(Create(axes1), Create(axes2), Write(lbl1), Write(lbl2))
            self.play(Create(curve1), Create(curve2))

        self.wait(1.5)
        self.clear()


class Scene2_Extrema_Theory(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("2. Cực trị của hàm số (Cực đại & Cực tiểu)", font_size=26, color=YELLOW).to_edge(UP)
        self.add(title)

        # Graph with Local Maximum & Minimum
        axes = Axes(x_range=[-3, 4, 1], y_range=[-2, 3, 1], x_length=7.0, y_length=3.8, axis_config={"include_tip": True}).shift(DOWN * 0.4)
        curve = axes.plot(lambda x: 0.3*x**3 - 0.5*x**2 - 1.5*x + 1.0, x_range=[-2.2, 3.2], color=BLUE)

        dot_max = Dot(axes.c2p(-1.0, 1.9), color=RED)
        lbl_max = Text("Cực đại (f'(x) đổi từ + sang -)", font_size=14, color=RED).next_to(dot_max, UP)

        dot_min = Dot(axes.c2p(1.7, -1.1), color=GREEN)
        lbl_min = Text("Cực tiểu (f'(x) đổi từ - sang +)", font_size=14, color=GREEN).next_to(dot_min, DOWN)

        with self.voiceover(text="Điểm cực đại là điểm mà tại đó đạo hàm f'(x) đổi dấu từ dương sang âm khi qua x0. Điểm cực tiểu là điểm mà tại đó f'(x) đổi dấu từ âm sang dương khi qua x0."):
            self.play(Create(axes), Create(curve))
            self.play(FadeIn(dot_max, lbl_max, dot_min, lbl_min))

        self.wait(2)
        self.clear()


class Scene3_Exercises(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("BÀI TẬP VẬN DỤNG CHI TIẾT", font_size=28, color=YELLOW).to_edge(UP)
        self.add(title)

        # CÂU 1
        q1 = Text("Câu 1: Cho hàm số y = f(x) có f'(x) = x² + 1 với mọi x ∈ ℝ. Mệnh đề nào đúng?", font_size=18).next_to(title, DOWN, buff=0.3)
        opts1 = VGroup(
            Text("A. Hàm số nghịch biến trên ℝ", font_size=16),
            Text("B. Hàm số đồng biến trên ℝ", font_size=16, color=GREEN),
            Text("C. Hàm số đạt cực đại tại x = 0", font_size=16),
            Text("D. Hàm số đạt cực tiểu tại x = 0", font_size=16)
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT).next_to(q1, DOWN, buff=0.3)

        # STEP 1: EXPLAIN REASONING FIRST!
        sol_text1 = Text(
            "GIẢI THÍCH LÝ DO:\n"
            "Ta có: f'(x) = x² + 1 ≥ 1 > 0 với mọi x ∈ ℝ.\n"
            "Vì đạo hàm f'(x) luôn dương trên ℝ nên hàm số đồng biến trên ℝ.",
            font_size=16, color=LIGHT_GRAY, line_spacing=1.3
        ).next_to(opts1, DOWN, buff=0.3)

        b1 = SurroundingRectangle(opts1[1], color=GREEN, buff=0.1)

        with self.voiceover(text="Câu 1: Ta tiến hành phân tích lời giải trước. Đạo hàm f'(x) bằng x bình cộng 1 luôn lớn hơn hoặc bằng 1, tức là f'(x) luôn dương với mọi x thuộc R. Do f'(x) luôn dương nên hàm số đồng biến trên R. Vì vậy, ta chọn đáp án B."):
            self.play(Write(q1), FadeIn(opts1))
            self.play(Write(sol_text1))
            # ONLY AFTER EXPLAINING REASONING DO WE HIGHLIGHT THE CORRECT OPTION!
            self.play(Create(b1))

        self.wait(2)
        self.play(FadeOut(q1), FadeOut(opts1), FadeOut(sol_text1), FadeOut(b1))

        # CÂU 2
        q2 = Text("Câu 2: Hàm số y = -x³ + 3x² - 1 đồng biến trên khoảng nào?", font_size=18).next_to(title, DOWN, buff=0.3)
        opts2 = VGroup(
            Text("A. (-∞; 0)", font_size=16),
            Text("B. (0; 2)", font_size=16, color=GREEN),
            Text("C. (2; +∞)", font_size=16),
            Text("D. (-∞; 2)", font_size=16)
        ).arrange(RIGHT, buff=0.5).next_to(q2, DOWN, buff=0.3)

        sol_text2 = Text(
            "GIẢI THÍCH LÝ DO:\n"
            "1. Đạo hàm: y' = -3x² + 6x = -3x(x - 2).\n"
            "2. Cho y' = 0 ⇔ x = 0 hoặc x = 2.\n"
            "3. Bảng xét dấu y': y' > 0 (dương) trong khoảng 2 nghiệm (0; 2).\n"
            "=> Hàm số đồng biến trên khoảng (0; 2).",
            font_size=16, color=LIGHT_GRAY, line_spacing=1.2
        ).next_to(opts2, DOWN, buff=0.3)

        b2 = SurroundingRectangle(opts2[1], color=GREEN, buff=0.1)

        with self.voiceover(text="Câu 2: Bước 1, tính đạo hàm y' bằng trừ 3x bình cộng 6x. Cho y' bằng 0 ta được 2 nghiệm x bằng 0 và x bằng 2. Hệ số a bằng trừ 3 âm, quy tắc trong trái ngoài cùng cho thấy y' mang dấu dương trên khoảng 0 đến 2. Do đó hàm số đồng biến trên khoảng (0; 2). Chúng ta chọn đáp án B."):
            self.play(Write(q2), FadeIn(opts2))
            self.play(Write(sol_text2))
            # HIGHLIGHT CORRECT OPTION ONLY AFTER EXPLANATION
            self.play(Create(b2))

        self.wait(2)
        self.clear()


class FullLesson_C1_B1(Scene1_Intro_And_Theory, Scene2_Extrema_Theory, Scene3_Exercises):
    def construct(self):
        Scene1_Intro_And_Theory.construct(self)
        Scene2_Extrema_Theory.construct(self)
        Scene3_Exercises.construct(self)
