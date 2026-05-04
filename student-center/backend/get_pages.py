import zipfile
import xml.etree.ElementTree as ET
import re

def get_text_with_pages(docx_path):
    # Namespaces
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    with zipfile.ZipFile(docx_path) as docx:
        xml_content = docx.read('word/document.xml')
        
    tree = ET.fromstring(xml_content)
    
    page_num = 1
    pages_text = {1: []}
    
    # Iterate through all elements in the body
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

    # Reconstruct text per page
    for p, text_list in pages_text.items():
        pages_text[p] = "".join(text_list)
        
    return pages_text

pages = get_text_with_pages("/Users/minhngoc/Downloads/KLTN (1).docx")
print("Total pages found:", max(pages.keys()))
for p in list(pages.keys())[:5]:
    print(f"--- Page {p} ---")
    print(pages[p][:100])
