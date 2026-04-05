import requests
import zipfile
import os

# Create dummy zip
with open("dummy.html", "w") as f:
    f.write("<h1>Hello SCORM</h1>")
with zipfile.ZipFile('dummy.zip', 'w') as zipf:
    zipf.write('dummy.html')

# Hit endpoint
# We need a token. We can bypass auth or we can't test it.
