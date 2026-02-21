"""
Responses API Routes - Endpoints for submitting and viewing feedback responses

Endpoints:
1. POST /forms/{form_id}/responses/ - Submit feedback response (student)
2. GET /forms/{form_id}/responses/ - List all responses (instructor/admin)
3. GET /responses/{response_id} - Get specific response details (instructor/admin)
4. GET /forms/{form_id}/responses/export - Export responses as CSV (instructor/admin)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import io
import csv
from app.core.database import SessionLocal
from app.core.dependencies import get_current_user, get_current_instructor
from app.models.user import User
from app.models.form import Form, FormStatus
from app.models.question import Question
from app.models.response import Response
from app.models.answer import Answer
from app.schemas.response import (
    ResponseCreate,
    ResponseSummary,
    ResponseDetail,
    ResponseSubmitted
)

router = APIRouter(tags=["Responses"])


def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/forms/{form_id}/responses/", response_model=ResponseSubmitted, status_code=status.HTTP_201_CREATED)
def submit_feedback_response(
    form_id: int,
    response_data: ResponseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a feedback response (Any authenticated user - typically student)
    
    How it works:
    1. Verify form exists and is published
    2. Check form is within date range
    3. Validate all required questions are answered
    4. Check student hasn't already submitted
    5. Create response + all answers in transaction
    6. Return confirmation
    
    Example:
        POST /forms/1/responses/
        Headers: Authorization: Bearer <token>
        Body: {
            "is_anonymous": false,
            "answers": [
                {"question_id": 1, "answer_value": "5"},
                {"question_id": 2, "answer_value": "Great course!"}
            ]
        }
    """
    # Step 1: Find form
    form = db.query(Form).filter(Form.id == form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Step 2: Check form belongs to same organization
    if form.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this form"
        )
    
    # Step 3: Check form is published
    if form.status != FormStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This form is not currently accepting responses"
        )
    
    # Step 4: Check form is within date range
    now = datetime.utcnow()
    if form.open_date and now < form.open_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This form opens on {form.open_date.strftime('%Y-%m-%d %H:%M')}"
        )
    if form.close_date and now > form.close_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This form is now closed"
        )
    
    # Step 5: Check if user already submitted
    existing_response = db.query(Response).filter(
        Response.form_id == form_id,
        Response.student_id == current_user.id
    ).first()
    
    if existing_response:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted feedback for this form"
        )
    
    # Step 6: Get all questions for the form
    questions = db.query(Question).filter(Question.form_id == form_id).all()
    question_map = {q.id: q for q in questions}
    
    # Step 7: Validate all required questions are answered
    answered_question_ids = {answer.question_id for answer in response_data.answers}
    required_questions = [q for q in questions if q.is_required]
    
    missing_required = [q.id for q in required_questions if q.id not in answered_question_ids]
    if missing_required:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required questions: {missing_required}"
        )
    
    # Step 8: Validate all question IDs exist
    for answer in response_data.answers:
        if answer.question_id not in question_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid question ID: {answer.question_id}"
            )
    
    # Step 9: Create response
    db_response = Response(
        form_id=form_id,
        student_id=current_user.id,
        is_anonymous=response_data.is_anonymous
    )
    
    db.add(db_response)
    db.flush()  # Get response ID before creating answers
    
    # Step 10: Create all answers
    for answer_data in response_data.answers:
        db_answer = Answer(
            response_id=db_response.id,
            question_id=answer_data.question_id,
            answer_value=answer_data.answer_value
        )
        db.add(db_answer)
    
    # Step 11: Commit transaction
    db.commit()
    db.refresh(db_response)
    
    return ResponseSubmitted(
        id=db_response.id,
        form_id=db_response.form_id,
        submitted_at=db_response.submitted_at,
        message="Thank you for your feedback!"
    )


