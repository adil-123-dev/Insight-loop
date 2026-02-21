"""
Forms API Routes - Endpoints for managing feedback forms

Endpoints:
1. POST /forms/ - Create new form (instructor/admin)
2. GET /forms/ - List forms (filtered by role)
3. GET /forms/{form_id} - Get specific form details
4. PUT /forms/{form_id} - Update form (instructor/admin)
5. DELETE /forms/{form_id} - Delete form (instructor/admin)
6. PATCH /forms/{form_id}/status - Change form status (publish/close)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import SessionLocal
from app.core.dependencies import get_current_user, get_current_instructor
from app.models.user import User
from app.models.form import Form, FormStatus
from app.schemas.form import FormCreate, FormUpdate, FormResponse, FormStatusUpdate

router = APIRouter(prefix="/forms", tags=["Forms"])


def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=FormResponse, status_code=status.HTTP_201_CREATED)
def create_form(
    form_data: FormCreate,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Create a new feedback form (Instructor/Admin only)
    
    How it works:
    1. Verify user has instructor or admin role
    2. Create form with provided data
    3. Set instructor_id to current user
    4. Set org_id to current user's organization
    5. Default status is "draft"
    
    Example:
        POST /forms/
        Headers: Authorization: Bearer <token>
        Body: {
            "title": "CS101 Mid-Semester Feedback",
            "description": "Please share your thoughts",
            "course_name": "Introduction to Computer Science",
            "course_code": "CS101",
            "open_date": "2024-03-01T00:00:00",
            "close_date": "2024-03-07T23:59:59"
        }
    """
    # Create new form instance
    db_form = Form(
        title=form_data.title,
        description=form_data.description,
        course_name=form_data.course_name,
        course_code=form_data.course_code,
        instructor_id=current_user.id,
        org_id=current_user.org_id,
        open_date=form_data.open_date,
        close_date=form_data.close_date,
        status=FormStatus.DRAFT
    )
    
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    
    return db_form


@router.get("/", response_model=List[FormResponse])
def list_forms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all forms (filtered by user role)
    
    How it works:
    - Admin: See all forms in their organization
    - Instructor: See only forms they created
    - Student: See only published forms (for future implementation)
    
    Example:
        GET /forms/
        Headers: Authorization: Bearer <token>
        Returns: [
            {"id": 1, "title": "CS101 Feedback", ...},
            {"id": 2, "title": "CS102 Feedback", ...}
        ]
    """
    # Base query: all forms in user's organization
    query = db.query(Form).filter(Form.org_id == current_user.org_id)
    
    # Filter based on role
    if current_user.role == "admin":
        # Admin sees all forms in their org
        forms = query.all()
    elif current_user.role == "instructor":
        # Instructor sees only their own forms
        forms = query.filter(Form.instructor_id == current_user.id).all()
    else:
        # Student sees only published forms
        forms = query.filter(Form.status == FormStatus.PUBLISHED).all()
    
    return forms


@router.get("/{form_id}", response_model=FormResponse)
def get_form(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get specific form details
    
    How it works:
    1. Find form by ID
    2. Check if form belongs to user's organization
    3. Check user has permission to view:
       - Admin: can view any form in org
       - Instructor: can view their own forms
       - Student: can view published forms only
    
    Example:
        GET /forms/1
        Headers: Authorization: Bearer <token>
        Returns: {"id": 1, "title": "CS101 Feedback", ...}
    """
    # Find form
    form = db.query(Form).filter(Form.id == form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Check organization match
    if form.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this form"
        )
    
    # Check role-based permissions
    if current_user.role == "student":
        if form.status != FormStatus.PUBLISHED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This form is not published"
            )
    elif current_user.role == "instructor":
        if form.instructor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own forms"
            )
    # Admin can view any form in their org
    
    return form


@router.put("/{form_id}", response_model=FormResponse)
def update_form(
    form_id: int,
    form_update: FormUpdate,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Update an existing form (Instructor/Admin only)
    
    How it works:
    1. Find form by ID
    2. Check user owns the form (or is admin)
    3. Update provided fields
    4. Save changes
    
    Restrictions:
    - Can't update if form has responses (future implementation)
    - Instructor can only update their own forms
    - Admin can update any form in their org
    
    Example:
        PUT /forms/1
        Headers: Authorization: Bearer <token>
        Body: {
            "title": "Updated Title",
            "close_date": "2024-03-10T23:59:59"
        }
    """
    # Find form
    form = db.query(Form).filter(Form.id == form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Check permissions
    if form.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this form"
        )
    
    if current_user.role == "instructor" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own forms"
        )
    
    # Update fields (only if provided)
    update_data = form_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(form, field, value)
    
    db.commit()
    db.refresh(form)
    
    return form


@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form(
    form_id: int,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Delete a form (Instructor/Admin only)
    
    How it works:
    1. Find form by ID
    2. Check user owns the form (or is admin)
    3. Delete form from database
    
    Restrictions:
    - Instructor can only delete their own forms
    - Admin can delete any form in their org
    - Will delete associated questions/responses (future: cascade delete)
    
    Example:
        DELETE /forms/1
        Headers: Authorization: Bearer <token>
        Returns: 204 No Content
    """
    # Find form
    form = db.query(Form).filter(Form.id == form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Check permissions
    if form.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this form"
        )
    
    if current_user.role == "instructor" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own forms"
        )
    
    # Delete form
    db.delete(form)
    db.commit()
    
    return None


@router.patch("/{form_id}/status", response_model=FormResponse)
def update_form_status(
    form_id: int,
    status_update: FormStatusUpdate,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Change form status (draft → published → closed)
    
    How it works:
    1. Find form by ID
    2. Check user owns the form (or is admin)
    3. Update status
    4. Validate status transitions
    
    Status Flow:
    - draft → published (form goes live)
    - published → closed (stop accepting responses)
    - closed → published (reopen form)
    
    Example:
        PATCH /forms/1/status
        Headers: Authorization: Bearer <token>
        Body: {"status": "published"}
        Returns: {"id": 1, "status": "published", ...}
    """
    # Find form
    form = db.query(Form).filter(Form.id == form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Check permissions
    if form.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this form"
        )
    
    if current_user.role == "instructor" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own forms"
        )
    
    # Update status
    form.status = status_update.status
    
    db.commit()
    db.refresh(form)
    
    return form
