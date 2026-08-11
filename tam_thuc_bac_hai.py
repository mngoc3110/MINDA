from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService

# ==============================================================================
# PHẦN I: KHÁI NIỆM & ĐỒ THỊ HÀM SỐ BẬC HAI
# ==============================================================================
class Scene1_LyThuyetCoBan(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        header = Text("CHỦ ĐỀ 4: TAM THỨC BẬC HAI", font_size=34, color=YELLOW).to_edge(UP)
        subheader = Text("1. Khái niệm & Đồ thị hàm số bậc hai", font_size=24, color=BLUE_B).next_to(header, DOWN, buff=0.3)

        with self.voiceover(text="Chào mừng các em đến với bài học Chủ đề 4: Tam thức bậc hai và Hàm số bậc hai."):
            self.play(Write(header))
            self.play(FadeIn(subheader))

        formula = Text("y = ax² + bx + c  (a ≠ 0)", font_size=34, color=RED_B).next_to(subheader, DOWN, buff=0.4)
        txd = Text("Tập xác định: D = ℝ", font_size=24, color=GREEN).next_to(formula, DOWN, buff=0.2)

        with self.voiceover(text="Hàm số bậc hai có dạng y bằng a x bình cộng b x cộng c với a khác 0. Tập xác định D bằng R."):
            self.play(Write(formula), FadeIn(txd))

        # Đồ thị Parabol & Đỉnh I
        axes1 = Axes(x_range=[-2.5, 1.5, 1], y_range=[-1.5, 2.5, 1], x_length=3.8, y_length=2.8, axis_config={"include_tip": True}).to_edge(LEFT, buff=0.8).shift(DOWN * 0.8)
        lab1 = Text("a > 0 (Quay lên)", font_size=16, color=GREEN).next_to(axes1, UP)
        parabola1 = axes1.plot(lambda x: (x + 1)**2 - 0.8, x_range=[-2.3, 0.3], color=BLUE)
        dot1 = Dot(axes1.c2p(-1, -0.8), color=RED)
        lbl_I1 = Text("I", font_size=18, color=RED).next_to(dot1, DOWN + LEFT, buff=0.1)

        axes2 = Axes(x_range=[-1.5, 2.5, 1], y_range=[-2.5, 1.5, 1], x_length=3.8, y_length=2.8, axis_config={"include_tip": True}).to_edge(RIGHT, buff=0.8).shift(DOWN * 0.8)
        lab2 = Text("a < 0 (Quay xuống)", font_size=16, color=RED_B).next_to(axes2, UP)
        parabola2 = axes2.plot(lambda x: -((x - 1)**2) + 0.8, x_range=[-0.3, 2.3], color=ORANGE)
        dot2 = Dot(axes2.c2p(1, 0.8), color=RED)
        lbl_I2 = Text("I", font_size=18, color=RED).next_to(dot2, UP + RIGHT, buff=0.1)

        with self.voiceover(text="Đồ thị hàm số là một đường Parabol có đỉnh I và trục đối xứng x bằng trừ b trên 2a. Nếu a lớn hơn 0 bề lõm quay lên, a nhỏ hơn 0 bề lõm quay xuống."):
            self.play(Create(axes1), Create(axes2), Write(lab1), Write(lab2))
            self.play(Create(parabola1), Create(parabola2), FadeIn(dot1, lbl_I1, dot2, lbl_I2))

        self.wait(1)
        self.clear()


# ==============================================================================
# PHẦN II: BẢNG BIẾN THIÊN & QUY TẮC XÉT DẤU CHI TIẾT
# ==============================================================================
class Scene2_BangBienThienVaXetDau(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("2. Bảng biến thiên & Quy tắc xét dấu", font_size=28, color=YELLOW).to_edge(UP)
        self.add(title)

        # A. BẢNG BIẾN THIÊN CHI TIẾT
        bbt_title = Text("A. BẢNG BIẾN THIÊN HÀM SỐ BẬC HAI", font_size=20, color=BLUE_B).next_to(title, DOWN, buff=0.3)
        self.play(Write(bbt_title))

        # Bảng biến thiên a > 0
        bbt_pos_box = RoundedRectangle(corner_radius=0.1, height=1.6, width=5.5, color=GREEN).to_edge(LEFT, buff=0.8).shift(UP * 0.3)
        lbl_pos = Text("Khi a > 0", font_size=16, color=GREEN).next_to(bbt_pos_box, UP, buff=0.1)
        t_pos_x = Text("x    | -∞        -b/2a        +∞", font_size=14).move_to(bbt_pos_box.get_top() + DOWN * 0.3)
        line_pos = Line(bbt_pos_box.get_left() + RIGHT*0.2, bbt_pos_box.get_right() + LEFT*0.2).next_to(t_pos_x, DOWN, buff=0.1)
        t_pos_y = Text("f(x) | +∞  ↘  -Δ/4a  ↗  +∞", font_size=14, color=YELLOW_B).next_to(line_pos, DOWN, buff=0.2)
        group_pos = VGroup(bbt_pos_box, lbl_pos, t_pos_x, line_pos, t_pos_y)

        # Bảng biến thiên a < 0
        bbt_neg_box = RoundedRectangle(corner_radius=0.1, height=1.6, width=5.5, color=RED_B).to_edge(RIGHT, buff=0.8).shift(UP * 0.3)
        lbl_neg = Text("Khi a < 0", font_size=16, color=RED_B).next_to(bbt_neg_box, UP, buff=0.1)
        t_neg_x = Text("x    | -∞        -b/2a        +∞", font_size=14).move_to(bbt_neg_box.get_top() + DOWN * 0.3)
        line_neg = Line(bbt_neg_box.get_left() + RIGHT*0.2, bbt_neg_box.get_right() + LEFT*0.2).next_to(t_neg_x, DOWN, buff=0.1)
        t_neg_y = Text("f(x) | -∞  ↗   -Δ/4a  ↘  -∞", font_size=14, color=YELLOW_B).next_to(line_neg, DOWN, buff=0.2)
        group_neg = VGroup(bbt_neg_box, lbl_neg, t_neg_x, line_neg, t_neg_y)

        with self.voiceover(text="Đây là Bảng biến thiên chi tiết. Khi a lớn hơn 0, f x đi xuống rồi đi lên. Khi a nhỏ hơn 0, f x đi lên rồi đi xuống."):
            self.play(Create(group_pos), Create(group_neg))

        self.wait(1.5)
        self.play(FadeOut(bbt_title), FadeOut(group_pos), FadeOut(group_neg))

        # B. ĐỊNH LÝ XÉT DẤU CHI TIẾT (3 TRƯỜNG HỢP Δ)
        sign_title = Text("B. BẢNG XÉT DẤU TAM THỨC BẬC HAI (f(x) = ax² + bx + c)", font_size=20, color=YELLOW).next_to(title, DOWN, buff=0.3)
        self.play(Write(sign_title))

        # Khung bảng xét dấu chi tiết cho Δ > 0 (Trong trái ngoài cùng)
        table_box = RoundedRectangle(corner_radius=0.15, height=2.2, width=10.5, color=TEAL).next_to(sign_title, DOWN, buff=0.4)
        
        row1 = Text("x     |  -∞               x₁               x₂               +∞", font_size=16, color=WHITE).move_to(table_box.get_top() + DOWN * 0.4)
        div_line = Line(table_box.get_left() + RIGHT*0.3, table_box.get_right() + LEFT*0.3, color=LIGHT_GRAY).next_to(row1, DOWN, buff=0.15)
        row2 = Text("f(x)  |      CÙNG DẤU a   0   TRÁI DẤU a   0   CÙNG DẤU a", font_size=15, color=YELLOW_B).next_to(div_line, DOWN, buff=0.2)
        
        rule_text = Text("Quy tắc: 'TRONG TRÁI, NGOÀI CÙNG'\n(Trong khoảng 2 nghiệm: Trái dấu a | Ngoài khoảng: Cùng dấu a)", font_size=16, color=GREEN).next_to(row2, DOWN, buff=0.3)

        with self.voiceover(text="Đối với quy tắc xét dấu tam thức bậc hai khi Delta lớn hơn 0: Trong khoảng hai nghiệm x1 x2 thì f x trái dấu với a; ngoài khoảng hai nghiệm thì f x cùng dấu với a, gọi tắt là trong trái ngoài cùng."):
            self.play(Create(table_box), Write(row1), Create(div_line), Write(row2))
            self.play(Write(rule_text))

        self.wait(2)
        self.clear()


# ==============================================================================
# PHẦN III: BÀI TẬP TỰ LUYỆN (CÂU 1 ĐẾN CÂU 5)
# ==============================================================================
class Scene3_BaiTapTuLuyen_Part1(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("BÀI TẬP TỰ LUYỆN (CÂU 1 - CÂU 5)", font_size=28, color=YELLOW).to_edge(UP)
        self.add(title)

        # CÂU 1
        q1 = Text("Câu 1: Biểu thức nào dưới đây là tam thức bậc hai?", font_size=22).next_to(title, DOWN, buff=0.4)
        o1 = VGroup(Text("A. y = 1", font_size=18), Text("B. y = x", font_size=18), Text("C. y = x²", font_size=18, color=GREEN), Text("D. y = x³", font_size=18)).arrange(RIGHT, buff=0.6).next_to(q1, DOWN, buff=0.3)
        b1 = SurroundingRectangle(o1[2], color=GREEN)
        with self.voiceover(text="Câu 1: Tam thức bậc hai là biểu thức dạng y bằng a x bình cộng b x cộng c với a khác 0. Chọn C."):
            self.play(Write(q1), FadeIn(o1))
            self.play(Create(b1))
        self.wait(1)
        self.play(FadeOut(q1), FadeOut(o1), FadeOut(b1))

        # CÂU 2
        q2 = Text("Câu 2: Với m là tham số bất kì, biểu thức nào là tam thức bậc hai?", font_size=22).next_to(title, DOWN, buff=0.4)
        o2 = VGroup(Text("A. y = m", font_size=18), Text("B. y = mx", font_size=18), Text("C. y = mx²", font_size=18), Text("D. y = x² + m", font_size=18, color=GREEN)).arrange(RIGHT, buff=0.5).next_to(q2, DOWN, buff=0.3)
        b2 = SurroundingRectangle(o2[3], color=GREEN)
        with self.voiceover(text="Câu 2: Biểu thức y bằng x bình cộng m luôn có a bằng 1 khác 0 với mọi m. Chọn D."):
            self.play(Write(q2), FadeIn(o2))
            self.play(Create(b2))
        self.wait(1)
        self.play(FadeOut(q2), FadeOut(o2), FadeOut(b2))

        # CÂU 3
        q3 = Text("Câu 3: Với m bất kì, biểu thức nào luôn là tam thức bậc hai?", font_size=22).next_to(title, DOWN, buff=0.4)
        o3 = VGroup(Text("A. y = m", font_size=18), Text("B. y = mx", font_size=18), Text("C. y = (m²+1)x²", font_size=18, color=GREEN), Text("D. y = mx²+m", font_size=18)).arrange(RIGHT, buff=0.4).next_to(q3, DOWN, buff=0.3)
        b3 = SurroundingRectangle(o3[2], color=GREEN)
        with self.voiceover(text="Câu 3: Vì m bình cộng 1 luôn lớn hơn hoặc bằng 1 nên hệ số a luôn khác 0. Chọn C."):
            self.play(Write(q3), FadeIn(o3))
            self.play(Create(b3))
        self.wait(1)
        self.play(FadeOut(q3), FadeOut(o3), FadeOut(b3))

        # CÂU 4
        q4 = Text("Câu 4: Tìm m để f(x) = (m - 2)x² + 5x + 9 là tam thức bậc hai.", font_size=22).next_to(title, DOWN, buff=0.4)
        o4 = VGroup(Text("A. m ∈ ℝ", font_size=18), Text("B. m = 2", font_size=18), Text("C. m ≠ 2", font_size=18, color=GREEN), Text("D. m ≠ 0", font_size=18)).arrange(RIGHT, buff=0.6).next_to(q4, DOWN, buff=0.3)
        b4 = SurroundingRectangle(o4[2], color=GREEN)
        with self.voiceover(text="Câu 4: Điều kiện để f x là tam thức bậc hai là hệ số a bằng m trừ 2 khác 0, tức m khác 2. Chọn C."):
            self.play(Write(q4), FadeIn(o4))
            self.play(Create(b4))
        self.wait(1)
        self.play(FadeOut(q4), FadeOut(o4), FadeOut(b4))

        # CÂU 5 (CÓ ĐỒ THỊ VẼ TRỰC QUAN 2D)
        q5 = Text("Câu 5: Cho hàm số f(x) có đồ thị Parabol như hình vẽ dưới đây:", font_size=20).next_to(title, DOWN, buff=0.3)
        
        # Trục tọa độ và Đồ thị Parabol y = 4*(x-1.5)^2 - 1
        axes5 = Axes(x_range=[-0.5, 3.2, 1], y_range=[-1.8, 2.0, 1], x_length=4.2, y_length=2.6, axis_config={"include_tip": True}).to_edge(LEFT, buff=0.6).shift(DOWN * 0.4)
        parabola5 = axes5.plot(lambda x: 4 * ((x - 1.5)**2) - 1, x_range=[0.7, 2.3], color=BLUE)
        dot_root1 = Dot(axes5.c2p(1, 0), color=YELLOW)
        dot_root2 = Dot(axes5.c2p(2, 0), color=YELLOW)
        lbl_r1 = Text("1", font_size=14, color=YELLOW).next_to(dot_root1, UP + LEFT, buff=0.05)
        lbl_r2 = Text("2", font_size=14, color=YELLOW).next_to(dot_root2, UP + RIGHT, buff=0.05)

        # Tô màu vùng Parabol nằm dưới trục hoành f(x) < 0 trên (1; 2)
        para_sub = axes5.plot(lambda x: 4 * ((x - 1.5)**2) - 1, x_range=[1.0, 2.0], color=RED)

        opts5 = VGroup(
            Text("A. f(x) > 0, ∀x ∈ (0; 2)", font_size=15),
            Text("B. f(x) < 0, ∀x ∈ (0; 2)", font_size=15),
            Text("C. f(x) > 0, ∀x ∈ (1; +∞)", font_size=15),
            Text("D. f(x) < 0, ∀x ∈ (1; 2)", font_size=15, color=GREEN)
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT).to_edge(RIGHT, buff=0.6).shift(DOWN * 0.4)
        b5 = SurroundingRectangle(opts5[3], color=GREEN)

        with self.voiceover(text="Câu 5: Quan sát đồ thị Parabol, ta thấy trong khoảng x từ 1 đến 2, đồ thị nằm hoàn toàn phía dưới trục hoành, tức là f x nhỏ hơn 0 với mọi x thuộc khoảng 1 đến 2. Đáp án đúng là D."):
            self.play(Write(q5))
            self.play(Create(axes5), Create(parabola5), FadeIn(dot_root1, dot_root2, lbl_r1, lbl_r2))
            self.play(Create(para_sub), FadeIn(opts5))
            self.play(Create(b5))

        self.wait(2)
        self.clear()


# ==============================================================================
# PHẦN IV: BÀI TẬP TỰ LUYỆN (CÂU 6 ĐẾN CÂU 10 - CÓ BẢNG XÉT DẤU TRỰC QUAN)
# ==============================================================================
class Scene4_BaiTapTuLuyen_Part2(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("BÀI TẬP TỰ LUYỆN (CÂU 6 - CÂU 10)", font_size=28, color=YELLOW).to_edge(UP)
        self.add(title)

        # CÂU 6 (CÓ BẢNG XÉT DẤU HOÀN CHỈNH)
        q6 = Text("Câu 6: Tam thức bậc hai nào có BẢNG XÉT DẤU như hình vẽ?", font_size=20).next_to(title, DOWN, buff=0.3)
        
        # Bảng xét dấu Bài 6
        box_tb6 = RoundedRectangle(corner_radius=0.1, height=1.4, width=8.5, color=TEAL).next_to(q6, DOWN, buff=0.3)
        row6_x = Text("x    | -∞        0        4        +∞", font_size=16).move_to(box_tb6.get_top() + DOWN * 0.3)
        line6 = Line(box_tb6.get_left() + RIGHT*0.2, box_tb6.get_right() + LEFT*0.2).next_to(row6_x, DOWN, buff=0.1)
        row6_f = Text("f(x) |      +    0   -    0   +", font_size=16, color=YELLOW_B).next_to(line6, DOWN, buff=0.15)
        tb6 = VGroup(box_tb6, row6_x, line6, row6_f)

        o6 = VGroup(
            Text("A. y = x² - 2x", font_size=16),
            Text("B. y = x² + 2x", font_size=16),
            Text("C. y = x² - 4x", font_size=16, color=GREEN),
            Text("D. y = -x² + 4x", font_size=16)
        ).arrange(RIGHT, buff=0.4).next_to(tb6, DOWN, buff=0.3)
        b6 = SurroundingRectangle(o6[2], color=GREEN)

        with self.voiceover(text="Câu 6: Bảng xét dấu cho thấy f x có 2 nghiệm là 0 và 4. Trong khoảng hai nghiệm f x mang dấu âm, tức trái dấu với a, suy ra a lớn hơn 0. Tam thức thỏa mãn là y bằng x bình trừ 4x. Chọn C."):
            self.play(Write(q6))
            self.play(Create(tb6))
            self.play(FadeIn(o6))
            self.play(Create(b6))

        self.wait(1.5)
        self.play(FadeOut(q6), FadeOut(tb6), FadeOut(o6), FadeOut(b6))

        # CÂU 7 (CÓ BẢNG XÉT DẤU HOÀN CHỈNH)
        q7 = Text("Câu 7: Tam thức bậc hai nào có BẢNG XÉT DẤU như hình vẽ?", font_size=20).next_to(title, DOWN, buff=0.3)
        
        # Bảng xét dấu Bài 7
        box_tb7 = RoundedRectangle(corner_radius=0.1, height=1.4, width=8.5, color=ORANGE).next_to(q7, DOWN, buff=0.3)
        row7_x = Text("x    | -∞        0        2        +∞", font_size=16).move_to(box_tb7.get_top() + DOWN * 0.3)
        line7 = Line(box_tb7.get_left() + RIGHT*0.2, box_tb7.get_right() + LEFT*0.2).next_to(row7_x, DOWN, buff=0.1)
        row7_f = Text("f(x) |      -    0   +    0   -", font_size=16, color=YELLOW_B).next_to(line7, DOWN, buff=0.15)
        tb7 = VGroup(box_tb7, row7_x, line7, row7_f)

        o7 = VGroup(
            Text("A. y = x² - 2x", font_size=16),
            Text("B. y = -x² + 2x", font_size=16, color=GREEN),
            Text("C. y = x² - 4x", font_size=16),
            Text("D. y = x² + 4x", font_size=16)
        ).arrange(RIGHT, buff=0.4).next_to(tb7, DOWN, buff=0.3)
        b7 = SurroundingRectangle(o7[1], color=GREEN)

        with self.voiceover(text="Câu 7: Bảng xét dấu cho thấy f x có 2 nghiệm là 0 và 2, mang dấu dương trong khoảng hai nghiệm. Suy ra hệ số a nhỏ hơn 0. Đó là tam thức y bằng trừ x bình cộng 2x. Chọn B."):
            self.play(Write(q7))
            self.play(Create(tb7))
            self.play(FadeIn(o7))
            self.play(Create(b7))

        self.wait(1.5)
        self.play(FadeOut(q7), FadeOut(tb7), FadeOut(o7), FadeOut(b7))

        # CÂU 8 & 9
        q8 = Text("Câu 8 & 9: Cho tam thức f(x) = x² - 3x + 2 có 2 nghiệm x = 1, x = 2, a = 1 > 0.", font_size=20).next_to(title, DOWN, buff=0.4)
        ans8 = Text("Câu 8: f(x) < 0 với x ∈ (1; 2)  =>  Chọn B", font_size=18, color=GREEN).next_to(q8, DOWN, buff=0.3)
        ans9 = Text("Câu 9: Khẳng định SAI là C (Tại x=1, x=2 thì f(x)=0, không lớn hơn 0)", font_size=18, color=YELLOW_B).next_to(ans8, DOWN, buff=0.2)

        with self.voiceover(text="Câu 8 và 9: Tam thức x bình trừ 3x cộng 2 có hai nghiệm là 1 và 2. Trong khoảng 1 đến 2 f x âm, ngoài khoảng f x dương. Khẳng định sai ở câu 9 là C."):
            self.play(Write(q8))
            self.play(FadeIn(ans8), FadeIn(ans9))

        self.wait(1.5)
        self.play(FadeOut(q8), FadeOut(ans8), FadeOut(ans9))

        # CÂU 10
        q10 = Text("Câu 10: Tập hợp x để y = -x² + 2x luôn âm (y < 0) là:", font_size=22).next_to(title, DOWN, buff=0.4)
        o10 = VGroup(Text("A. (0; 2)", font_size=18), Text("B. (-∞; 0) ∪ (2; +∞)", font_size=18, color=GREEN), Text("C. [0; 2]", font_size=18), Text("D. (-∞; 0] ∪ [2; +∞)", font_size=18)).arrange(RIGHT, buff=0.4).next_to(q10, DOWN, buff=0.3)
        b10 = SurroundingRectangle(o10[1], color=GREEN)

        with self.voiceover(text="Câu 10: y có nghiệm 0 và 2, a nhỏ hơn 0. Do đó y âm ngoài khoảng hai nghiệm, tức x thuộc trừ vô cực đến 0 hợp với 2 đến cộng vô cực. Chọn B."):
            self.play(Write(q10), FadeIn(o10))
            self.play(Create(b10))

        self.wait(1.5)
        self.clear()


# ==============================================================================
# PHẦN V: BÀI TẬP LÀM THÊM (CÂU 11 ĐẾN CÂU 20 FULL)
# ==============================================================================
class Scene5_BaiTapLamThem_Full(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("BÀI TẬP LÀM THÊM (CÂU 11 - CÂU 20)", font_size=28, color=YELLOW).to_edge(UP)
        self.add(title)

        # CÂU 11
        q11 = Text("Câu 11: f(x) = x² - 2x luôn dương (f(x) > 0) khi:", font_size=22).next_to(title, DOWN, buff=0.4)
        ans11 = Text("Đáp án: B. (-∞; 0) ∪ (2; +∞) (Vì a=1>0, cùng dấu ngoài khoảng 2 nghiệm)", font_size=18, color=GREEN).next_to(q11, DOWN, buff=0.3)
        with self.voiceover(text="Câu 11: f x bằng x bình trừ 2x dương ngoài khoảng hai nghiệm 0 và 2. Chọn B."):
            self.play(Write(q11), FadeIn(ans11))
        self.wait(1)
        self.play(FadeOut(q11), FadeOut(ans11))

        # CÂU 12 & 13
        q1213 = Text("Câu 12 & 13: Tam thức luôn âm / luôn dương trên ℝ khi Δ < 0.", font_size=22).next_to(title, DOWN, buff=0.4)
        ans12 = Text("Câu 12: y = -x² + x - 1 luôn âm trên ℝ (a = -1 < 0, Δ = -3 < 0)  =>  Chọn C", font_size=18, color=GREEN).next_to(q1213, DOWN, buff=0.3)
        ans13 = Text("Câu 13: y = x² + x + 1 luôn dương trên ℝ (a = 1 > 0, Δ = -3 < 0)  =>  Chọn A", font_size=18, color=GREEN).next_to(ans12, DOWN, buff=0.2)
        with self.voiceover(text="Câu 12 và 13: Tam thức không đổi dấu trên R khi Delta nhỏ hơn 0. Tam thức luôn âm chọn C ở câu 12, luôn dương chọn A ở câu 13."):
            self.play(Write(q1213), FadeIn(ans12), FadeIn(ans13))
        self.wait(1)
        self.play(FadeOut(q1213), FadeOut(ans12), FadeOut(ans13))

        # CÂU 14 -> 17 (BẤT PHƯƠNG TRÌNH x² - 2x - 3)
        q1417 = Text("Câu 14 - 17: Tam thức f(x) = x² - 2x - 3 có 2 nghiệm x = -1, x = 3, a = 1 > 0.", font_size=22).next_to(title, DOWN, buff=0.4)
        t1417 = Text(
            "• Câu 14: Một nghiệm của x² - 2x - 3 > 0 là x = 5  =>  Chọn A\n"
            "• Câu 15: Tập nghiệm f(x) > 0 là (-∞; -1) ∪ (3; +∞)  =>  Chọn B\n"
            "• Câu 16: Tập nghiệm f(x) ≥ 0 là (-∞; -1] ∪ [3; +∞)  =>  Chọn D\n"
            "• Câu 17: Tập nghiệm f(x) ≤ 0 là [-1; 3]  =>  Chọn A",
            font_size=18, color=LIGHT_GRAY, line_spacing=1.3
        ).next_to(q1417, DOWN, buff=0.3)
        with self.voiceover(text="Từ câu 14 đến 17 xét bất phương trình x bình trừ 2x trừ 3. Ta có hai nghiệm là trừ 1 và 3, hệ số a dương. Suy ra nghiệm f x dương ngoài khoảng, f x âm trong khoảng."):
            self.play(Write(q1417), FadeIn(t1417))
        self.wait(1)
        self.play(FadeOut(q1417), FadeOut(t1417))

        # CÂU 18 -> 20 (BẤT PHƯƠNG TRÌNH VÔ NGHIỆM / LUÔN ĐÚNG)
        q1820 = Text("Câu 18 - 20: Tam thức f(x) = x² - x + 3 có a = 1 > 0, Δ = -11 < 0  =>  f(x) > 0 ∀x∈ℝ.", font_size=22).next_to(title, DOWN, buff=0.4)
        t1820 = Text(
            "• Câu 18: Tập nghiệm x² - 2x + 3 > 0 là ℝ  =>  Chọn B\n"
            "• Câu 19: Tập nghiệm x² - x + 3 ≥ 0 là ℝ  =>  Chọn B\n"
            "• Câu 20: Tập nghiệm x² - x + 3 < 0 là ∅ (Vô nghiệm)  =>  Chọn A",
            font_size=18, color=YELLOW_B, line_spacing=1.3
        ).next_to(q1820, DOWN, buff=0.3)
        with self.voiceover(text="Các câu 18 đến 20: Tam thức x bình trừ x cộng 3 có Delta âm và a dương nên luôn dương với mọi x thuộc R. Do đó bất phương trình lớn hơn 0 có tập nghiệm là R, bất phương trình nhỏ hơn 0 vô nghiệm. Chọn A cho câu 20."):
            self.play(Write(q1820), FadeIn(t1820))
        self.wait(2)
        self.clear()


# ==============================================================================
# LỚP HỢP NHẤT TOÀN BỘ BÀI GIẢNG FULL
# ==============================================================================
class FullLessonAllQuestions(
    Scene1_LyThuyetCoBan,
    Scene2_BangBienThienVaXetDau,
    Scene3_BaiTapTuLuyen_Part1,
    Scene4_BaiTapTuLuyen_Part2,
    Scene5_BaiTapLamThem_Full
):
    def construct(self):
        Scene1_LyThuyetCoBan.construct(self)
        Scene2_BangBienThienVaXetDau.construct(self)
        Scene3_BaiTapTuLuyen_Part1.construct(self)
        Scene4_BaiTapTuLuyen_Part2.construct(self)
        Scene5_BaiTapLamThem_Full.construct(self)
