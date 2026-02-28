"""
Questions API Routes - Endpoints for managing questions within forms

Endpoints:
1. POST /forms/{form_id}/questions/ - Add question to form (instructor/admin)
2. GET /forms/{form_id}/questions/ - List all questions in form
3. PUT /questions/{question_id} - Update question (instructor/admin)
4. DELETE /questions/{question_id} - Delete question (instructor/admin)
5. PATCH /questions/reorder - Reorder questions (instructor/admin)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import SessionLocal
from app.core.dependencies import get_current_user, get_current_instructor
from app.models.user import User
from app.models.form import Form
from app.models.question import Question
from app.schemas.question import (
    QuestionCreate, 
    QuestionUpdate, 
    QuestionResponse, 
    QuestionReorder
)

router = APIRouter(tags=["Questions"])


def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/forms/{form_id}/questions/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def add_question_to_form(
    form_id: int,
    question_data: QuestionCreate,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Add a new question to a form (Instructor/Admin only)
    
    How it works:
    1. Verify form exists and user has permission
    2. Calculate next order number (max order + 1)
    3. Create question with provided data
    4. Return created question
    
    Example:
        POST /forms/1/questions/
        Headers: Authorization: Bearer <token>
        Body: {
            "question_text": "How clear were the lectures?",
            "question_type": "rating",
            "is_required": true
        }
    """
    # Find form
    form = db.query(Form).filter(Form.id == form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
      # Check permissions (user must own form or be admin)
    # Admin bypasses org check entirely — they can manage cross-org forms
    if current_user.role != "admin":
        if form.org_id != current_user.org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this form"
            )
    
    if current_user.role == "instructor" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only add questions to your own forms"
        )
    
    # Calculate next order number
    max_order = db.query(Question).filter(Question.form_id == form_id).count()
    next_order = max_order + 1
    
    # Validate MCQ has options
    if question_data.question_type == "mcq" and not question_data.options:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Multiple choice questions must have options"
        )
    
    # Create question
    db_question = Question(
        form_id=form_id,
        question_text=question_data.question_text,
        question_type=question_data.question_type,
        is_required=question_data.is_required,
        order=next_order,
        options=question_data.options
    )
    
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    return db_question


