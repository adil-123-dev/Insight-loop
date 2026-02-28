from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    subdomain = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Cascade: deleting an org deletes all its users, forms, categories
    users = relationship("User", back_populates="org", cascade="all, delete-orphan", passive_deletes=True)
    forms = relationship("Form", back_populates="org", cascade="all, delete-orphan", passive_deletes=True)
    categories = relationship("Category", back_populates="organization", cascade="all, delete-orphan", passive_deletes=True)
