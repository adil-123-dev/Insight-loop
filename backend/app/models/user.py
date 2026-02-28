from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    org_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Back-reference to the organization this user belongs to
    org = relationship("Organization", back_populates="users")

    # Deleting a user cascade-deletes their forms
    forms = relationship("Form", back_populates="instructor", cascade="all, delete-orphan", passive_deletes=True)

    # Responses are NOT deleted when user is deleted (student_id → SET NULL)
    responses = relationship("Response", back_populates="student", foreign_keys="Response.student_id")
