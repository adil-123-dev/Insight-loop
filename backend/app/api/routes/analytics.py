"""
Analytics API Routes - Endpoints for feedback analytics and insights

Endpoints:
1. GET /forms/{form_id}/analytics/summary - Overall statistics
2. GET /forms/{form_id}/analytics/question/{question_id} - Question analytics
3. GET /forms/{form_id}/analytics/trends - Trends over time
4. GET /forms/{form_id}/analytics/sentiment - Sentiment analysis
5. GET /forms/{form_id}/analytics/export - Export complete report
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import SessionLocal
from app.core.dependencies import get_current_instructor
from app.models.user import User
from app.models.form import Form
from app.models.question import Question
from app.schemas.analytics import (
    SummaryStatistics,
    QuestionAnalytics,
    TrendsAnalytics,
    SentimentAnalytics,
    ExportReport,
    ReportMetadata
)
from app.services.analytics_service import (
    calculate_summary_statistics,
    calculate_question_analytics,
    calculate_trends,
    analyze_sentiment
)

router = APIRouter(tags=["Analytics"])


def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/forms/{form_id}/analytics/summary", response_model=SummaryStatistics)
def get_summary_statistics(
    form_id: int,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Get overall summary statistics for a form
    
    **Returns:**
    - Total responses count
    - Completion rate
    - Average rating (if rating questions exist)
    - Anonymous vs identified responses
    - Response distribution by date
    
    **Access:** Instructor/Admin only
    """
    # Verify form exists and user has access
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form {form_id} not found"
        )
    
    # Check if instructor owns this form or is admin
    if current_user.role != "admin" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view analytics for this form"
        )
    
    try:
        summary = calculate_summary_statistics(form_id, db)
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating summary statistics: {str(e)}"
        )


@router.get("/forms/{form_id}/analytics/question/{question_id}", response_model=QuestionAnalytics)
def get_question_analytics(
    form_id: int,
    question_id: int,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Get detailed analytics for a specific question
    
    **Returns analytics based on question type:**
    - **Rating:** Distribution chart data, average rating
    - **MCQ:** Option selection distribution, most selected option
    - **Yes/No:** Yes vs No percentages
    - **Text:** Word frequency, sample responses
    
    **Access:** Instructor/Admin only
    """
    # Verify form exists and user has access
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form {form_id} not found"
        )
    
    if current_user.role != "admin" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view analytics for this form"
        )
    
    # Verify question belongs to this form
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.form_id == form_id
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question {question_id} not found in form {form_id}"
        )
    
    try:
        analytics = calculate_question_analytics(question_id, db)
        return analytics
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating question analytics: {str(e)}"
        )


@router.get("/forms/{form_id}/analytics/trends", response_model=TrendsAnalytics)
def get_trends_analytics(
    form_id: int,
    period: str = Query("daily", regex="^(daily|weekly)$"),
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Get trends analysis over time
    
    **Query Parameters:**
    - `period`: "daily" or "weekly" (default: daily)
    
    **Returns:**
    - Response submission trends
    - Rating trends (if rating questions exist)
    - Peak response date and count
    
    **Access:** Instructor/Admin only
    """
    # Verify form exists and user has access
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form {form_id} not found"
        )
    
    if current_user.role != "admin" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view analytics for this form"
        )
    
    try:
        trends = calculate_trends(form_id, period, db)
        return trends
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating trends: {str(e)}"
        )


@router.get("/forms/{form_id}/analytics/sentiment", response_model=SentimentAnalytics)
def get_sentiment_analysis(
    form_id: int,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Get sentiment analysis for text responses
    
    **Returns:**
    - Overall sentiment distribution (positive/negative/neutral)
    - Top positive and negative responses
    - Key themes and topics
    - Sentiment confidence scores
    
    **Note:** Uses keyword-based sentiment analysis
    
    **Access:** Instructor/Admin only
    """
    # Verify form exists and user has access
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form {form_id} not found"
        )
    
    if current_user.role != "admin" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view analytics for this form"
        )
    
    try:
        sentiment = analyze_sentiment(form_id, db)
        return sentiment
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing sentiment analysis: {str(e)}"
        )


@router.get("/forms/{form_id}/analytics/export", response_model=ExportReport)
def export_analytics_report(
    form_id: int,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """
    Export complete analytics report
    
    **Returns:**
    - Report metadata
    - Summary statistics
    - Analytics for all questions
    - Trends analysis
    - Sentiment analysis
    
    **Use Case:** Generate comprehensive report for sharing or archival
    
    **Access:** Instructor/Admin only
    """
    # Verify form exists and user has access
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form {form_id} not found"
        )
    
    if current_user.role != "admin" and form.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to export analytics for this form"
        )
    
    try:
        # Generate all analytics
        summary = calculate_summary_statistics(form_id, db)
        
        # Get analytics for all questions
        questions = db.query(Question).filter(Question.form_id == form_id).all()
        question_analytics = [
            calculate_question_analytics(q.id, db) for q in questions
        ]
        
        trends = calculate_trends(form_id, "daily", db)
        sentiment = analyze_sentiment(form_id, db)
        
        # Create metadata
        date_range = "N/A"
        if summary.first_response_date and summary.last_response_date:
            date_range = f"{summary.first_response_date.strftime('%Y-%m-%d')} to {summary.last_response_date.strftime('%Y-%m-%d')}"
        
        metadata = ReportMetadata(
            form_id=form_id,
            form_title=form.title,
            generated_at=datetime.now(),
            generated_by=current_user.full_name,
            total_responses=summary.total_responses,
            date_range=date_range
        )
        
        return ExportReport(
            metadata=metadata,
            summary=summary,
            question_analytics=question_analytics,
            trends=trends,
            sentiment=sentiment
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating analytics report: {str(e)}"
        )


from datetime import datetime
