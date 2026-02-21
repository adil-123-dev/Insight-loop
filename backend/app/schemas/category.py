"""
Category Schemas - Pydantic models for category validation

Schemas for:
- Creating categories
- Viewing categories
- Category responses
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CategoryBase(BaseModel):
    """Base category schema"""
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    """Schema for creating a category"""
    organization_id: int


class CategoryUpdate(BaseModel):
    """Schema for updating a category"""
    name: Optional[str] = None
    description: Optional[str] = None


class CategoryResponse(CategoryBase):
    """Schema for category response"""
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CategoryWithFormCount(CategoryResponse):
    """Schema for category with form count"""
    form_count: int
