import zipfile
import xml.etree.ElementTree as ET
import re

def get_text_with_pages(docx_path):
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    with zipfile.ZipFile(docx_path) as docx:
        xml_content = docx.read('word/document.xml')
    tree = ET.fromstring(xml_content)
    page_num = 1
    pages_text = {1: []}
    for node in tree.iter():
        if node.tag == '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}lastRenderedPageBreak':
            page_num += 1
            pages_text[page_num] = []
        elif node.tag == '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}br':
            if node.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}type') == 'page':
                page_num += 1
                pages_text[page_num] = []
        elif node.tag == '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t':
            if node.text:
                pages_text[page_num].append(node.text)
    for p, text_list in pages_text.items():
        pages_text[p] = "".join(text_list)
    return pages_text

pages = get_text_with_pages("/Users/minhngoc/Downloads/KLTN (1).docx")

errors = [
    ("luận văn", "Lời cam đoan"),
    ("thực tiến", "Mục lục & Mở đầu"),
    ("tồn động một số hạn chế", "Mở đầu"),
    ("bùng nổ của Covid19", "Mở đầu"),
    ("Đều xuất hướng", "Mở đầu"),
    ("vấn hành", "Chương 1"),
    ("đặc biệt nấht là", "Chương 1"),
    ("đóng vài trò", "Chương 1"),
    ("Ngạc nghiên", "Chương 1"),
    ("bước sang bài toàn", "Chương 1"),
    ("tham gia tham học", "Chương 1"),
    ("triển vòng", "Chương 1"),
    ("bước ngoặc", "Chương 1"),
    ("nôi dung hình", "Chương 1"),
    ("xugn quanh", "Chương 1"),
    ("dòng thời hai", "Chương 1"),
    ("độ hôi tụ", "Chương 1"),
    ("dã được quy", "Chương 1"),
    ("sự mô hồ", "Chương 1"),
    ("khong thể hiện", "Chương 1"),
    ("sẽ dụng", "Chương 1"),
    ("dữ liệu còn nhiều rất nhiều", "Chương 1"),
    ("có thế multi", "Chương 2"),
    ("chặng hạn", "Chương 2"),
    ("Potentional", "Chương 2"),
    ("đề xuẩ", "Chương 3"),
    ("ecoder", "Chương 3"),
    ("Lẫy mẫu", "Chương 3"),
    ("rới ReLU", "Chương 3"),
    ("cập nhập", "Chương 3"),
    ("giữ đông", "Chương 3"),
    ("embbeding", "Chương 3"),
    ("thứ tự thời", "Chương 3"),
    ("từu", "Chương 3"),
    ("có chế", "Chương 3"),
    ("nghữ nghĩa", "Chương 3"),
    ("giamr", "Chương 3"),
    ("cách hàm", "Chương 3"),
    ("đấu hiệu", "Chương 3"),
    ("đầu nghiên", "Chương 3"),
    ("thống số", "Chương 3"),
    ("hành và một phần ngữ", "Chương 3"),
    ("224x24", "Chương 4"),
    ("dảm bảo", "Chương 4"),
    ("sử lý", "Chương 4"),
    ("kết quả quan.", "Chương 4"),
    ("đạ 73,81", "Chương 4"),
    ("phân tính", "Chương 4"),
    ("xung quang", "Chương 4"),
    ("hiệu xuất", "Chương 4"),
    ("chính xcas", "Chương 4"),
    ("adpater", "Chương 4"),
    ("tuninig", "Chương 4"),
    ("dược xem", "Chương 4"),
    ("Scrore", "Chương 4"),
    ("phủ hợp", "Chương 4"),
    ("số mãu", "Chương 4")
]

for error, context in errors:
    found_pages = []
    # clean up error string to ignore spaces since docx xml might split text inside tags
    # we use a simpler approach: remove spaces from search string and target string
    err_stripped = error.replace(" ", "").lower()
    for p, text in pages.items():
        if err_stripped in text.replace(" ", "").lower():
            found_pages.append(str(p))
    if found_pages:
        print(f"| Trang {', '.join(found_pages)} | \"{error}\" |")
    else:
        print(f"| Không tìm thấy | \"{error}\" |")
