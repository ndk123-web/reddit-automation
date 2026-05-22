import sqlite3 

conn = sqlite3.connect("autonova.db")

cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        subreddit TEXT,
        score INTEGER
    )
""")

cursor.execute("""
INSERT INTO leads (username, subreddit, score)
VALUES (?, ?, ?)
""", ("founder123", "startups", 8))

cursor.execute("SELECT * FROM leads")

rows = cursor.fetchall()

print(rows)

conn.commit()
conn.close()