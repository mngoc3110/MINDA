from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService

# ==============================================================================
# CẤP SỐ CỘNG VÀ CẤP SỐ NHÂN (tong-on10-11/csc.tex)
# ==============================================================================

class Scene1_CSC_Intro(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        header = Text("CHỦ ĐỀ: CẤP SỐ CỘNG VÀ CẤP SỐ NHÂN", font_size=26, color=YELLOW).to_edge(UP)
        gv_info = Text("GV: Nguyễn Lê Minh Ngọc | Đại số 11", font_size=18, color=BLUE_B).next_to(header, DOWN, buff=0.2)

        with self.voiceover(text="Chào mừng các em đến với bài học Cấp số cộng và Cấp số nhân."):
            self.play(Write(header))
            self.play(FadeIn(gv_info))

        # Formula Summary Box
        box_csc = RoundedRectangle(corner_radius=0.15, height=1.6, width=5.5, color=GREEN).to_edge(LEFT, buff=0.8).shift(DOWN * 0.3)
        lbl_csc = Text("1. Cấp số cộng (Công sai d)", font_size=16, color=GREEN).next_to(box_csc, UP)
        f_csc1 = Text("uₙ = u₁ + (n - 1)d", font_size=16, color=WHITE).move_to(box_csc.get_center() + UP*0.3)
        f_csc2 = Text("Sₙ = n(u₁ + uₙ)/2", font_size=16, color=YELLOW_B).move_to(box_csc.get_center() + DOWN*0.3)
        group_csc = VGroup(box_csc, lbl_csc, f_csc1, f_csc2)

        box_csn = RoundedRectangle(corner_radius=0.15, height=1.6, width=5.5, color=ORANGE).to_edge(RIGHT, buff=0.8).shift(DOWN * 0.3)
        lbl_csn = Text("2. Cấp số nhân (Công bội q)", font_size=16, color=ORANGE).next_to(box_csn, UP)
        f_csn1 = Text("uₙ = u₁ · qⁿ⁻¹", font_size=16, color=WHITE).move_to(box_csn.get_center() + UP*0.3)
        f_csn2 = Text("Sₙ = u₁(1 - qⁿ)/(1 - q)", font_size=16, color=YELLOW_B).move_to(box_csn.get_center() + DOWN*0.3)
        group_csn = VGroup(box_csn, lbl_csn, f_csn1, f_csn2)

        with self.voiceover(text="Cấp số cộng có số hạng tổng quát u n bằng u 1 cộng n trừ 1 nhân d. Cấp số nhân có số hạng tổng quát u n bằng u 1 nhân q mũ n trừ 1."):
            self.play(Create(group_csc), Create(group_csn))

        self.wait(1.5)
        self.clear()


class Scene2_CSC_Exercises(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("BÀI TẬP CẤP SỐ CỘNG CHI TIẾT", font_size=26, color=YELLOW).to_edge(UP)
        self.add(title)

        # CÂU 1 CSC
        q1 = Text("Câu 1: Cho cấp số cộng (uₙ) có u₁ = 3 và công sai d = 2. Tìm u₅.", font_size=18).next_to(title, DOWN, buff=0.3)
        opts1 = VGroup(
            Text("A. u₅ = 11", font_size=16, color=GREEN),
            Text("B. u₅ = 10", font_size=16),
            Text("C. u₅ = 13", font_size=16),
            Text("D. u₅ = 9", font_size=16)
        ).arrange(RIGHT, buff=0.5).next_to(q1, DOWN, buff=0.3)

        # STEP 1: EXPLAIN REASONING FIRST
        sol1 = Text(
            "GIẢI THÍCH LÝ DO VÌ SAO CHỌN:\n"
            "Công thức số hạng tổng quát của cấp số cộng: uₙ = u₁ + (n - 1)d.\n"
            "Thay n = 5, u₁ = 3, d = 2:\n"
            "   u₅ = 3 + (5 - 1)·2 = 3 + 4·2 = 3 + 8 = 11.\n"
            "=> Do đó u₅ = 11.",
            font_size=15, color=LIGHT_GRAY, line_spacing=1.2
        ).next_to(opts1, DOWN, buff=0.3)

        b1 = SurroundingRectangle(opts1[0], color=GREEN, buff=0.1)

        with self.voiceover(text="Câu 1: Công thức số hạng tổng quát của cấp số cộng là u n bằng u 1 cộng n trừ 1 nhân d. Thay n bằng 5, u 1 bằng 3 và công sai d bằng 2: u 5 bằng 3 cộng 4 nhân 2 bằng 3 cộng 8 bằng 11. Do đó u 5 bằng 11. Chúng ta chọn đáp án A."):
            self.play(Write(q1), FadeIn(opts1))
            self.play(Write(sol1))
            # ONLY AFTER EXPLAINING REASONING DO WE HIGHLIGHT THE CORRECT OPTION!
            self.play(Create(b1))

        self.wait(2)
        self.clear()


class FullLesson_CSC(Scene1_CSC_Intro, Scene2_CSC_Exercises):
    def construct(self):
        Scene1_CSC_Intro.construct(self)
        Scene2_CSC_Exercises.construct(self)
