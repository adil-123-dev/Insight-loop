"""
Form Pydantic Schemas - Input/Output validation for Form API

These schemas define:
- What data is required when creating a form (FormCreate)
- What data can be updated (FormUpdate)
- What data is returned in API responses (FormResponse)
- How to change form status (FormStatusUpdate)
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.form import FormStatus


class FormBase(BaseModel):
    """Base schema with common form fields"""
    title: str = Field(..., min_length=1, max_length=255, description="Form title")
    description: Optional[str] = Field(None, description="Detailed description of the form")
    course_name: str = Field(..., min_length=1, max_length=255, description="Name of the course")
    course_code: str = Field(..., min_length=1, max_length=50, description="Course code (e.g., CS101)")
    category_id: Optional[int] = Field(None, description="Category ID for organizing forms")
    open_date: Optional[datetime] = Field(None, description="When form opens for responses")
    close_date: Optional[datetime] = Field(None, description="When form closes for responses")


class FormCreate(FormBase):
    """
    Schema for creating a new form
    
    Example:
        {
            "title": "CS101 Mid-Semester Feedback",
            "description": "Please share your thoughts",
            "course_name": "Introduction to Computer Science",
            "course_code": "CS101",
            "open_date": "2024-03-01T00:00:00",
            "close_date": "2024-03-07T23:59:59"
        }
    """
    pass


class FormUpdate(BaseModel):
    """
    Schema for updating an existing form
    
    All fields are optional - only include what you want to change.
    
    Example:
        {
            "title": "Updated Title",
            "close_date": "2024-03-10T23:59:59"
        }
    """
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    course_name: Optional[str] = Field(None, min_length=1, max_length=255)
    course_code: Optional[str] = Field(None, min_length=1, max_length=50)
    category_id: Optional[int] = None
    open_date: Optional[datetime] = None
    close_date: Optional[datetime] = None


class FormStatusUpdate(BaseModel):
    """
    Schema for changing form status
    
    Example:
        {"status": "published"}
    """
    status: FormStatus = Field(..., description="New status for the form")


class FormResponse(FormBase):
    """
    Schema for form data returned in API responses
    
    Includes all form data plus:
    - id
    - instructor_id
    - org_id
    - status
    - timestamps
    
    Example Response:
        {
            "id": 1,
            "title": "CS101 Mid-Semester Feedback",
            "description": "Please share your thoughts",
            "course_name": "Introduction to Computer Science",
            "course_code": "CS101",
            "instructor_id": 2,
            "org_id": 1,
            "status": "published",
            "open_date": "2024-03-01T00:00:00",
            "close_date": "2024-03-07T23:59:59",            "created_at": "2024-02-15T10:30:00",
            "updated_at": "2024-02-15T10:30:00"
        }
    """
    id: int
    instructor_id: int
    org_id: int
    category_id: Optional[int]
    status: FormStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Pydantic v2 (replaces orm_mode)
