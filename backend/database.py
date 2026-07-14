"""
database.py — SQLite + PostgreSQL/Supabase database manager for YieldSmart
"""
import os
import sqlite3

DATABASE_URL = os.getenv("DATABASE_URL")

# Detect connection type
IS_POSTGRES = DATABASE_URL is not None and (
    DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://")
)

def get_db():
    if IS_POSTGRES:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    else:
        DB_PATH = os.path.join(os.path.dirname(__file__), "yieldsmart.db")
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

def execute_query(conn, sql: str, params: tuple = ()):
    if IS_POSTGRES:
        sql_pg = sql.replace("?", "%s")
        cursor = conn.cursor()
        cursor.execute(sql_pg, params)
        return cursor
    else:
        return conn.execute(sql, params)

def init_db():
    """Create tables if they don't exist."""
    conn = get_db()
    try:
        if IS_POSTGRES:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id            SERIAL PRIMARY KEY,
                    name          VARCHAR(255) NOT NULL,
                    email         VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    city          VARCHAR(255) NOT NULL,
                    avatar_initials VARCHAR(10) NOT NULL DEFAULT 'FA',
                    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS scan_history (
                    id          SERIAL PRIMARY KEY,
                    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    plant       VARCHAR(255) NOT NULL,
                    disease     VARCHAR(255) NOT NULL,
                    severity    VARCHAR(50) NOT NULL,
                    confidence  DOUBLE PRECISION NOT NULL,
                    result_json TEXT NOT NULL,
                    scanned_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_scan_history_user ON scan_history(user_id, scanned_at DESC);
            """)
            conn.commit()
        else:
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
    finally:
        conn.close()

def save_scan(user_id: int, plant: str, disease: str, severity: str,
              confidence: float, result_json: str):
    conn = get_db()
    try:
        execute_query(
            conn,
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
        cursor = execute_query(
            conn,
            """SELECT id, plant, disease, severity, confidence, result_json, scanned_at
               FROM scan_history WHERE user_id = ?
               ORDER BY scanned_at DESC LIMIT ?""",
            (user_id, limit)
        )
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def get_scan_stats(user_id: int) -> dict:
    conn = get_db()
    try:
        total = execute_query(
            conn, "SELECT COUNT(*) as c FROM scan_history WHERE user_id = ?", (user_id,)
        ).fetchone()["c"]
        diseases = execute_query(
            conn, "SELECT COUNT(*) as c FROM scan_history WHERE user_id = ? AND severity != 'none'",
            (user_id,)
        ).fetchone()["c"]
        return {"total_scans": total, "diseases_found": diseases, "healthy": total - diseases}
    finally:
        conn.close()
