from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from alembic.config import Config
from alembic import command
import logging
import os

# ⚠️ Import ALL models first so SQLAlchemy can resolve all relationship() string refs
import app.models  # noqa: F401

from app.api.routes import organization
from app.api.routes import auth
from app.api.routes import forms
from app.api.routes import questions
from app.api.routes import responses
from app.api.routes import analytics
from app.api.routes import categories

logger = logging.getLogger(__name__)


def run_migrations():
    """Auto-run Alembic migrations on startup so the DB is always up to date."""
    try:
        alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
        alembic_cfg.set_main_option(
            "script_location",
            os.path.join(os.path.dirname(__file__), "..", "migrations")
        )
        # Override DB URL from env var (Railway injects DATABASE_URL)
        db_url = os.environ.get(
            "DATABASE_URL",
            "postgresql://insightloop:dev_password@localhost:5433/insightloop_db"
        )
        # Fix Railway's postgres:// prefix
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        alembic_cfg.set_main_option("sqlalchemy.url", db_url)
        command.upgrade(alembic_cfg, "head")
        logger.info("✅ Database migrations applied successfully.")
    except Exception as e:
        logger.warning(f"⚠️  Migration warning (may be harmless): {e}")


run_migrations()

app = FastAPI(
    title="InsightLoop API",
    version="1.0.0",
    description="Backend for InsightLoop feedback intelligence system"
)

# Allow all origins — frontend URL will be restricted via Railway env var in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(organization.router)
app.include_router(auth.router)
app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(responses.router)
app.include_router(analytics.router)
app.include_router(categories.router)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "message": "Welcome to InsightLoop API!",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
