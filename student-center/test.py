import requests
import sqlite3

# Get the first token
conn = sqlite3.connect('/var/www/minda/student-center/backend/sql_app.db')
cursor = conn.cursor()
cursor.execute("SELECT token FROM users LIMIT 1")
token = cursor.fetchone()[0]

res = requests.get('http://localhost:8000/api/courses/5/curriculum', headers={'Authorization': f'Bearer {token}'})
print(res.text)
