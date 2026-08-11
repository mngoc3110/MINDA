from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService

# ==============================================================================
# BÀI GIẢNG LÝ THUYẾT CHUYÊN SÂU: TÍCH PHÂN
# GV: NGUYỄN LÊ MINH NGỌC
# ==============================================================================

class Scene1_Intro_And_Concept(VoiceoverScene):
    """Phần 1: Chào mừng & Bản chất toán học chuyên sâu"""
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        header = Text("TÍCH PHÂN", font_size=24, color=YELLOW).to_edge(UP)
        sub_info = Text("CHUYÊN ĐỀ TỔNG ÔN CHUYÊN SÂU | GV: NGUYỄN LÊ MINH NGỌC", font_size=16, color=BLUE_B).next_to(header, DOWN, buff=0.2)

        with self.voiceover(text="Chào mừng các em đến với bài giảng lý thuyết chuyên sâu về Tích phân. Ở bài học này, chúng ta không chỉ học vẹt công thức mà sẽ cùng phân tích kỹ bản chất toán học, nguồn gốc các phép biến đổi và các bẫy thường gặp trong đề thi."):
            self.play(Write(header))
            self.play(FadeIn(sub_info))

        # Khái niệm chuyên sâu
        t_concept = Text("1. \color{blue!80!black", font_size=20, color=TEAL).next_to(sub_info, DOWN, buff=0.3)
        
        box_theory = RoundedRectangle(corner_radius=0.15, height=2.2, width=10.5, color=GREEN).next_to(t_concept, DOWN, buff=0.3)
        txt_theory = Text(
            "• Bản chất: Xác định điều kiện tồn tại & vùng xác định của biểu thức.\n"
            "• Ý nghĩa đồ thị: Biểu diễn mối quan hệ phụ thuộc giữa các biến số.\n"
            "• Phương pháp suy luận: Đi từ định nghĩa gốc đến công thức tính nhanh.",
            font_size=15, color=WHITE, line_spacing=1.3
        ).move_to(box_theory)

        with self.voiceover(text="Về mặt lý thuyết, \color{blue!80!black đóng vai trò nền tảng. Khi xét một biểu thức hay đồ thị, điều quan trọng nhất là các em phải nắm rõ điều kiện tồn tại, tập xác định và sự phụ thuộc giữa các đại lượng."):
            self.play(Write(t_concept))
            self.play(Create(box_theory), Write(txt_theory))

        self.wait(2)
        self.clear()


class Scene2_Deep_Theory_Proof(VoiceoverScene):
    """Phần 2: Chứng minh công thức & Phân tích các trường hợp"""
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("2. \color{blue!80!black & Phân Tích Các Trường Hợp", font_size=22, color=YELLOW).to_edge(UP)
        self.add(title)

        # Trực quan hóa bằng Trục tọa độ / Đồ thị động
        axes = Axes(x_range=[-3, 4, 1], y_range=[-2, 4, 1], x_length=4.5, y_length=3.0, axis_config={"include_tip": True}).to_edge(LEFT, buff=0.8).shift(DOWN * 0.3)
        curve = axes.plot(lambda x: 0.3*x**2 - 0.5, x_range=[-2.5, 3.2], color=BLUE)
        dot_special = Dot(axes.c2p(0, -0.5), color=RED)
        lbl_special = Text("Điểm đặc biệt (Cực trị / Đỉnh)", font_size=14, color=RED).next_to(dot_special, DOWN)

        box_cases = RoundedRectangle(corner_radius=0.15, height=2.8, width=5.8, color=ORANGE).to_edge(RIGHT, buff=0.6).shift(DOWN * 0.3)
        txt_cases = Text(
            "CÁC TRƯỜNG HỢP & LƯU Ý:\n"
            "1. Trường hợp a > 0: Chiều biến thiên đi lên.\n"
            "2. Trường hợp a < 0: Chiều biến thiên đi xuống.\n"
            "3. Bẫy đề thi: Quên xét điều kiện a ≠ 0\n"
            "   hoặc nhầm lẫn tập xác định D.",
            font_size=14, color=YELLOW_B, line_spacing=1.3
        ).move_to(box_cases)

        with self.voiceover(text="Tiếp theo là phần \color{blue!80!black. Các em cần chia rõ các trường hợp xảy ra. Đặc biệt lưu ý bẫy đề thi hay gài bẫy ở điều kiện hệ số a khác 0 hoặc tập xác định D. Chúng ta phải kiểm tra kỹ điều kiện trước khi kết luận."):
            self.play(Create(axes), Create(curve), FadeIn(dot_special, lbl_special))
            self.play(Create(box_cases), Write(txt_cases))

        self.wait(2)
        self.clear()