@router.get("/forms/{form_id}/responses/", response_model=List[ResponseSummary])
def list_form_responses(
    form_id: int,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    List all responses for a form (Instructor/Admin only)
    
    How it works:
    1. Verify form exists and user owns it
    2. Fetch all responses with answer counts
    3. Return summary list
    
    Example:
        GET /forms/1/responses/
        Headers: Authorization: Bearer <token>
        Returns: [
            {
                "id": 10,
                "form_id": 1,
                "student_email": "john@example.com",
                "submitted_at": "2024-03-05T14:30:00",
                "is_anonymous": false,
                "answer_count": 10
            },
            ...
        ]
    """
    # Step 1: Find form
    form = db.query(Form).filter(Form.id == form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Step 2: Check permissions
    if form.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this form"
        )
    
    if current_user.role == "instructor" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view responses from your own forms"
        )
    
    # Step 3: Fetch all responses
    responses = db.query(Response).filter(Response.form_id == form_id).all()
    
    # Step 4: Build response summaries
    summaries = []
    for response in responses:
        # Get answer count
        answer_count = db.query(Answer).filter(Answer.response_id == response.id).count()
        
        # Get student email (if not anonymous)
        student_email = None
        student_id = None
        if not response.is_anonymous:
            student = db.query(User).filter(User.id == response.student_id).first()
            if student:
                student_email = student.email
                student_id = student.id
        
        summaries.append(ResponseSummary(
            id=response.id,
            form_id=response.form_id,
            student_id=student_id,
            student_email=student_email,
            submitted_at=response.submitted_at,
            is_anonymous=response.is_anonymous,
            answer_count=answer_count
        ))
    
    return summaries


@router.get("/responses/{response_id}", response_model=ResponseDetail)
def get_response_details(
    response_id: int,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Get detailed response with all answers (Instructor/Admin only)
    
    How it works:
    1. Find response by ID
    2. Verify user owns the form
    3. Fetch all answers
    4. Return detailed response
    
    Example:
        GET /responses/10
        Headers: Authorization: Bearer <token>
        Returns: {
            "id": 10,
            "form_id": 1,
            "student_email": "john@example.com",
            "submitted_at": "2024-03-05T14:30:00",
            "is_anonymous": false,
            "answers": [
                {"id": 100, "question_id": 1, "answer_value": "5", ...},
                ...
            ]
        }
    """
    # Step 1: Find response
    response = db.query(Response).filter(Response.id == response_id).first()
    
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found"
        )
    
    # Step 2: Get form to check permissions
    form = db.query(Form).filter(Form.id == response.form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Step 3: Check permissions
    if form.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this form"
        )
    
    if current_user.role == "instructor" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view responses from your own forms"
        )
    
    # Step 4: Fetch all answers
    answers = db.query(Answer).filter(Answer.response_id == response_id).all()
    
    # Step 5: Get student email (if not anonymous)
    student_email = None
    student_id = None
    if not response.is_anonymous:
        student = db.query(User).filter(User.id == response.student_id).first()
        if student:
            student_email = student.email
            student_id = student.id
    
    return ResponseDetail(
        id=response.id,
        form_id=response.form_id,
        student_id=student_id,
        student_email=student_email,
        submitted_at=response.submitted_at,
        is_anonymous=response.is_anonymous,
        answers=answers
    )


@router.get("/forms/{form_id}/responses/export")
def export_responses_csv(
    form_id: int,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Export all responses as CSV file (Instructor/Admin only)
    
    How it works:
    1. Verify form exists and user owns it
    2. Fetch all questions and responses
    3. Build CSV with questions as columns
    4. Return file download
    
    CSV Format:
        Response ID | Student Email | Submitted At | Question 1 | Question 2 | ...
        ------------|---------------|--------------|------------|------------|-----
        10          | john@test.com | 2024-03-05   | 5          | Great!     | ...
    
    Example:
        GET /forms/1/responses/export
        Headers: Authorization: Bearer <token>
        Returns: CSV file download
    """
    # Step 1: Find form
    form = db.query(Form).filter(Form.id == form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Step 2: Check permissions
    if form.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this form"
        )
    
    if current_user.role == "instructor" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only export responses from your own forms"
        )
    
    # Step 3: Fetch all questions (ordered)
    questions = db.query(Question).filter(
        Question.form_id == form_id
    ).order_by(Question.order).all()
    
    # Step 4: Fetch all responses
    responses = db.query(Response).filter(Response.form_id == form_id).all()
    
    if not responses:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No responses found for this form"
        )
    
    # Step 5: Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Step 6: Write header row
    header = ["Response ID", "Student Email", "Submitted At", "Anonymous"]
    header.extend([f"Q{q.order}: {q.question_text[:50]}" for q in questions])
    writer.writerow(header)
    
    # Step 7: Write data rows
    for response in responses:
        # Get student email
        student_email = "Anonymous"
        if not response.is_anonymous:
            student = db.query(User).filter(User.id == response.student_id).first()
            if student:
                student_email = student.email
        
        # Get all answers for this response
        answers = db.query(Answer).filter(Answer.response_id == response.id).all()
        answer_map = {a.question_id: a.answer_value for a in answers}
        
        # Build row
        row = [
            response.id,
            student_email,
            response.submitted_at.strftime("%Y-%m-%d %H:%M:%S"),
            "Yes" if response.is_anonymous else "No"
        ]
        
        # Add answers in question order
        for question in questions:
            row.append(answer_map.get(question.id, ""))
        
        writer.writerow(row)
    
    # Step 8: Prepare file for download
    output.seek(0)
    filename = f"{form.course_code}_{form.title.replace(' ', '_')}_responses.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
