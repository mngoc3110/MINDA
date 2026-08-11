from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService

# ==============================================================================
# BẤT PHƯƠNG TRÌNH VÀ QUY HOẠCH TUYẾN TÍNH (tong-on10-11/BPT-QHTT.tex)
# ==============================================================================

class Scene1_BPT_Intro(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        header = Text("CHỦ ĐỀ: BẤT PHƯƠNG TRÌNH VÀ QUY HOẠCH TUYẾN TÍNH", font_size=24, color=YELLOW).to_edge(UP)
        gv_info = Text("GV: Nguyễn Lê Minh Ngọc | Toán 10 - 12", font_size=18, color=BLUE_B).next_to(header, DOWN, buff=0.2)

        with self.voiceover(text="Chào mừng các em đến với bài học Bất phương trình bậc nhất hai ẩn và Bài toán Quy hoạch tuyến tính."):
            self.play(Write(header))
            self.play(FadeIn(gv_info))

        # Render 2D Feasible Region Shading
        axes = Axes(x_range=[-1, 5, 1], y_range=[-1, 5, 1], x_length=4.5, y_length=3.2, axis_config={"include_tip": True}).shift(DOWN * 0.4)
        
        l1 = axes.plot(lambda x: 4 - x, x_range=[-0.5, 4.5], color=BLUE)
        l2 = axes.plot(lambda x: 2*x - 1, x_range=[0.3, 2.8], color=GREEN)
        
        lbl_region = Text("Miền nghiệm (Đa giác)", font_size=15, color=YELLOW_B).move_to(axes.c2p(1.5, 1.5))

        with self.voiceover(text="Miền nghiệm của hệ bất phương trình bậc nhất hai ẩn là một đa giác lồi. Giá trị lớn nhất hoặc nhỏ nhất của biểu thức F bằng a x cộng b y luôn đạt được tại các đỉnh của đa giác này."):
            self.play(Create(axes))
            self.play(Create(l1), Create(l2))
            self.play(Write(lbl_region))

        self.wait(1.5)
        self.clear()


class Scene2_BPT_Exercises(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("BÀI TẬP BẤT PHƯƠNG TRÌNH CHI TIẾT", font_size=26, color=YELLOW).to_edge(UP)
        self.add(title)

        # CÂU 1 BPT
        q1 = Text("Câu 1: Cặp số (x; y) nào dưới đây là một nghiệm của BPT x - 2y + 3 > 0?", font_size=18).next_to(title, DOWN, buff=0.3)
        opts1 = VGroup(
            Text("A. (1; 1)", font_size=16, color=GREEN),
            Text("B. (0; 3)", font_size=16),
            Text("C. (1; 3)", font_size=16),
            Text("D. (2; 4)", font_size=16)
        ).arrange(RIGHT, buff=0.5).next_to(q1, DOWN, buff=0.3)

        # STEP 1: EXPLAIN REASONING FIRST
        sol1 = Text(
            "GIẢI THÍCH LÝ DO VÌ SAO CHỌN:\n"
            "Thử cặp số (1; 1) vào vế trái f(x, y) = x - 2y + 3:\n"
            "   f(1, 1) = 1 - 2(1) + 3 = 1 - 2 + 3 = 2 > 0 (Thỏa mãn!)\n"
            "=> Vậy cặp số (1; 1) là một nghiệm của bất phương trình.",
            font_size=15, color=LIGHT_GRAY, line_spacing=1.2
        ).next_to(opts1, DOWN, buff=0.3)

        b1 = SurroundingRectangle(opts1[0], color=GREEN, buff=0.1)

        with self.voiceover(text="Câu 1: Thay trực tiếp cặp số x bằng 1 và y bằng 1 vào biểu thức x trừ 2y cộng 3: 1 trừ 2 cộng 3 bằng 2 lớn hơn 0, là một khẳng định đúng. Như vậy cặp số (1; 1) thỏa mãn bất phương trình. Chúng ta chọn đáp án A."):
            self.play(Write(q1), FadeIn(opts1))
            self.play(Write(sol1))
            # ONLY AFTER EXPLAINING REASONING DO WE HIGHLIGHT THE CORRECT OPTION!
            self.play(Create(b1))

        self.wait(2)
        self.clear()


class FullLesson_BPT_QHTT(Scene1_BPT_Intro, Scene2_BPT_Exercises):
    def construct(self):
        Scene1_BPT_Intro.construct(self)
        Scene2_BPT_Exercises.construct(self)
