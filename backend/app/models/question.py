"""
Question Model - Represents individual questions within a feedback form

A Question is a single item in a form that students answer. Each question has:
- Question text (the actual question being asked)
- Type (rating, text, multiple choice, yes/no)
- Order/position in the form
- Options (for multiple choice questions)
- Required flag (must be answered or optional)

Example:
    Question: "How clear were the lectures?"
    Type: rating (1-5 stars)
    Required: True
    Order: 1
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class QuestionType(str, enum.Enum):
    """
    Question Type Enum - Defines the type of answer expected
    
    rating: 1-5 star rating or numeric scale
    text: Open-ended text response
    mcq: Multiple choice question (select one option)
    yes_no: Binary yes/no question
    """
    RATING = "rating"
    TEXT = "text"
    MCQ = "mcq"
    YES_NO = "yes_no"


class Question(Base):
    """
    Question Database Model
    
    Represents a single question within a feedback form.
    """
    __tablename__ = "questions"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Relationship to Form
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    
    # Question Content
    question_text = Column(Text, nullable=False)
    question_type = Column(SQLEnum(QuestionType), nullable=False)
    
    # Question Configuration
    is_required = Column(Boolean, default=False, nullable=False)
    order = Column(Integer, nullable=False)  # Position in form (1, 2, 3...)
    
    # Options for MCQ (stored as JSON array)
    # Example: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    options = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships (will be used later for responses)
    # form = relationship("Form", back_populates="questions")
    # answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")
