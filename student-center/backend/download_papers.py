import urllib.request
import os
import ssl
import time

paper_dir = "/Users/minhngoc/Downloads/RAPT-CLIP-RAER 2/paper"

# Papers with downloadable URLs (arxiv or direct)
downloads = [
    # [14] Pekrun 2002 - Academic Emotions
    # Book chapter, no direct PDF
    
    # [6] Yulius 2025 - DOI: 10.2991/978-94-6463-982-7_10
    # Atlantis Press, likely paywalled
    
    # [21] Whitehill 2014 - DOI: 10.1109/TAFFC.2014.2316163
    # IEEE, already have reference in other file name
    
    # [25] Lucey 2010 - CK+ dataset paper - DOI: 10.1109/CVPRW.2010.5543262
    # IEEE paper
    
    # [34] Khaireddin 2021 - FER2013 SOTA - arxiv: 2105.03588
    ("2105.03588v1.pdf", "https://arxiv.org/pdf/2105.03588v1"),
    
    # [35] Savchenko 2021 - multi-task lightweight - DOI: 10.1109/SISY52375.2021.9582508
    # IEEE, likely available
    
    # [37] Wang et al. - Survey FER Static Dynamic Emotions
    # This seems to be a preprint, let me try searching
    
    # [38] Kopalidis 2024 - Advances FER Survey - DOI: 10.3390/info15030135 (MDPI, open access)
    ("[38]_Kopalidis_2024_Advances_FER_Survey.pdf", "https://www.mdpi.com/2078-2489/15/3/135/pdf"),
    
    # [45] Zhao & Patras - DFER-CLIP - arxiv: 2308.13382
    ("[45]_Zhao_Patras_DFER-CLIP.pdf", "https://arxiv.org/pdf/2308.13382v2"),
    
    # [46] Li et al. - CLIPER - ICME 2024 - DOI: 10.1109/ICME57554.2024.10687508
    # IEEE, likely paywalled
    
    # [50] 2405.04251 - arxiv
    ("[50]_2405.04251.pdf", "https://arxiv.org/pdf/2405.04251v1"),
    
    # [65] Carreira & Zisserman - I3D Kinetics - arxiv: 1705.07750
    ("[65]_Carreira_Zisserman_I3D_Kinetics.pdf", "https://arxiv.org/pdf/1705.07750v1"),
    
    # [66] Wang et al. - M3DFEL CVPR 2023 - might be on arxiv
    ("[66]_Wang_M3DFEL_CVPR2023.pdf", "https://arxiv.org/pdf/2303.13695v1"),
    
    # [67] Zhao & Liu - Former-DFER
    ("[67]_Zhao_Liu_Former-DFER.pdf", "https://arxiv.org/pdf/2107.02112v1"),
    
    # [29] Pekrun 2006 - Control-Value Theory - book/journal, not freely available
    # [30] Finn & Zimmer 2012 - Book chapter in Handbook
    # [31] Skinner & Pitzer 2012 - Book chapter in Handbook  
    # [32] Christenson et al. 2012 - Book (Handbook of Student Engagement)
    # These are book chapters, not freely downloadable
]

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for filename, url in downloads:
    filepath = os.path.join(paper_dir, filename)
    if os.path.exists(filepath):
        print(f"SKIP (exists): {filename}")
        continue
    print(f"Downloading: {filename} ...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            data = response.read()
            if len(data) < 10000:
                print(f"  WARNING: File too small ({len(data)} bytes), might be error page")
            else:
                with open(filepath, 'wb') as f:
                    f.write(data)
                print(f"  OK: {len(data)} bytes")
        time.sleep(1)
    except Exception as e:
        print(f"  FAILED: {e}")

print("\nDone!")
