from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService

# ==============================================================================
# HÌNH HỌC TỌA ĐỘ OXY & BA ĐƯỜNG CONIC (tong-on10-11/oxy.tex)
# ==============================================================================

class Scene1_Oxy_Intro(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        header = Text("CHỦ ĐỀ: PHƯƠNG PHÁP TỌA ĐỘ TRONG MẶT PHẲNG OXY", font_size=24, color=YELLOW).to_edge(UP)
        gv_info = Text("GV: Nguyễn Lê Minh Ngọc | Hình học 10 - 12", font_size=18, color=BLUE_B).next_to(header, DOWN, buff=0.2)

        with self.voiceover(text="Chào mừng các em đến với Bài học Phương pháp tọa độ trong mặt phẳng Oxy và ba đường Conic."):
            self.play(Write(header))
            self.play(FadeIn(gv_info))

        # Render 2D Oxy Coordinate Plane with Line & Normal Vector
        axes = Axes(x_range=[-2, 4, 1], y_range=[-2, 4, 1], x_length=5.0, y_length=3.5, axis_config={"include_tip": True}).shift(DOWN * 0.4)
        
        # Line ax + by + c = 0
        line_eq = axes.plot(lambda x: 0.8*x + 0.5, x_range=[-1.5, 3.5], color=BLUE)
        line_lbl = Text("Δ: ax + by + c = 0", font_size=16, color=BLUE).next_to(line_eq, UP)

        # Normal vector n = (a, b)
        vec_n = Arrow(axes.c2p(1, 1.3), axes.c2p(0.2, 2.3), buff=0, color=RED, max_tip_length_to_length_ratio=0.2)
        vec_lbl = Text("n⃗ = (a; b) ⊥ Δ", font_size=14, color=RED).next_to(vec_n, RIGHT)

        with self.voiceover(text="Đường thẳng Delta trong mặt phẳng Oxy có phương trình tổng quát a x cộng b y cộng c bằng 0, với véc tơ pháp tuyến n bằng a b vuông góc với đường thẳng."):
            self.play(Create(axes), Create(line_eq), Write(line_lbl))
            self.play(Create(vec_n), Write(vec_lbl))

        self.wait(1.5)
        self.clear()


class Scene2_Conic_Theory(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("Ba Đường Conic: Elip, Hypebol, Parabol", font_size=26, color=YELLOW).to_edge(UP)
        self.add(title)

        # Draw Ellipse
        ellipse = Ellipse(width=4.0, height=2.5, color=TEAL).shift(DOWN * 0.3)
        lbl_e = Text("Elip (E): x²/a² + y²/b² = 1", font_size=18, color=TEAL).next_to(ellipse, UP)

        f1 = Dot(ellipse.get_center() + LEFT*1.2, color=RED)
        f2 = Dot(ellipse.get_center() + RIGHT*1.2, color=RED)
        lbl_f1 = Text("F₁", font_size=14, color=RED).next_to(f1, DOWN)
        lbl_f2 = Text("F₂", font_size=14, color=RED).next_to(f2, DOWN)

        with self.voiceover(text="Phương trình chính tắc của Elip là x bình trên a bình cộng y bình trên b bình bằng 1, với 2 tiêu điểm F1 và F2 nằm trên trục hoành."):
            self.play(Create(ellipse), Write(lbl_e))
            self.play(FadeIn(f1, f2, lbl_f1, lbl_f2))

        self.wait(1.5)
        self.clear()


class Scene3_Oxy_Exercises(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("BÀI TẬP OXY CHI TIẾT", font_size=26, color=YELLOW).to_edge(UP)
        self.add(title)

        # CÂU 1 OXY
        q1 = Text("Câu 1: Đường thẳng Δ đi qua M(1; 2) và nhận n⃗ = (2; -3) làm VTPT có PT là:", font_size=18).next_to(title, DOWN, buff=0.3)
        opts1 = VGroup(
            Text("A. 2x - 3y + 4 = 0", font_size=16, color=GREEN),
            Text("B. 2x - 3y - 4 = 0", font_size=16),
            Text("C. 3x + 2y - 7 = 0", font_size=16),
            Text("D. 2x + 3y - 8 = 0", font_size=16)
        ).arrange(RIGHT, buff=0.4).next_to(q1, DOWN, buff=0.3)

        # STEP 1: REASONING EXPLANATION FIRST
        sol1 = Text(
            "GIẢI THÍCH LÝ DO VÌ SAO CHỌN:\n"
            "1. PT tổng quát đường thẳng qua M(x₀; y₀) có VTPT n⃗ = (a; b) là:\n"
            "   a(x - x₀) + b(y - y₀) = 0\n"
            "2. Thay a = 2, b = -3 và M(1; 2):\n"
            "   2(x - 1) - 3(y - 2) = 0 ⇔ 2x - 3y - 2 + 6 = 0 ⇔ 2x - 3y + 4 = 0.",
            font_size=15, color=LIGHT_GRAY, line_spacing=1.2
        ).next_to(opts1, DOWN, buff=0.3)

        b1 = SurroundingRectangle(opts1[0], color=GREEN, buff=0.1)

        with self.voiceover(text="Câu 1: Phương trình tổng quát của đường thẳng đi qua M x0 y0 và có véc tơ pháp tuyến n bằng a b là a nhân x trừ x0 cộng b nhân y trừ y0 bằng 0. Thay a bằng 2, b bằng trừ 3 và điểm M 1 2 ta được: 2 nhân x trừ 1 trừ 3 nhân y trừ 2 bằng 0, khai triển được 2x trừ 3y cộng 4 bằng 0. Vì vậy, ta chọn đáp án A."):
            self.play(Write(q1), FadeIn(opts1))
            self.play(Write(sol1))
            # ONLY AFTER EXPLAINING REASONING DO WE HIGHLIGHT THE CORRECT OPTION!
            self.play(Create(b1))

        self.wait(2)
        self.clear()


class FullLesson_Oxy(Scene1_Oxy_Intro, Scene2_Conic_Theory, Scene3_Oxy_Exercises):
    def construct(self):
        Scene1_Oxy_Intro.construct(self)
        Scene2_Conic_Theory.construct(self)
        Scene3_Oxy_Exercises.construct(self)
