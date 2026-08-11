import pptxgen from "pptxgenjs";

export interface SlideData {
  id: string;
  slideNumber: number;
  activityType: "intro" | "warmup" | "knowledge" | "expansion" | "practice" | "application" | "summary";
  badge: string;
  title: string;
  subtitle?: string;
  bulletPoints?: string[];
  cards?: { title: string; desc: string; icon?: string; color?: string }[];
  comparison?: { leftTitle: string; leftContent: string; rightTitle: string; rightContent: string };
  callout?: { title: string; content: string; icon?: string };
  notes?: string; // Ghi chú giảng dạy cho giáo viên
}

/**
 * Xuất danh sách Slides thành file PowerPoint .pptx chất lượng cao
 */
export async function exportLessonToPPTX(
  lessonTitle: string,
  subject: string,
  grade: string,
  author: string,
  slides: SlideData[]
): Promise<Blob> {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = author || "MINDA AI";
  pres.company = "MINDA E-Learning";
  pres.title = lessonTitle;

  // Slide 1: Cover Slide
  const coverSlide = pres.addSlide();
  coverSlide.background = { color: "0B0F19" }; // Dark slate

  // Decorative shapes
  coverSlide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: 0.15,
    fill: { color: "F43F5E" }
  });

  coverSlide.addText(`${subject.toUpperCase()} ${grade.toUpperCase()} • GDPT 2018`, {
    x: 0.8, y: 1.8, w: 10, h: 0.4,
    fontSize: 14, fontFace: "Calibri", color: "F43F5E", bold: true
  });

  coverSlide.addText(lessonTitle, {
    x: 0.8, y: 2.3, w: 11.5, h: 1.5,
    fontSize: 36, fontFace: "Arial", color: "FFFFFF", bold: true
  });

  coverSlide.addText(`Bài giảng Tương tác Đa phương tiện & Mở rộng Chuyên sâu\nNgười soạn: ${author} | Hệ thống MINDA E-Learning`, {
    x: 0.8, y: 4.2, w: 11, h: 0.8,
    fontSize: 15, fontFace: "Calibri", color: "94A3B8"
  });

  // Render each content slide
  slides.forEach((s) => {
    const slide = pres.addSlide();
    slide.background = { color: "0B0F19" };

    // Header Badge & Title
    slide.addText(s.badge.toUpperCase(), {
      x: 0.8, y: 0.5, w: 6, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: "F43F5E", bold: true
    });

    slide.addText(s.title, {
      x: 0.8, y: 0.85, w: 11.5, h: 0.8,
      fontSize: 24, fontFace: "Arial", color: "FFFFFF", bold: true
    });

    if (s.subtitle) {
      slide.addText(s.subtitle, {
        x: 0.8, y: 1.65, w: 11.5, h: 0.4,
        fontSize: 13, fontFace: "Calibri", color: "94A3B8", italic: true
      });
    }

    let startY = s.subtitle ? 2.2 : 1.9;

    // Bullet points layout
    if (s.bulletPoints && s.bulletPoints.length > 0) {
      const items = s.bulletPoints.map(bp => ({ text: bp, options: { bullet: true, color: "E2E8F0", fontSize: 14 } }));
      slide.addText(items, {
        x: 0.8, y: startY, w: 11.5, h: 3.5,
        fontFace: "Calibri", lineSpacing: 24
      });
    }

    // Grid Cards layout
    if (s.cards && s.cards.length > 0) {
      const cardCount = s.cards.length;
      const cardW = cardCount <= 3 ? 3.6 : 2.7;
      s.cards.forEach((c, idx) => {
        const cardX = 0.8 + idx * (cardW + 0.3);
        // Card background shape
        slide.addShape(pres.ShapeType.roundRect, {
          x: cardX, y: startY, w: cardW, h: 3.8,
          fill: { color: "1E293B" },
          line: { color: "334155", width: 1 }
        });

        // Card Title
        slide.addText(`${c.icon ? c.icon + " " : ""}${c.title}`, {
          x: cardX + 0.2, y: startY + 0.3, w: cardW - 0.4, h: 0.6,
          fontSize: 14, fontFace: "Arial", color: "F8FAFC", bold: true
        });

        // Card Content
        slide.addText(c.desc, {
          x: cardX + 0.2, y: startY + 0.95, w: cardW - 0.4, h: 2.5,
          fontSize: 12, fontFace: "Calibri", color: "94A3B8", lineSpacing: 18
        });
      });
    }

    // Comparison Layout
    if (s.comparison) {
      // Left Box
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y: startY, w: 5.6, h: 3.8,
        fill: { color: "1E293B" },
        line: { color: "F43F5E", width: 1 }
      });
      slide.addText(s.comparison.leftTitle, {
        x: 1.0, y: startY + 0.3, w: 5.2, h: 0.5,
        fontSize: 16, fontFace: "Arial", color: "F43F5E", bold: true
      });
      slide.addText(s.comparison.leftContent, {
        x: 1.0, y: startY + 0.9, w: 5.2, h: 2.6,
        fontSize: 13, fontFace: "Calibri", color: "E2E8F0", lineSpacing: 20
      });

      // Right Box
      slide.addShape(pres.ShapeType.roundRect, {
        x: 6.8, y: startY, w: 5.6, h: 3.8,
        fill: { color: "1E293B" },
        line: { color: "10B981", width: 1 }
      });
      slide.addText(s.comparison.rightTitle, {
        x: 7.0, y: startY + 0.3, w: 5.2, h: 0.5,
        fontSize: 16, fontFace: "Arial", color: "10B981", bold: true
      });
      slide.addText(s.comparison.rightContent, {
        x: 7.0, y: startY + 0.9, w: 5.2, h: 2.6,
        fontSize: 13, fontFace: "Calibri", color: "E2E8F0", lineSpacing: 20
      });
    }

    // Callout Box
    if (s.callout) {
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y: 5.6, w: 11.5, h: 1.2,
        fill: { color: "312E81" }, // Indigo
        line: { color: "6366F1", width: 1 }
      });
      slide.addText(`💡 ${s.callout.title}: ${s.callout.content}`, {
        x: 1.1, y: 5.75, w: 11.0, h: 0.9,
        fontSize: 12, fontFace: "Calibri", color: "E0E7FF"
      });
    }

    // Teacher Notes
    if (s.notes) {
      slide.addNotes(s.notes);
    }
  });

  return (await pres.write({ outputType: "blob" })) as Blob;
}
