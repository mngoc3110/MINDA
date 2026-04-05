import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.drive_service import drive_service

def check_folders():
    if not drive_service.service:
        print("No drive_service")
        return
        
    query = f"mimeType='application/vnd.google-apps.folder' and name='MINDA_Storage' and trashed=false"
    results = drive_service.service.files().list(q=query, fields="files(id, name, owners, shared)").execute()
    items = results.get('files', [])
    
    print(f"Found {len(items)} folders named MINDA_Storage:")
    for item in items:
        owner = item.get('owners', [{}])[0].get('emailAddress', 'unknown')
        shared = item.get('shared', False)
        print(f"ID: {item.get('id')} - Owner: {owner} - Shared: {shared}")

if __name__ == "__main__":
    check_folders()
