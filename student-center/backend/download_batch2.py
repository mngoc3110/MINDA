import urllib.request
import os
import ssl
import time

paper_dir = "/Users/minhngoc/Downloads/RAPT-CLIP-RAER 2/paper"
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

downloads = [
    # [34] Khaireddin & Chen 2021 - FER2013 SOTA - arxiv: 2105.03588
    # Already downloaded as 2105.03588v1.pdf - script didn't match
    
    # [21] Whitehill 2014 - Faces of Engagement 
    # There's a file named "2019SOIC74826839.pdf" which might be Soloviev[48] not Whitehill
    # The actual Whitehill paper: DOI 10.1109/TAFFC.2014.2316163
    # Try from CMU: http://www.ri.cmu.edu/pub_files/2014/1/whitehill_facesengagement.pdf
    ("[21]_Whitehill_2014_Faces_Engagement.pdf", "https://jrwhitehill.com/pubs/WhitehillEtAl-TAFFC2014.pdf"),
    
    # [25] Lucey 2010 CK+ - DOI: 10.1109/CVPRW.2010.5543262
    # Try from pitt.edu
    ("[25]_Lucey_2010_CK_Plus.pdf", "https://www.jeffcohn.net/wp-content/uploads/2020/04/Lucey2010_CK.pdf"),
    
    # [37] Wang et al. - Survey FER Static Dynamic
    # Likely arxiv: 2408.15777 or similar
    ("[37]_Wang_Survey_FER_Static_Dynamic.pdf", "https://arxiv.org/pdf/2408.15777v1"),
    
    # [46] Li et al. - CLIPER ICME 2024
    # Try arxiv: 2310.01223
    ("[46]_Li_CLIPER_ICME2024.pdf", "https://arxiv.org/pdf/2310.01223v2"),

    # [48] Soloviev 2018 - ML student engagement
    ("[48]_Soloviev_2018_ML_Student_Engagement.pdf", "https://scindeks-clanci.ceon.rs/data/pdf/2217-5539/2018/2217-55391802079S.pdf"),
    
    # [6] Yulius 2025 - Atlantis Press - DOI: 10.2991/978-94-6463-982-7_10
    # Might be open access
    ("[6]_Yulius_2025_FER_KAN_MLP.pdf", "https://www.atlantis-press.com/article/126020077.pdf"),

    # [35] Savchenko 2021 - lightweight FER
    # Try from arxiv if available: 2103.17107
    ("[35]_Savchenko_2021_Lightweight_FER.pdf", "https://arxiv.org/pdf/2103.17107v2"),
]

for filename, url in downloads:
    filepath = os.path.join(paper_dir, filename)
    if os.path.exists(filepath):
        print(f"SKIP (exists): {filename}")
        continue
    print(f"Downloading: {filename} ...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            data = response.read()
            if len(data) < 5000:
                print(f"  WARNING: File too small ({len(data)} bytes), might be error page - skipping")
            else:
                with open(filepath, 'wb') as f:
                    f.write(data)
                print(f"  OK: {len(data)} bytes")
        time.sleep(1)
    except Exception as e:
        print(f"  FAILED: {e}")

print("\nDone!")
