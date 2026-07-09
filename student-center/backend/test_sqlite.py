import sqlite3

conn = sqlite3.connect("minda_local.db")
c = conn.cursor()

# enable foreign keys
c.execute("PRAGMA foreign_keys = ON;")

# check if we have any live sessions
c.execute("SELECT id FROM live_sessions LIMIT 1")
row = c.fetchone()
if not row:
    print("No live sessions found")
else:
    session_id = row[0]
    print(f"Trying to delete session {session_id}")
    try:
        c.execute("DELETE FROM emotion_logs WHERE session_id = ?", (session_id,))
        c.execute("DELETE FROM live_sessions WHERE id = ?", (session_id,))
        conn.commit()
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

