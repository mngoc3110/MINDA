import requests
import os

BASE_URL = "http://14.225.206.241:8000"
TOKEN = "darber3110@gmail.com" # Just need to get a new token

def login():
    url = f"{BASE_URL}/api/auth/login"
    data = {"username": "darber3110@gmail.com", "password": "Bin@31102004"}
    res = requests.post(url, data=data)
    return res.json().get("access_token")

token = login()
filepath = "/Users/macbook/Desktop/coding/projects/MINDA/main.tex"
url = f"{BASE_URL}/api/assignments/parse-upload"
headers = {"Authorization": f"Bearer {token}"}
filename = os.path.basename(filepath)
with open(filepath, 'rb') as f:
    files = {"file": (filename, f, "text/x-tex")}
    res = requests.post(url, headers=headers, files=files)
    print("STATUS:", res.status_code)
    print("JSON:", res.json())
