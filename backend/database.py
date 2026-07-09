"""
database.py — SQLite database setup for YieldSmart
Tables: users, scan_history
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "yieldsmart.db")

def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    """Create tables if they don't exist."""
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT    NOT NULL,
            email         TEXT    UNIQUE NOT NULL,
            password_hash TEXT    NOT NULL,
            city          TEXT    NOT NULL,
            avatar_initials TEXT  NOT NULL DEFAULT 'FA',
            created_at    TEXT    DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS scan_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            plant       TEXT    NOT NULL,
            disease     TEXT    NOT NULL,
            severity    TEXT    NOT NULL,
            confidence  REAL    NOT NULL,
            result_json TEXT    NOT NULL,
            scanned_at  TEXT    DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_scan_history_user
            ON scan_history(user_id, scanned_at DESC);
    """)
    conn.commit()
    conn.close()

def save_scan(user_id: int, plant: str, disease: str, severity: str,
              confidence: float, result_json: str):
    conn = get_db()
    try:
        conn.execute(
            """INSERT INTO scan_history
               (user_id, plant, disease, severity, confidence, result_json)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, plant, disease, severity, confidence, result_json)
        )
        conn.commit()
    finally:
        conn.close()

def get_history(user_id: int, limit: int = 20) -> list:
    conn = get_db()
    try:
        rows = conn.execute(
            """SELECT id, plant, disease, severity, confidence, result_json, scanned_at
               FROM scan_history WHERE user_id = ?
               ORDER BY scanned_at DESC LIMIT ?""",
            (user_id, limit)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def get_scan_stats(user_id: int) -> dict:
    conn = get_db()
    try:
        total = conn.execute(
            "SELECT COUNT(*) as c FROM scan_history WHERE user_id = ?", (user_id,)
        ).fetchone()["c"]
        diseases = conn.execute(
            "SELECT COUNT(*) as c FROM scan_history WHERE user_id = ? AND severity != 'none'",
            (user_id,)
        ).fetchone()["c"]
        return {"total_scans": total, "diseases_found": diseases, "healthy": total - diseases}
    finally:
        conn.close()
