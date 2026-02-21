"""
Analytics Service - Business logic for calculating analytics

Functions for:
- Summary statistics
- Question-specific analytics
- Trends analysis
- Sentiment analysis
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Optional
from collections import Counter
from datetime import datetime, timedelta
import re

from app.models.form import Form
from app.models.response import Response
from app.models.answer import Answer
from app.models.question import Question
from app.schemas.analytics import (
    SummaryStatistics, ResponseDistribution,
    QuestionAnalytics, RatingDistribution, MCQDistribution, 
    YesNoDistribution, WordFrequency,
    TrendsAnalytics, TrendDataPoint,
    SentimentAnalytics, SentimentScore, SentimentSummary
)


def calculate_summary_statistics(form_id: int, db: Session) -> SummaryStatistics:
    """Calculate overall form statistics"""
    
    # Get all responses for the form
    responses = db.query(Response).filter(Response.form_id == form_id).all()
    total_responses = len(responses)
    
    if total_responses == 0:
        return SummaryStatistics(
            total_responses=0,
            completion_rate=0.0,
            average_rating=None,
            anonymous_count=0,
            identified_count=0,
            response_rate=0.0,
            first_response_date=None,
            last_response_date=None,
            responses_by_date=[]
        )
    
    # Count anonymous vs identified
    anonymous_count = sum(1 for r in responses if r.is_anonymous)
    identified_count = total_responses - anonymous_count
    
    # Calculate average rating (from rating-type questions)
    rating_answers = db.query(Answer).join(Response).join(Question).filter(
        Response.form_id == form_id,
        Question.question_type == "rating"
    ).all()
    
    avg_rating = None
    if rating_answers:
        ratings = [int(a.answer_value) for a in rating_answers if a.answer_value.isdigit()]
        avg_rating = sum(ratings) / len(ratings) if ratings else None
    
    # Calculate completion rate (responses with all required questions answered)
    required_questions = db.query(Question).filter(
        Question.form_id == form_id,
        Question.is_required == True
    ).count()
    
    completed_responses = 0
    for response in responses:
        answer_count = db.query(Answer).filter(Answer.response_id == response.id).count()
        if answer_count >= required_questions:
            completed_responses += 1
    
    completion_rate = (completed_responses / total_responses * 100) if total_responses > 0 else 0
    
    # Response dates
    response_dates = [r.submitted_at for r in responses]
    first_date = min(response_dates) if response_dates else None
    last_date = max(response_dates) if response_dates else None
    
    # Response distribution by date
    date_counts = {}
    for r in responses:
        date_key = r.submitted_at.strftime("%Y-%m-%d")
        date_counts[date_key] = date_counts.get(date_key, 0) + 1
    
    responses_by_date = [
        ResponseDistribution(date=date, count=count)
        for date, count in sorted(date_counts.items())
    ]
    
    # Calculate response rate (assuming form is sent to students)
    # For now, we'll use a placeholder calculation
    response_rate = 100.0  # Would need student count to calculate accurately
    
    return SummaryStatistics(
        total_responses=total_responses,
        completion_rate=round(completion_rate, 2),
        average_rating=round(avg_rating, 2) if avg_rating else None,
        anonymous_count=anonymous_count,
        identified_count=identified_count,
        response_rate=response_rate,
        first_response_date=first_date,
        last_response_date=last_date,
        responses_by_date=responses_by_date
    )


def calculate_question_analytics(question_id: int, db: Session) -> QuestionAnalytics:
    """Calculate analytics for a specific question"""
    
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise ValueError(f"Question {question_id} not found")
    
    # Get all answers for this question
    answers = db.query(Answer).filter(Answer.question_id == question_id).all()
    total_responses = len(answers)
    
    result = QuestionAnalytics(
        question_id=question_id,
        question_text=question.question_text,
        question_type=question.question_type,
        total_responses=total_responses
    )
    
    if total_responses == 0:
        return result
    
    # Type-specific analytics
    if question.question_type == "rating":
        # Rating distribution
        rating_counts = Counter(int(a.answer_value) for a in answers if a.answer_value.isdigit())
        rating_dist = [
            RatingDistribution(
                rating=rating,
                count=count,
                percentage=round(count / total_responses * 100, 2)
            )
            for rating, count in sorted(rating_counts.items())
        ]
        
        avg_rating = sum(int(a.answer_value) for a in answers if a.answer_value.isdigit()) / total_responses
        
        result.rating_distribution = rating_dist
        result.average_rating = round(avg_rating, 2)
    
    elif question.question_type == "mcq":
        # MCQ distribution
        option_counts = Counter(a.answer_value for a in answers)
        mcq_dist = [
            MCQDistribution(
                option=option,
                count=count,
                percentage=round(count / total_responses * 100, 2)
            )
            for option, count in option_counts.most_common()
        ]
        
        result.mcq_distribution = mcq_dist
        result.most_selected_option = mcq_dist[0].option if mcq_dist else None
    
    elif question.question_type == "yes_no":
        # Yes/No distribution
        yes_count = sum(1 for a in answers if a.answer_value.lower() == "yes")
        no_count = total_responses - yes_count
        
        result.yes_no_distribution = YesNoDistribution(
            yes_count=yes_count,
            no_count=no_count,
            yes_percentage=round(yes_count / total_responses * 100, 2),
            no_percentage=round(no_count / total_responses * 100, 2)
        )
    
    elif question.question_type == "text":
        # Text analytics - word frequency
        all_text = " ".join(a.answer_value.lower() for a in answers)
        words = re.findall(r'\b[a-z]{4,}\b', all_text)  # Words with 4+ letters
        
        # Remove common stop words
        stop_words = {"this", "that", "with", "from", "have", "more", "will", 
                     "been", "were", "they", "their", "would", "could", "should"}
        filtered_words = [w for w in words if w not in stop_words]
        
        word_counts = Counter(filtered_words).most_common(20)
        
        result.word_frequencies = [
            WordFrequency(word=word, frequency=freq)
            for word, freq in word_counts
        ]
        
        # Sample responses (first 5)
        result.sample_responses = [a.answer_value for a in answers[:5]]
    
    return result


def calculate_trends(form_id: int, period: str, db: Session) -> TrendsAnalytics:
    """Calculate trends over time"""
    
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise ValueError(f"Form {form_id} not found")
    
    responses = db.query(Response).filter(Response.form_id == form_id).all()
    
    # Group responses by period
    date_groups = {}
    rating_groups = {}
    
    for response in responses:
        if period == "daily":
            date_key = response.submitted_at.strftime("%Y-%m-%d")
        else:  # weekly
            # Get Monday of the week
            week_start = response.submitted_at - timedelta(days=response.submitted_at.weekday())
            date_key = week_start.strftime("%Y-%m-%d")
        
        date_groups[date_key] = date_groups.get(date_key, 0) + 1
        
        # Get rating answers for this response
        rating_answers = db.query(Answer).join(Question).filter(
            Answer.response_id == response.id,
            Question.question_type == "rating"
        ).all()
        
        if rating_answers:
            ratings = [int(a.answer_value) for a in rating_answers if a.answer_value.isdigit()]
            if ratings:
                if date_key not in rating_groups:
                    rating_groups[date_key] = []
                rating_groups[date_key].extend(ratings)
    
    # Create response trend
    response_trend = [
        TrendDataPoint(
            date=date,
            value=float(count),
            count=count
        )
        for date, count in sorted(date_groups.items())
    ]
    
    # Create rating trend
    rating_trend = None
    if rating_groups:
        rating_trend = [
            TrendDataPoint(
                date=date,
                value=round(sum(ratings) / len(ratings), 2),
                count=len(ratings)
            )
            for date, ratings in sorted(rating_groups.items())
        ]
    
    # Find peak
    peak_date = None
    peak_count = None
    if date_groups:
        peak_date = max(date_groups, key=date_groups.get)
        peak_count = date_groups[peak_date]
    
    return TrendsAnalytics(
        form_id=form_id,
        form_title=form.title,
        period=period,
        response_trend=response_trend,
        rating_trend=rating_trend,
        peak_response_date=peak_date,
        peak_response_count=peak_count
    )


def analyze_sentiment(form_id: int, db: Session) -> SentimentAnalytics:
    """Perform basic sentiment analysis on text responses"""
    
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise ValueError(f"Form {form_id} not found")
    
    # Get all text answers
    text_answers = db.query(Answer).join(Question).filter(
        Answer.question_id == Question.id,
        Question.form_id == form_id,
        Question.question_type == "text"
    ).all()
    
    total_text_responses = len(text_answers)
    
    if total_text_responses == 0:
        return SentimentAnalytics(
            form_id=form_id,
            form_title=form.title,
            total_text_responses=0,
            summary=SentimentSummary(
                positive_count=0,
                negative_count=0,
                neutral_count=0,
                positive_percentage=0.0,
                negative_percentage=0.0,
                neutral_percentage=0.0,
                overall_sentiment="no data"
            ),
            top_positive_responses=[],
            top_negative_responses=[],
            key_themes=[]
        )
    
    # Simple sentiment analysis using keyword matching
    positive_words = {"excellent", "great", "good", "love", "amazing", "wonderful", 
                     "helpful", "clear", "best", "awesome", "fantastic", "perfect"}
    negative_words = {"bad", "poor", "terrible", "worst", "boring", "difficult", 
                     "confusing", "unclear", "useless", "hate", "disappointing"}
    
    sentiment_scores = []
    positive_responses = []
    negative_responses = []
    
    for answer in text_answers:
        text_lower = answer.answer_value.lower()
        words = set(re.findall(r'\b[a-z]+\b', text_lower))
        
        pos_count = len(words & positive_words)
        neg_count = len(words & negative_words)
        
        if pos_count > neg_count:
            sentiment = "positive"
            confidence = min(pos_count / 3.0, 1.0)  # Max confidence at 3+ positive words
            positive_responses.append((answer, confidence))
        elif neg_count > pos_count:
            sentiment = "negative"
            confidence = min(neg_count / 3.0, 1.0)
            negative_responses.append((answer, confidence))
        else:
            sentiment = "neutral"
            confidence = 0.5
        
        sentiment_scores.append(SentimentScore(
            response_id=answer.response_id,
            question_id=answer.question_id,
            text=answer.answer_value[:100] + "..." if len(answer.answer_value) > 100 else answer.answer_value,
            sentiment=sentiment,
            confidence=round(confidence, 2)
        ))
    
    # Count sentiments
    positive_count = sum(1 for s in sentiment_scores if s.sentiment == "positive")
    negative_count = sum(1 for s in sentiment_scores if s.sentiment == "negative")
    neutral_count = total_text_responses - positive_count - negative_count
    
    # Determine overall sentiment
    if positive_count > negative_count * 2:
        overall = "mostly positive"
    elif negative_count > positive_count * 2:
        overall = "mostly negative"
    else:
        overall = "mixed"
    
    # Sort and get top responses
    positive_responses.sort(key=lambda x: x[1], reverse=True)
    negative_responses.sort(key=lambda x: x[1], reverse=True)
    
    top_positive = [
        SentimentScore(
            response_id=a.response_id,
            question_id=a.question_id,
            text=a.answer_value[:100] + "..." if len(a.answer_value) > 100 else a.answer_value,
            sentiment="positive",
            confidence=round(conf, 2)
        )
        for a, conf in positive_responses[:5]
    ]
    
    top_negative = [
        SentimentScore(
            response_id=a.response_id,
            question_id=a.question_id,
            text=a.answer_value[:100] + "..." if len(a.answer_value) > 100 else a.answer_value,
            sentiment="negative",
            confidence=round(conf, 2)
        )
        for a, conf in negative_responses[:5]
    ]
    
    # Extract key themes (most common words)
    all_text = " ".join(a.answer_value.lower() for a in text_answers)
    words = re.findall(r'\b[a-z]{5,}\b', all_text)
    stop_words = {"this", "that", "with", "from", "have", "more", "would", "could", "should"}
    filtered = [w for w in words if w not in stop_words]
    key_themes = [word for word, _ in Counter(filtered).most_common(10)]
    
    return SentimentAnalytics(
        form_id=form_id,
        form_title=form.title,
        total_text_responses=total_text_responses,
        summary=SentimentSummary(
            positive_count=positive_count,
            negative_count=negative_count,
            neutral_count=neutral_count,
            positive_percentage=round(positive_count / total_text_responses * 100, 2),
            negative_percentage=round(negative_count / total_text_responses * 100, 2),
            neutral_percentage=round(neutral_count / total_text_responses * 100, 2),
            overall_sentiment=overall
        ),
        top_positive_responses=top_positive,
        top_negative_responses=top_negative,
        key_themes=key_themes
    )
