"""
Analytics Schemas - Pydantic models for analytics API responses

Contains response models for:
- Summary statistics
- Question analytics
- Trends data
- Sentiment analysis
"""

from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime


# Summary Analytics Schemas
class ResponseDistribution(BaseModel):
    """Response distribution by date"""
    date: str
    count: int


class SummaryStatistics(BaseModel):
    """Overall form statistics"""
    total_responses: int
    completion_rate: float
    average_rating: Optional[float] = None
    anonymous_count: int
    identified_count: int
    response_rate: float
    first_response_date: Optional[datetime] = None
    last_response_date: Optional[datetime] = None
    responses_by_date: List[ResponseDistribution]


# Question-specific Analytics Schemas
class RatingDistribution(BaseModel):
    """Distribution of ratings (1-5)"""
    rating: int
    count: int
    percentage: float


class MCQDistribution(BaseModel):
    """Distribution of MCQ choices"""
    option: str
    count: int
    percentage: float


class YesNoDistribution(BaseModel):
    """Distribution of Yes/No answers"""
    yes_count: int
    no_count: int
    yes_percentage: float
    no_percentage: float


class WordFrequency(BaseModel):
    """Word frequency for text responses"""
    word: str
    frequency: int


class QuestionAnalytics(BaseModel):
    """Analytics for a specific question"""
    question_id: int
    question_text: str
    question_type: str
    total_responses: int
    
    # Type-specific analytics (only populated based on question type)
    rating_distribution: Optional[List[RatingDistribution]] = None
    average_rating: Optional[float] = None
    
    mcq_distribution: Optional[List[MCQDistribution]] = None
    most_selected_option: Optional[str] = None
    
    yes_no_distribution: Optional[YesNoDistribution] = None
    
    word_frequencies: Optional[List[WordFrequency]] = None
    sample_responses: Optional[List[str]] = None


# Trends Analytics Schemas
class TrendDataPoint(BaseModel):
    """Single data point in a trend"""
    date: str
    value: float
    count: int


class TrendsAnalytics(BaseModel):
    """Trends over time"""
    form_id: int
    form_title: str
    period: str  # "daily" or "weekly"
    
    response_trend: List[TrendDataPoint]
    rating_trend: Optional[List[TrendDataPoint]] = None
    
    peak_response_date: Optional[str] = None
    peak_response_count: Optional[int] = None


# Sentiment Analysis Schemas
class SentimentScore(BaseModel):
    """Sentiment analysis for text response"""
    response_id: int
    question_id: int
    text: str
    sentiment: str  # "positive", "negative", "neutral"
    confidence: float


class SentimentSummary(BaseModel):
    """Overall sentiment summary"""
    positive_count: int
    negative_count: int
    neutral_count: int
    
    positive_percentage: float
    negative_percentage: float
    neutral_percentage: float
    
    overall_sentiment: str  # "mostly positive", "mostly negative", "mixed"


class SentimentAnalytics(BaseModel):
    """Complete sentiment analysis"""
    form_id: int
    form_title: str
    total_text_responses: int
    
    summary: SentimentSummary
    top_positive_responses: List[SentimentScore]
    top_negative_responses: List[SentimentScore]
    key_themes: List[str]


# Export Report Schema
class ReportMetadata(BaseModel):
    """Metadata for exported report"""
    form_id: int
    form_title: str
    generated_at: datetime
    generated_by: str
    total_responses: int
    date_range: str


class ExportReport(BaseModel):
    """Complete analytics report for export"""
    metadata: ReportMetadata
    summary: SummaryStatistics
    question_analytics: List[QuestionAnalytics]
    trends: Optional[TrendsAnalytics] = None
    sentiment: Optional[SentimentAnalytics] = None
