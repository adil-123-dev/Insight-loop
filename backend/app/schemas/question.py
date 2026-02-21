"""
Question Pydantic Schemas - Input/Output validation for Question API

These schemas define:
- What data is required when creating a question (QuestionCreate)
- What data can be updated (QuestionUpdate)
- What data is returned in API responses (QuestionResponse)
- How to reorder questions (QuestionReorder)
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.question import QuestionType


class QuestionBase(BaseModel):
    """Base schema with common question fields"""
    question_text: str = Field(..., min_length=1, description="The question text")
    question_type: QuestionType = Field(..., description="Type of question (rating, text, mcq, yes_no)")
    is_required: bool = Field(default=False, description="Whether answer is required")
    options: Optional[List[str]] = Field(None, description="Options for MCQ questions")


class QuestionCreate(QuestionBase):
    """
    Schema for creating a new question
    
    Order is automatically assigned based on existing questions.
    
    Example:
        {
            "question_text": "How clear were the lectures?",
            "question_type": "rating",
            "is_required": true,
            "options": null
        }
    
    Example (MCQ):
        {
            "question_text": "Which teaching method do you prefer?",
            "question_type": "mcq",
            "is_required": true,
            "options": ["Lectures", "Hands-on Labs", "Group Discussions", "Self-Study"]
        }
    """
    pass


class QuestionUpdate(BaseModel):
    """
    Schema for updating an existing question
    
    All fields are optional - only include what you want to change.
    
    Example:
        {
            "question_text": "Updated question text",
            "is_required": false
        }
    """
    question_text: Optional[str] = Field(None, min_length=1)
    question_type: Optional[QuestionType] = None
    is_required: Optional[bool] = None
    options: Optional[List[str]] = None


class QuestionReorderItem(BaseModel):
    """Single item in reorder request"""
    id: int = Field(..., description="Question ID")
    order: int = Field(..., description="New position (1, 2, 3...)")


class QuestionReorder(BaseModel):
    """
    Schema for reordering questions
    
    Provide array of question IDs with their new positions.
    
    Example:
        {
            "questions": [
                {"id": 3, "order": 1},
                {"id": 1, "order": 2},
                {"id": 2, "order": 3}
            ]
        }
    """
    questions: List[QuestionReorderItem] = Field(..., description="Array of questions with new order")


class QuestionResponse(QuestionBase):
    """
    Schema for question data returned in API responses
    
    Includes all question data plus:
    - id
    - form_id
    - order
    - timestamps
    
    Example Response:
        {
            "id": 1,
            "form_id": 5,
            "question_text": "How clear were the lectures?",
            "question_type": "rating",
            "is_required": true,
            "order": 1,
            "options": null,
            "created_at": "2024-02-15T10:30:00",
            "updated_at": "2024-02-15T10:30:00"
        }
    """
    id: int
    form_id: int
    order: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Pydantic v2 (replaces orm_mode)