class Scene3_Exercises_Detailed(VoiceoverScene):
    """Phần 3: Bài tập vận dụng giải thích lý thuyết chi tiết từng bước"""
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))

        title = Text("III. BÀI TẬP VẬN DỤNG GIẢI THÍCH CHUYÊN SÂU", font_size=22, color=YELLOW).to_edge(UP)
        self.add(title)

        # Câu 1 Minh họa với giải thích kỹ lưỡng
        q1 = Text("Câu 1: Vận dụng lý thuyết giải toán trọng tâm Tích phân", font_size=18).next_to(title, DOWN, buff=0.3)
        opts1 = VGroup(
            Text("A. Phương án 1 (Chính xác)", font_size=16, color=GREEN),
            Text("B. Phương án 2 (Sai điều kiện)", font_size=16),
            Text("C. Phương án 3 (Nhầm dấu)", font_size=16),
            Text("D. Phương án 4 (Vô nghiệm)", font_size=16)
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT).next_to(q1, DOWN, buff=0.3)

        # LỜI GIẢI THÍCH CHUYÊN SÂU TRƯỚC KHI KHOANH ĐÁP ÁN
        sol1 = Text(
            "PHÂN TÍCH VÀ GIẢI THÍCH CHI TIẾT LÝ DO CHỌN:\n"
            "1. Áp dụng định lý trọng tâm: Kiểm tra tập xác định D và tính liên tục.\n"
            "2. Biến đổi từng bước: Phân tích hệ số a, b, c và tính delta/đạo hàm.\n"
            "3. Loại trừ phương án B, C, D do vi phạm điều kiện tồn tại.\n"
            "=> Kết luận: Phương án A là đáp án duy nhất đúng.",
            font_size=14, color=LIGHT_GRAY, line_spacing=1.3
        ).next_to(opts1, DOWN, buff=0.3)

        b1 = SurroundingRectangle(opts1[0], color=GREEN, buff=0.1)

        with self.voiceover(text="Đối với bài tập này, chúng ta tiến hành giảng giải chi tiết như sau: Bước 1, kiểm tra tập xác định D và tính liên tục của hàm số. Bước 2, phân tích kỹ hệ số và tính toán chính xác. Bước 3, loại trừ các đáp án B C D do vi phạm điều kiện tồn tại. Sau khi đã chứng minh hoàn toàn lý do, chúng ta chọn đáp án A."):
            self.play(Write(q1), FadeIn(opts1))
            self.play(Write(sol1))
            # CHỈ TÔ KHOANH ĐÁP ÁN ĐÚNG SAU KHI ĐÃ GIẢI THÍCH LÝ DO VÀ BẢN CHẤT LÝ THUYẾT!
            self.play(Create(b1))

        self.wait(2)
        self.clear()


class FullLesson_Deep_C4_B2(Scene1_Intro_And_Concept, Scene2_Deep_Theory_Proof, Scene3_Exercises_Detailed):
    def construct(self):
        Scene1_Intro_And_Concept.construct(self)
        Scene2_Deep_Theory_Proof.construct(self)
        Scene3_Exercises_Detailed.construct(self)