@router.get("/forms/{form_id}/questions/", response_model=List[QuestionResponse])
def list_form_questions(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all questions in a form (ordered by position)
    
    How it works:
    1. Verify form exists and user has access
    2. Fetch all questions ordered by position
    3. Return questions array
    
    Access rules:
    - Admin: can view questions from any form in their org
    - Instructor: can view questions from their own forms
    - Student: can view questions from published forms
    
    Example:
        GET /forms/1/questions/
        Headers: Authorization: Bearer <token>
        Returns: [
            {"id": 1, "question_text": "How clear were the lectures?", "order": 1, ...},
            {"id": 2, "question_text": "Rate the course materials", "order": 2, ...}
        ]
    """
    # Find form
    form = db.query(Form).filter(Form.id == form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
      # Check organization match
    # Admin bypasses org check — they can view questions on cross-org forms
    if current_user.role != "admin":
        if form.org_id != current_user.org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this form"
            )
    
    # Check role-based permissions
    if current_user.role == "student":
        if form.status != "published":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This form is not published"
            )
    elif current_user.role == "instructor":
        if form.instructor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view questions from your own forms"
            )
    # Admin can view any form in their org
    
    # Get questions ordered by position
    questions = db.query(Question).filter(
        Question.form_id == form_id
    ).order_by(Question.order).all()
    
    return questions


@router.put("/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    question_update: QuestionUpdate,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Update an existing question (Instructor/Admin only)
    
    How it works:
    1. Find question by ID
    2. Verify user owns the form (or is admin)
    3. Update provided fields
    4. Save changes
    
    Example:
        PUT /questions/1
        Headers: Authorization: Bearer <token>
        Body: {
            "question_text": "Updated: How clear were the lectures?",
            "is_required": false
        }
    """
    # Find question
    question = db.query(Question).filter(Question.id == question_id).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Get form to check permissions
    form = db.query(Form).filter(Form.id == question.form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
      # Check permissions
    # Admin bypasses org check — they can update questions on cross-org forms
    if current_user.role != "admin":
        if form.org_id != current_user.org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this form"
            )
    
    if current_user.role == "instructor" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update questions in your own forms"
        )
    
    # Update fields (only if provided)
    update_data = question_update.model_dump(exclude_unset=True)
    
    # Validate MCQ has options if type is being changed to mcq
    if "question_type" in update_data and update_data["question_type"] == "mcq":
        options = update_data.get("options", question.options)
        if not options:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Multiple choice questions must have options"
            )
    
    for field, value in update_data.items():
        setattr(question, field, value)
    
    db.commit()
    db.refresh(question)
    
    return question


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Delete a question (Instructor/Admin only)
    
    How it works:
    1. Find question by ID
    2. Verify user owns the form (or is admin)
    3. Delete question from database
    4. Reorder remaining questions to fill gap
    
    Example:
        DELETE /questions/1
        Headers: Authorization: Bearer <token>
        Returns: 204 No Content
    """
    # Find question
    question = db.query(Question).filter(Question.id == question_id).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Get form to check permissions
    form = db.query(Form).filter(Form.id == question.form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
      # Check permissions
    # Admin bypasses org check — they can delete questions on cross-org forms
    if current_user.role != "admin":
        if form.org_id != current_user.org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this form"
            )
    
    if current_user.role == "instructor" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete questions from your own forms"
        )
    
    # Store order before deletion
    deleted_order = question.order
    form_id = question.form_id
    
    # Delete question
    db.delete(question)
    db.commit()
    
    # Reorder remaining questions (decrement order for questions after deleted one)
    remaining_questions = db.query(Question).filter(
        Question.form_id == form_id,
        Question.order > deleted_order
    ).all()
    
    for q in remaining_questions:
        q.order -= 1
    
    db.commit()
    
    return None


@router.patch("/questions/reorder", response_model=List[QuestionResponse])
def reorder_questions(
    reorder_data: QuestionReorder,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Reorder questions within a form (Instructor/Admin only)
    
    How it works:
    1. Validate all questions exist and belong to same form
    2. Verify user owns the form (or is admin)
    3. Update order for each question
    4. Return updated questions
    
    Example:
        PATCH /questions/reorder
        Headers: Authorization: Bearer <token>
        Body: {
            "questions": [
                {"id": 3, "order": 1},
                {"id": 1, "order": 2},
                {"id": 2, "order": 3}
            ]
        }
    """
    if not reorder_data.questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No questions provided"
        )
    
    # Get all question IDs
    question_ids = [q.id for q in reorder_data.questions]
    
    # Find all questions
    questions = db.query(Question).filter(Question.id.in_(question_ids)).all()
    
    if len(questions) != len(question_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more questions not found"
        )
    
    # Verify all questions belong to same form
    form_ids = set(q.form_id for q in questions)
    if len(form_ids) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All questions must belong to the same form"
        )
    
    # Get form to check permissions
    form_id = list(form_ids)[0]
    form = db.query(Form).filter(Form.id == form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
      # Check permissions
    # Admin bypasses org check — they can reorder questions on cross-org forms
    if current_user.role != "admin":
        if form.org_id != current_user.org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this form"
            )
    
    if current_user.role == "instructor" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only reorder questions in your own forms"
        )
    
    # Create mapping of question_id -> new_order
    order_map = {item.id: item.order for item in reorder_data.questions}
    
    # Update order for each question
    for question in questions:
        question.order = order_map[question.id]
    
    db.commit()
    
    # Return updated questions ordered by new position
    updated_questions = db.query(Question).filter(
        Question.form_id == form_id
    ).order_by(Question.order).all()
    
    return updated_questions
