"""
Response Pydantic Schemas - Input/Output validation for Response API

These schemas define:
- What data is required when submitting a response (ResponseCreate)
- What data is returned in API responses (ResponseResponse, ResponseSummary)
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from app.schemas.answer import AnswerCreate, AnswerResponse


class ResponseCreate(BaseModel):
    """
    Schema for submitting a complete feedback response
    
    Student submits all answers at once.
    
    Example:
        {
            "is_anonymous": false,
            "answers": [
                {"question_id": 1, "answer_value": "5"},
                {"question_id": 2, "answer_value": "The lectures were excellent"},
                {"question_id": 3, "answer_value": "Hands-on Labs"},
                {"question_id": 4, "answer_value": "yes"}
            ]
        }
    """
    is_anonymous: bool = Field(default=False, description="Submit anonymously (hide identity)")
    answers: List[AnswerCreate] = Field(..., min_length=1, description="Array of answers to all questions")


class ResponseSummary(BaseModel):
    """
    Schema for response summary (list view)
    
    Used when listing all responses - doesn't include full answer details.
    
    Example Response:
        {
            "id": 10,
            "form_id": 1,
            "student_id": 5,
            "student_email": "john@example.com",
            "submitted_at": "2024-03-05T14:30:00",
            "is_anonymous": false,
            "answer_count": 10
        }
    """
    id: int
    form_id: int
    student_id: Optional[int] = None  # Null if anonymous
    student_email: Optional[str] = None  # Null if anonymous
    submitted_at: datetime
    is_anonymous: bool
    answer_count: int
    
    class Config:
        from_attributes = True


class ResponseDetail(BaseModel):
    """
    Schema for detailed response (single view)
    
    Includes all answers with question text.
    
    Example Response:
        {
            "id": 10,
            "form_id": 1,
            "student_id": 5,
            "student_email": "john@example.com",
            "submitted_at": "2024-03-05T14:30:00",
            "is_anonymous": false,
            "answers": [
                {
                    "id": 100,
                    "question_id": 1,
                    "answer_value": "5",
                    "created_at": "2024-03-05T14:30:00"
                },
                ...
            ]
        }
    """
    id: int
    form_id: int
    student_id: Optional[int] = None  # Null if anonymous
    student_email: Optional[str] = None  # Null if anonymous
    submitted_at: datetime
    is_anonymous: bool
    answers: List[AnswerResponse]
    
    class Config:
        from_attributes = True


class ResponseSubmitted(BaseModel):
    """
    Schema for successful submission confirmation
    
    Returned immediately after student submits feedback.
    
    Example Response:
        {
            "id": 10,
            "form_id": 1,
            "submitted_at": "2024-03-05T14:30:00",
            "message": "Thank you for your feedback!"
        }
    """
    id: int
    form_id: int
    submitted_at: datetime
    message: str = "Thank you for your feedback!"
    
    class Config:
        from_attributes = True
