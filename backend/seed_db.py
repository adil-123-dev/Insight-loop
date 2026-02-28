"""
Seed the database with an initial organization and users.
Run with: py seed_db.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("DATABASE_URL", "postgresql://insightloop:dev_password@localhost:5433/insightloop_db")

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.organization import Organization
from app.models.user import User

db = SessionLocal()

try:
    # ── 1. Create organization if it doesn't exist ─────────────────────────
    org = db.query(Organization).filter(Organization.subdomain == "insightloop").first()
    if not org:
        org = Organization(name="InsightLoop University", subdomain="insightloop", description="Default demo organization")
        db.add(org)
        db.commit()
        db.refresh(org)
        print(f"[OK] Organization created: '{org.name}' (id={org.id})")
    else:
        print(f"[--] Organization already exists: '{org.name}' (id={org.id})")

    # ── 2. Seed users ──────────────────────────────────────────────────────
    seed_users = [
        {"email": "Ahmad@gmail.com",   "password": "student123", "role": "student"},
        {"email": "admin@insightloop.com", "password": "admin123",  "role": "admin"},
        {"email": "instructor@insightloop.com", "password": "instructor123", "role": "instructor"},
    ]

    for u in seed_users:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user = User(
                email=u["email"],
                hashed_password=hash_password(u["password"]),
                org_id=org.id,
                role=u["role"]
            )
            db.add(user)
            db.commit()
            print(f"[OK] User created: {u['email']} / {u['password']}  (role={u['role']})")
        else:
            print(f"[--] User already exists: {u['email']}")

    print("\nSeeding complete!")
    print("\nLogin credentials:")
    for u in seed_users:
        print(f"   {u['email']}  |  password: {u['password']}  |  role: {u['role']}")

finally:
    db.close()
