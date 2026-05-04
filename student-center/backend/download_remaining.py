import urllib.request
import os
import ssl
import time

paper_dir = "/Users/minhngoc/Downloads/RAPT-CLIP-RAER 2/paper"
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Remaining downloadable papers
downloads = [
    # [38] Kopalidis - MDPI open access - try alternate URL
    ("[38]_Kopalidis_2024_Advances_FER_Survey.pdf", "https://mdpi-res.com/d_attachment/information/information-15-00135/article_deploy/information-15-00135-v2.pdf"),
    
    # [21] Whitehill - Faces of Engagement - let's try
    # Already have reference: 2019SOIC74826839.pdf might match? No.
    # The actual paper DOI: 10.1109/TAFFC.2014.2316163
    # Try arxiv mirror or preprint
    
    # [25] CK+ - Lucey 2010 - classic paper
    # DOI: 10.1109/CVPRW.2010.5543262 - IEEE paywalled
    
    # [48] Soloviev 2018 - Machine learning student engagement
    # DOI: 10.5937/SPSUNP1802079S - try direct
    ("[48]_Soloviev_2018_ML_Student_Engagement.pdf", "http://casopisi.junis.ni.ac.rs/index.php/SJState/article/download/3943/2634"),
]

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
            if len(data) < 5000:
                print(f"  WARNING: File too small ({len(data)} bytes), skipping")
            else:
                with open(filepath, 'wb') as f:
                    f.write(data)
                print(f"  OK: {len(data)} bytes")
        time.sleep(1)
    except Exception as e:
        print(f"  FAILED: {e}")

print("\nDone!")
