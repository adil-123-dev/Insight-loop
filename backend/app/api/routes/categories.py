"""
Categories API Routes - Endpoints for managing feedback form categories

Categories help organize forms by:
- Department (CS, Math, Physics)
- Course Level (Undergraduate, Graduate)
- Semester (Fall 2026, Spring 2026)
- Type (Mid-term, Final, Course)

Endpoints:
1. POST /categories/ - Create a new category
2. GET /categories/ - List all categories
3. DELETE /categories/{id} - Delete a category
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import SessionLocal
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.category import Category
from app.models.form import Form
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryWithFormCount
)

router = APIRouter(tags=["Categories"])


def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/categories/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new category for organizing feedback forms
    
    **Access:** Admin only
    
    **Request Body:**
    - `name`: Category name (e.g., "Computer Science", "Fall 2026")
    - `description`: Optional description
    - `organization_id`: Organization this category belongs to
    
    **Example Categories:**
    - Department: "Computer Science", "Mathematics", "Physics"
    - Level: "Undergraduate", "Graduate", "PhD"
    - Semester: "Fall 2026", "Spring 2026"
    - Type: "Mid-term Feedback", "Final Evaluation"
    
    **Returns:** Created category with ID and timestamps
    """
    # Verify admin belongs to the organization
    if current_user.organization_id != category_data.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create categories for your organization"
        )
    
    # Check if category name already exists in organization
    existing_category = db.query(Category).filter(
        Category.name == category_data.name,
        Category.organization_id == category_data.organization_id
    ).first()
    
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category '{category_data.name}' already exists in this organization"
        )
    
    # Create new category
    db_category = Category(
        name=category_data.name,
        description=category_data.description,
        organization_id=category_data.organization_id
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category


@router.get("/categories/", response_model=List[CategoryWithFormCount])
def list_categories(
    organization_id: Optional[int] = Query(None, description="Filter by organization"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all categories with optional filtering
    
    **Access:** Any authenticated user
    
    **Query Parameters:**
    - `organization_id`: Optional - Filter categories by organization
    
    **Returns:** List of categories with form counts
    
    **Features:**
    - Shows number of forms in each category
    - Filtered by organization if specified
    - If no organization_id provided, shows user's organization categories
    
    **Use Cases:**
    - Display category filter dropdown in form list
    - Show category statistics
    - Organize forms by department/semester
    """
    # If no organization_id specified, use current user's organization
    if organization_id is None:
        organization_id = current_user.organization_id
    else:
        # If organization_id is specified, verify user has access
        if current_user.role != "admin" and current_user.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view categories from your organization"
            )
    
    # Get all categories for the organization
    categories = db.query(Category).filter(
        Category.organization_id == organization_id
    ).order_by(Category.name).all()
    
    # Add form count to each category
    result = []
    for category in categories:
        form_count = db.query(Form).filter(Form.category_id == category.id).count()
        
        category_dict = {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "organization_id": category.organization_id,
            "created_at": category.created_at,
            "updated_at": category.updated_at,
            "form_count": form_count
        }
        result.append(CategoryWithFormCount(**category_dict))
    
    return result


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a category
    
    **Access:** Admin only
    
    **Path Parameters:**
    - `category_id`: ID of category to delete
    
    **Behavior:**
    - Deletes the category
    - Forms associated with this category will have `category_id` set to NULL
    - Cannot delete if it would leave forms orphaned (depending on your business logic)
    
    **Returns:** 204 No Content on success
    
    **Errors:**
    - 404: Category not found
    - 403: Not authorized (not admin or wrong organization)
    - 409: Category still has associated forms (optional validation)
    """
    # Get the category
    category = db.query(Category).filter(Category.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category {category_id} not found"
        )
    
    # Verify admin belongs to the same organization
    if current_user.organization_id != category.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete categories from your organization"
        )
    
    # Optional: Check if category has associated forms
    form_count = db.query(Form).filter(Form.category_id == category_id).count()
    if form_count > 0:
        # Option 1: Prevent deletion
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete category. It has {form_count} associated form(s). Please reassign or delete those forms first."
        )
        
        # Option 2: Set category_id to NULL in forms (uncomment if you prefer this)
        # db.query(Form).filter(Form.category_id == category_id).update({"category_id": None})
    
    # Delete the category
    db.delete(category)
    db.commit()
    
    return None
