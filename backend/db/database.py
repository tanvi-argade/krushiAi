import sqlite3
import json
import os
from contextlib import contextmanager
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'krushiai.db')

# Single persistent connection with check_same_thread=False
# Use context manager for safe access

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS query_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                module TEXT NOT NULL,
                input_data TEXT,
                output_data TEXT,
                timestamp TEXT DEFAULT (datetime('now', 'localtime'))
            )
        """)
    print("Database initialized.")

def save_query(module: str, input_data: dict, output_data: dict):
    try:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO query_history "
                "(module, input_data, output_data) VALUES (?, ?, ?)",
                (module, 
                 json.dumps(input_data, default=str), 
                 json.dumps(output_data, default=str))
            )
    except Exception as e:
        print(f"DB save error: {e}")

def get_history(module: str = None, limit: int = 10):
    with get_db() as conn:
        if module:
            rows = conn.execute(
                "SELECT * FROM query_history WHERE module = ? "
                "ORDER BY id DESC LIMIT ?",
                (module, limit)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM query_history "
                "ORDER BY id DESC LIMIT ?",
                (limit,)
            ).fetchall()
    return [dict(row) for row in rows]
