from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService

# ==============================================================================
# HÌNH HỌC KHÔNG GIAN (tong-on10-11/hhkg.tex)
# ==============================================================================

class Scene1_HHKG_Intro(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        header = Text("CHỦ ĐỀ: HÌNH HỌC KHÔNG GIAN (GÓC & KHOẢNG CÁCH)", font_size=24, color=YELLOW).to_edge(UP)
        gv_info = Text("GV: Nguyễn Lê Minh Ngọc | Hình học 11 - 12", font_size=18, color=BLUE_B).next_to(header, DOWN, buff=0.2)

        with self.voiceover(text="Chào mừng các em đến với bài học Hình học không gian, góc và khoảng cách trong không gian."):
            self.play(Write(header))
            self.play(FadeIn(gv_info))

        # Render 3D Pyramid Geometry Representation
        # Base polygon A, B, C, D and Apex S
        p_A = [-1.5, -1.0, 0]
        p_B = [0.8, -1.0, 0]
        p_C = [1.8, -0.2, 0]
        p_D = [-0.5, -0.2, 0]
        p_S = [0.0, 1.8, 0]

        # Lines
        line_AB = Line(p_A, p_B, color=WHITE)
        line_BC = Line(p_B, p_C, color=WHITE)
        line_CD = DashedLine(p_C, p_D, color=GRAY)
        line_DA = DashedLine(p_D, p_A, color=GRAY)
        
        line_SA = Line(p_S, p_A, color=BLUE)
        line_SB = Line(p_S, p_B, color=BLUE)
        line_SC = Line(p_S, p_C, color=BLUE)
        line_SD = DashedLine(p_S, p_D, color=GRAY)

        pyramid = VGroup(line_AB, line_BC, line_CD, line_DA, line_SA, line_SB, line_SC, line_SD).shift(DOWN * 0.3)
        
        lbl_S = Text("S", font_size=16, color=YELLOW).next_to(line_SA.get_start(), UP)
        lbl_A = Text("A", font_size=14).next_to(line_AB.get_start(), LEFT)
        lbl_B = Text("B", font_size=14).next_to(line_AB.get_end(), DOWN)
        lbl_C = Text("C", font_size=14).next_to(line_BC.get_end(), RIGHT)

        with self.voiceover(text="Trong hình học không gian, ta quan sát các hình chóp, hình hộp và quan hệ vuông góc giữa đường thẳng với mặt phẳng."):
            self.play(Create(pyramid))
            self.play(FadeIn(lbl_S, lbl_A, lbl_B, lbl_C))

        self.wait(1.5)
        self.clear()


class Scene2_HHKG_Exercises(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("BÀI TẬP HÌNH HỌC KHÔNG GIAN CHI TIẾT", font_size=26, color=YELLOW).to_edge(UP)
        self.add(title)

        # CÂU 1 HHKG
        q1 = Text("Câu 1: Cho hình chóp S.ABCD có SA ⊥ (ABCD). Khi đó SA vuông góc với đường nào?", font_size=18).next_to(title, DOWN, buff=0.3)
        opts1 = VGroup(
            Text("A. Chỉ đường AB", font_size=16),
            Text("B. Mọi đường nằm trong (ABCD)", font_size=16, color=GREEN),
            Text("C. Chỉ các đường qua A", font_size=16),
            Text("D. Chỉ 2 đường chéo AC, BD", font_size=16)
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT).next_to(q1, DOWN, buff=0.3)

        # STEP 1: EXPLAIN REASONING FIRST
        sol1 = Text(
            "GIẢI THÍCH LÝ DO VÌ SAO CHỌN:\n"
            "Định lý quan hệ vuông góc giữa đường thẳng và mặt phẳng:\n"
            "Nếu đường thẳng d ⊥ (P) thì d vuông góc với MỌI đường thẳng a nằm trong mặt phẳng (P).\n"
            "Vì SA ⊥ (ABCD) nên SA vuông góc với mọi đường thẳng nằm trong (ABCD).",
            font_size=15, color=LIGHT_GRAY, line_spacing=1.2
        ).next_to(opts1, DOWN, buff=0.3)

        b1 = SurroundingRectangle(opts1[1], color=GREEN, buff=0.1)

        with self.voiceover(text="Câu 1: Theo định lý vuông góc trong không gian, nếu một đường thẳng vuông góc với một mặt phẳng thì nó sẽ vuông góc với mọi đường thẳng nằm trong mặt phẳng đó. Do SA vuông góc với mặt phẳng ABCD nên SA vuông góc với mọi đường nằm trong ABCD. Vì vậy ta chọn đáp án B."):
            self.play(Write(q1), FadeIn(opts1))
            self.play(Write(sol1))
            # ONLY AFTER EXPLAINING REASONING DO WE HIGHLIGHT THE CORRECT OPTION!
            self.play(Create(b1))

        self.wait(2)
        self.clear()


class FullLesson_HHKG(Scene1_HHKG_Intro, Scene2_HHKG_Exercises):
    def construct(self):
        Scene1_HHKG_Intro.construct(self)
        Scene2_HHKG_Exercises.construct(self)
