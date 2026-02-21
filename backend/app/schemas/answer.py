"""
Answer Pydantic Schemas - Input/Output validation for Answer API

These schemas define:
- What data is required when submitting an answer (AnswerCreate)
- What data is returned in API responses (AnswerResponse)
"""

from pydantic import BaseModel, Field
from datetime import datetime


class AnswerCreate(BaseModel):
    """
    Schema for creating/submitting an answer
    
    Used when student submits a response to a question.
    
    Example (Rating):
        {
            "question_id": 1,
            "answer_value": "5"
        }
    
    Example (Text):
        {
            "question_id": 2,
            "answer_value": "The lectures were very clear and helpful"
        }
    
    Example (MCQ):
        {
            "question_id": 3,
            "answer_value": "Hands-on Labs"
        }
    
    Example (Yes/No):
        {
            "question_id": 4,
            "answer_value": "yes"
        }
    """
    question_id: int = Field(..., description="ID of the question being answered")
    answer_value: str = Field(..., min_length=1, description="The answer content")


class AnswerResponse(BaseModel):
    """
    Schema for answer data returned in API responses
    
    Example Response:
        {
            "id": 1,
            "response_id": 10,
            "question_id": 1,
            "answer_value": "5",
            "created_at": "2024-03-05T14:30:00"
        }
    """
    id: int
    response_id: int
    question_id: int
    answer_value: str
    created_at: datetime
    
    class Config:
        from_attributes = True  # Pydantic v2
