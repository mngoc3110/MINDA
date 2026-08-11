from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService

# ==============================================================================
# HÀM SỐ MŨ VÀ HÀM SỐ LOGARIT (tong-on10-11/log.tex)
# ==============================================================================

class Scene1_Log_Intro(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        header = Text("CHỦ ĐỀ: HÀM SỐ MŨ VÀ LOGARIT", font_size=26, color=YELLOW).to_edge(UP)
        gv_info = Text("GV: Nguyễn Lê Minh Ngọc | Đại số 11 - 12", font_size=18, color=BLUE_B).next_to(header, DOWN, buff=0.2)

        with self.voiceover(text="Chào mừng các em đến với bài học Hàm số Mũ và Hàm số Logarit."):
            self.play(Write(header))
            self.play(FadeIn(gv_info))

        # Render 2D Curves of y = 2^x and y = log2(x)
        axes = Axes(x_range=[-3, 4, 1], y_range=[-2, 4, 1], x_length=5.0, y_length=3.5, axis_config={"include_tip": True}).shift(DOWN * 0.4)
        
        curve_exp = axes.plot(lambda x: 2**x, x_range=[-2.5, 1.8], color=GREEN)
        lbl_exp = Text("y = 2^x (Hàm số Mũ)", font_size=15, color=GREEN).next_to(curve_exp, UP)

        curve_log = axes.plot(lambda x: np.log2(x), x_range=[0.25, 3.8], color=ORANGE)
        lbl_log = Text("y = log₂(x) (Hàm Logarit)", font_size=15, color=ORANGE).next_to(curve_log, DOWN)

        with self.voiceover(text="Hàm số mũ y bằng 2 mũ x và hàm số logarit y bằng logarit cơ số 2 của x là hai hàm số ngược nhau, có đồ thị đối xứng qua đường thẳng y bằng x."):
            self.play(Create(axes))
            self.play(Create(curve_exp), Write(lbl_exp))
            self.play(Create(curve_log), Write(lbl_log))

        self.wait(1.5)
        self.clear()


class Scene2_Log_Exercises(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("BÀI TẬP MŨ & LOGARIT CHI TIẾT", font_size=26, color=YELLOW).to_edge(UP)
        self.add(title)

        # CÂU 1 LOG
        q1 = Text("Câu 1: Tập xác định của hàm số y = log₃(x - 2) là:", font_size=18).next_to(title, DOWN, buff=0.3)
        opts1 = VGroup(
            Text("A. (2; +∞)", font_size=16, color=GREEN),
            Text("B. [2; +∞)", font_size=16),
            Text("C. (-∞; 2)", font_size=16),
            Text("D. ℝ \\ {2}", font_size=16)
        ).arrange(RIGHT, buff=0.5).next_to(q1, DOWN, buff=0.3)

        # STEP 1: EXPLAIN REASONING FIRST
        sol1 = Text(
            "GIẢI THÍCH LÝ DO VÌ SAO CHỌN:\n"
            "Điều kiện xác định của hàm số logarit y = log_a(u(x)) là u(x) > 0.\n"
            "Áp dụng: x - 2 > 0 ⇔ x > 2.\n"
            "=> Tập xác định D = (2; +∞).",
            font_size=15, color=LIGHT_GRAY, line_spacing=1.2
        ).next_to(opts1, DOWN, buff=0.3)

        b1 = SurroundingRectangle(opts1[0], color=GREEN, buff=0.1)

        with self.voiceover(text="Câu 1: Điều kiện xác định của hàm số logarit logarit cơ số a của u x là biểu thức dưới dấu logarit u x phải dương strictly lớn hơn 0. Áp dụng điều kiện: x trừ 2 lớn hơn 0, tương đương x lớn hơn 2. Do đó tập xác định là khoảng 2 đến cộng vô cực. Chúng ta chọn đáp án A."):
            self.play(Write(q1), FadeIn(opts1))
            self.play(Write(sol1))
            # ONLY AFTER EXPLAINING REASONING DO WE HIGHLIGHT THE CORRECT OPTION!
            self.play(Create(b1))

        self.wait(2)
        self.clear()


class FullLesson_Log(Scene1_Log_Intro, Scene2_Log_Exercises):
    def construct(self):
        Scene1_Log_Intro.construct(self)
        Scene2_Log_Exercises.construct(self)
