@echo off
echo ==========================================
echo   Starting InsightLoop Backend
echo ==========================================

:: Start PostgreSQL via Docker Compose (from project root)
cd /d "%~dp0.."
echo [1/3] Starting PostgreSQL database...
docker compose up -d db
timeout /t 5 /nobreak >nul

:: Run migrations
cd /d "%~dp0"
echo [2/3] Running database migrations...
set DATABASE_URL=postgresql://insightloop:dev_password@localhost:5433/insightloop_db
py -m alembic upgrade head

:: Seed database (safe to run multiple times)
echo [3/3] Seeding database...
py seed_db.py

:: Start backend
echo.
echo Starting FastAPI server on http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
