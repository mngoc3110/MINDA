import requests
from bs4 import BeautifulSoup
import os
import time

def download_file(url, folder):
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        response = requests.get(url, headers=headers, stream=True)
        if response.status_code == 200:
            filename = url.split('/')[-1]
            if not filename.endswith(('.pdf', '.docx', '.doc', '.rar', '.zip')):
                cd = response.headers.get('content-disposition')
                if cd:
                    import re
                    fname = re.findall('filename=(.+)', cd)
                    if fname: filename = fname[0].strip('"')
            
            path = os.path.join(folder, filename)
            # Kiểm tra lại tên file một lần nữa trước khi lưu
            if 'tin' in filename.lower():
                with open(path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                print(f"✅ Đã tải môn Tin: {filename}")
                return True
    except Exception as e:
        print(f"❌ Lỗi tải {url}: {e}")
    return False

def scrape_tin_only():
    target_url = "https://thuvienhoclieu.com/tai-lieu-tin-hoc/de-thi-thu-tot-nghiep-mon-tin/"
    folder = "projects/MINDA/de_tin_hoc"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    
    print(f"🔍 Đang quét chuyên sâu môn Tin học tại: {target_url}")
    res = requests.get(target_url, headers=headers)
    soup = BeautifulSoup(res.text, 'html.parser')
    
    articles = soup.find_all('h3', class_='entry-title')
    count = 0
    for art in articles:
        link_tag = art.find('a')
        if not link_tag: continue
        
        post_url = link_tag['href']
        post_title = link_tag.get_text().strip()
        
        # Bộ lọc nghiêm ngặt: Phải có chữ "Tin" và không được chứa tên các môn khác
        exclude_subjects = ['toán', 'vật lí', 'hóa', 'sinh', 'văn', 'anh', 'sử', 'địa', 'gdcd', 'kinh tế']
        is_tin = 'tin' in post_title.lower()
        is_other = any(sub in post_title.lower() for sub in exclude_subjects)
        
        if is_tin and not is_other:
            print(f"📖 Truy cập bài môn Tin: {post_title}")
            sub_res = requests.get(post_url, headers=headers)
            sub_soup = BeautifulSoup(sub_res.text, 'html.parser')
            
            for download_link in sub_soup.find_all('a', href=True):
                href = download_link['href']
                if any(ext in href.lower() for ext in ['.pdf', '.docx', '.doc']):
                    if download_file(href, folder):
                        count += 1
                        time.sleep(0.5)
    
    print(f"🚀 Hoàn tất! Thư mục hiện chỉ chứa {count} đề môn Tin học mới nhất.")

if __name__ == "__main__":
    scrape_tin_only()
