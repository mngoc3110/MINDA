from manim import *

class MathAnimation(Scene):
    def construct(self):
        axes = Axes(x_range=[-3, 3], y_range=[-3, 3], axis_config={"color": BLUE})
        graph = axes.plot(lambda x: x**2, color=WHITE)
        title = MathTex("y = x^2")
        title.to_edge(UP)

        self.play(Create(axes))
        self.play(Write(title))
        self.play(Create(graph), run_time=2)
        self.wait(2)
