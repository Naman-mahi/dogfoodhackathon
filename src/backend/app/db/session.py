import os
import time
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.db.base import metadata

# Register all model tables on metadata
import app.db.models.user
import app.db.models.event
import app.db.models.track
import app.db.models.team
import app.db.models.project
import app.db.models.judge
import app.db.models.rubric
import app.db.models.score
import app.db.models.audit
import app.db.models.registration
import app.db.models.email_log

def get_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    retries = 10
    while retries > 0:
        try:
            eng = create_engine(db_url, pool_pre_ping=True)
            with eng.connect():
                pass
            return eng
        except Exception as e:
            retries -= 1
            time.sleep(2)
            if retries == 0:
                raise e

engine = get_engine()

def init_db():
    global engine
    if engine is None:
        engine = get_engine()
    metadata.create_all(engine)
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'submitted';"))
            conn.commit()
    except Exception as e:
        print(f"Schema upgrade check: {e}")
    return engine

