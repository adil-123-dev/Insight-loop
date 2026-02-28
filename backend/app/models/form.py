"""
Form Model - Represents feedback forms created by instructors

A Form is like a survey/questionnaire that instructors create to collect
feedback from students about a course. Each form has:
- Basic info (title, description, course details)
- Time constraints (open_date, close_date)
- Status (draft, published, closed)
- Ownership (which instructor created it, which org it belongs to)

Example:
    Form: "CS101 Mid-Semester Feedback"
    Description: "Please share your thoughts on the first half of the course"
    Course: "Introduction to Computer Science (CS101)"
    Status: "published"
    Open: March 1, 2024
    Close: March 7, 2024
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class FormStatus(str, enum.Enum):
    """
    Form Status Enum - Defines the lifecycle of a form
    
    draft: Form is being created, not visible to students
    published: Form is live and accepting responses
    closed: Form is no longer accepting responses
    """
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"


class Form(Base):
    """
    Form Database Model
    
    Represents a feedback form in the system.
    """
    __tablename__ = "forms"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Form Content
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Course Information
    course_name = Column(String(255), nullable=False)
    course_code = Column(String(50), nullable=False)
    
    # Relationships
    instructor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    org_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    # Status & Timing
    status = Column(SQLEnum(FormStatus), default=FormStatus.DRAFT, nullable=False)
    open_date = Column(DateTime, nullable=True)
    close_date = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships with cascade delete
    instructor = relationship("User", back_populates="forms")
    org = relationship("Organization", back_populates="forms")
    questions = relationship("Question", back_populates="form", cascade="all, delete-orphan", passive_deletes=True)
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan", passive_deletes=True)
