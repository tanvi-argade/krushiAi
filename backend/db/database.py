import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor
import json
import logging
from contextlib import contextmanager
from config import settings

logger = logging.getLogger("krushiai")

db_pool = None

def init_db_pool():
    global db_pool
    if db_pool is not None:
        return
    
    try:
        if settings.DATABASE_URL:
            url = settings.DATABASE_URL
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            logger.info("Initializing ThreadedConnectionPool using DATABASE_URL...")
            db_pool = ThreadedConnectionPool(
                minconn=1,
                maxconn=20,
                dsn=url,
                cursor_factory=RealDictCursor
            )
        else:
            logger.info("Initializing ThreadedConnectionPool using discrete variables...")
            db_pool = ThreadedConnectionPool(
                minconn=1,
                maxconn=20,
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                database=settings.DB_NAME,
                user=settings.DB_USER,
                password=settings.DB_PASSWORD,
                cursor_factory=RealDictCursor
            )
    except Exception as e:
        logger.error(f"Database connection pool initialization failed: {e}")
        raise

def close_db_pool():
    global db_pool
    if db_pool is not None:
        logger.info("Closing ThreadedConnectionPool...")
        db_pool.closeall()
        db_pool = None

@contextmanager
def get_db():
    global db_pool
    if db_pool is None:
        init_db_pool()
    
    conn = db_pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction error: {e}")
        raise
    finally:
        db_pool.putconn(conn)

def init_db():
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS query_history (
                        id SERIAL PRIMARY KEY,
                        module VARCHAR(50) NOT NULL,
                        input_data TEXT,
                        output_data TEXT,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.critical(f"Failed to initialize database schema: {e}")
        raise

def save_query(module: str, input_data: dict, output_data: dict):
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO query_history "
                    "(module, input_data, output_data) VALUES (%s, %s, %s)",
                    (module, 
                     json.dumps(input_data, default=str), 
                     json.dumps(output_data, default=str))
                )
    except Exception as e:
        logger.error(f"Failed to save query history for module '{module}': {e}")

def get_history(module: str = None, limit: int = 10):
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                if module:
                    cur.execute(
                        "SELECT id, module, input_data, output_data, timestamp "
                        "FROM query_history WHERE module = %s "
                        "ORDER BY id DESC LIMIT %s",
                        (module, limit)
                    )
                else:
                    cur.execute(
                        "SELECT id, module, input_data, output_data, timestamp "
                        "FROM query_history "
                        "ORDER BY id DESC LIMIT %s",
                        (limit,)
                    )
                rows = cur.fetchall()
                
        res = []
        for row in rows:
            d = dict(row)
            if d.get("timestamp"):
                d["timestamp"] = d["timestamp"].isoformat()
            res.append(d)
        return res
    except Exception as e:
        logger.error(f"Failed to retrieve query history: {e}")
        raise

