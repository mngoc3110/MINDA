from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService


class Scene1_DinhNghia(VoiceoverScene):
    """Phần I: Khái niệm & Định nghĩa Hàm số bậc hai"""

    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        header = Text("CHỦ ĐỀ 4: TAM THỨC BẬC HAI", font_size=34, color=YELLOW)
        header.to_edge(UP)
        
        subheader = Text("1. Khái niệm hàm số bậc hai", font_size=26, color=BLUE_B)
        subheader.next_to(header, DOWN, buff=0.3)

        with self.voiceover(text="Chào mừng các em đến với Bài học Chủ đề 4: Tam thức bậc hai và Hàm số bậc hai."):
            self.play(Write(header))
            self.play(FadeIn(subheader))

        formula = Text("y = ax² + bx + c  (a ≠ 0)", font_size=38, color=RED_B)
        formula.next_to(subheader, DOWN, buff=0.6)

        txt_txd = Text("Tập xác định: D = ℝ", font_size=28, color=GREEN)
        txt_txd.next_to(formula, DOWN, buff=0.4)

        with self.voiceover(text="Tổng quát, hàm số bậc hai là hàm số được cho bởi công thức y bằng a x bình cộng b x cộng c, trong đó a khác 0."):
            self.play(Write(formula))
            self.play(FadeIn(txt_txd))

        box_remark = RoundedRectangle(corner_radius=0.2, height=1.4, width=9.5, color=ORANGE)
        box_remark.next_to(txt_txd, DOWN, buff=0.5)

        txt_remark = Text(
            "Nhận xét: Hàm số y = ax² (a ≠ 0) học ở lớp 9\nlà trường hợp đặc biệt khi b = c = 0.",
            font_size=20,
            color=WHITE,
            line_spacing=1.2
        )
        txt_remark.move_to(box_remark.get_center())

        with self.voiceover(text="Các em lưu ý, hàm số y bằng a x bình đã học ở lớp 9 là một trường hợp đặc biệt khi b và c bằng 0."):
            self.play(Create(box_remark), Write(txt_remark))

        self.wait(1)
        self.clear()


class Scene2_DoThiParabol(VoiceoverScene):
    """Phần II: Đồ thị Hàm số Bậc hai & Trục đối xứng"""

    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("2. Đồ thị hàm số bậc hai", font_size=32, color=YELLOW).to_edge(UP)
        self.add(title)

        form2 = Text("y = a(x + b/2a)² - Δ/4a", font_size=32, color=TEAL)
        form2.next_to(title, DOWN, buff=0.4)

        vertex_info = Text(
            "Đỉnh I(-b/2a; -Δ/4a),  Trục đối xứng x = -b/2a",
            font_size=24,
            color=YELLOW_B
        )
        vertex_info.next_to(form2, DOWN, buff=0.3)

        with self.voiceover(text="Đồ thị của hàm số bậc hai là một đường Parabol có đỉnh I có tọa độ trừ b trên 2a và trừ Delta trên 4a, có trục đối xứng là đường thẳng x bằng trừ b trên 2a."):
            self.play(Write(form2))
            self.play(Write(vertex_info))

        axes1 = Axes(
            x_range=[-2.5, 1.5, 1], y_range=[-1.5, 2.5, 1],
            x_length=4.2, y_length=3.2,
            axis_config={"include_tip": True}
        ).to_edge(LEFT, buff=0.8).shift(DOWN * 0.8)

        lab1 = Text("a > 0 (Quay lên)", font_size=18, color=GREEN).next_to(axes1, UP)
        parabola1 = axes1.plot(lambda x: (x + 1)**2 - 0.8, x_range=[-2.3, 0.3], color=BLUE)
        dot1 = Dot(axes1.c2p(-1, -0.8), color=RED)
        label_I1 = Text("I", font_size=20, color=RED).next_to(dot1, DOWN + LEFT, buff=0.1)

        axes2 = Axes(
            x_range=[-1.5, 2.5, 1], y_range=[-2.5, 1.5, 1],
            x_length=4.2, y_length=3.2,
            axis_config={"include_tip": True}
        ).to_edge(RIGHT, buff=0.8).shift(DOWN * 0.8)

        lab2 = Text("a < 0 (Quay xuống)", font_size=18, color=RED_B).next_to(axes2, UP)
        parabola2 = axes2.plot(lambda x: -((x - 1)**2) + 0.8, x_range=[-0.3, 2.3], color=ORANGE)
        dot2 = Dot(axes2.c2p(1, 0.8), color=RED)
        label_I2 = Text("I", font_size=20, color=RED).next_to(dot2, UP + RIGHT, buff=0.1)

        with self.voiceover(text="Nếu a lớn hơn 0, Parabol quay bề lõm lên trên. Ngược lại nếu a nhỏ hơn 0, Parabol quay bề lõm xuống dưới."):
            self.play(Create(axes1), Create(axes2))
            self.play(Write(lab1), Write(lab2))
            self.play(Create(parabola1), Create(parabola2))
            self.play(FadeIn(dot1, label_I1, dot2, label_I2))

        self.wait(2)
        self.clear()


class Scene4_BaiTapMinhHoa(VoiceoverScene):
    """Phần IV: Giải Bài Tập Minh Họa"""

    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("II. BÀI TẬP VẬN DỤNG", font_size=32, color=YELLOW).to_edge(UP)
        self.add(title)

        q_text = Text(
            "Câu 4: Tìm m để f(x) = (m - 2)x² + 5x + 9 là tam thức bậc hai.",
            font_size=22,
            color=WHITE
        ).next_to(title, DOWN, buff=0.5)

        opts = VGroup(
            Text("A. m ∈ ℝ", font_size=20),
            Text("B. m = 2", font_size=20),
            Text("C. m ≠ 2", font_size=20, color=GREEN),
            Text("D. m ≠ 0", font_size=20)
        ).arrange(RIGHT, buff=0.8).next_to(q_text, DOWN, buff=0.4)

        with self.voiceover(text="Chúng ta cùng giải Câu 4: Tìm tất cả giá trị của m để biểu thức f(x) là tam thức bậc hai."):
            self.play(Write(q_text))
            self.play(FadeIn(opts))

        sol_step1 = Text("Điều kiện tam thức bậc hai: a = m - 2 ≠ 0", font_size=24, color=LIGHT_GRAY)
        sol_step1.next_to(opts, DOWN, buff=0.6)

        sol_step2 = Text("⇔ m ≠ 2", font_size=32, color=YELLOW)
        sol_step2.next_to(sol_step1, DOWN, buff=0.3)

        box_ans = SurroundingRectangle(opts[2], color=GREEN, buff=0.15)

        with self.voiceover(text="Để f(x) là tam thức bậc hai thì hệ số a phải khác 0, tức m trừ 2 khác 0, tương đương m khác 2. Đáp án đúng là C."):
            self.play(Write(sol_step1))
            self.play(Write(sol_step2))
            self.play(Create(box_ans))

        self.wait(2)


class TamThucBacHaiFullLesson(Scene1_DinhNghia, Scene2_DoThiParabol, Scene4_BaiTapMinhHoa):
    def construct(self):
        Scene1_DinhNghia.construct(self)
        Scene2_DoThiParabol.construct(self)
        Scene4_BaiTapMinhHoa.construct(self)
