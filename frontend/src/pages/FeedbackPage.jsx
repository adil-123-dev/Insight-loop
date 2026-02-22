import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, CircularProgress, Alert,
  RadioGroup, FormControlLabel, Radio, Rating, TextField,
  FormControl, FormLabel, Switch, LinearProgress, Stepper,
  Step, StepLabel, Paper, Divider, Fade, Zoom,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import LockIcon from '@mui/icons-material/LockRounded';
import SendIcon from '@mui/icons-material/SendRounded';
import SchoolIcon from '@mui/icons-material/SchoolRounded';
import StarIcon from '@mui/icons-material/StarRounded';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardRounded';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffRounded';
import PersonIcon from '@mui/icons-material/PersonRounded';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import formService from '../services/formService';

// ── Mock data removed — real API used below ──────────────────────────────────

// ── Rating labels ────────────────────────────────────────────────────────────
const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

// ── Single Question Card ─────────────────────────────────────────────────────
const QuestionCard = ({ question, value, onChange, index, total }) => {
  const progress = ((index) / total) * 100;

  const renderInput = () => {
    switch (question.question_type) {
      case 'rating':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mt: 2 }}>
            <Rating
              value={Number(value) || 0}
              onChange={(_, v) => onChange(v)}
              size="large"
              icon={<StarIcon fontSize="inherit" />}
              emptyIcon={<StarIcon fontSize="inherit" sx={{ opacity: 0.25 }} />}
              sx={{
                fontSize: '3rem',
                '& .MuiRating-iconFilled': { color: '#f59e0b' },
                '& .MuiRating-iconHover': { color: '#fbbf24' },
              }}
            />
            {value && (
              <Chip
                label={RATING_LABELS[value] || ''}
                sx={{
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  px: 1,
                }}
              />
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 280, mt: 0.5 }}>
              {[1,2,3,4,5].map(n => (
                <Typography key={n} variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  {n}
                </Typography>
              ))}
            </Box>
          </Box>
        );

      case 'mcq':
        return (
          <FormControl component="fieldset" sx={{ width: '100%', mt: 1 }}>
            <RadioGroup value={value || ''} onChange={(e) => onChange(e.target.value)}>
              {(question.options || []).map((opt, i) => (
                <FormControlLabel
                  key={i}
                  value={opt}
                  control={<Radio sx={{ '&.Mui-checked': { color: '#667eea' } }} />}
                  label={opt}
                  sx={{
                    mb: 0.5,
                    p: '6px 12px',
                    borderRadius: 2,
                    border: '1.5px solid',
                    borderColor: value === opt ? '#667eea' : 'rgba(0,0,0,0.08)',
                    background: value === opt ? 'rgba(102,126,234,0.06)' : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: '#667eea',
                      background: 'rgba(102,126,234,0.04)',
                    },
                    mx: 0,
                    '& .MuiFormControlLabel-label': { fontWeight: value === opt ? 600 : 400 },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'yes_no':
        return (
          <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center' }}>
            {['Yes', 'No'].map((opt) => (
              <Button
                key={opt}
                variant={value === opt ? 'contained' : 'outlined'}
                onClick={() => onChange(opt)}
                sx={{
                  minWidth: 120,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 700,
                  fontSize: '1rem',
                  ...(value === opt
                    ? {
                        background: opt === 'Yes'
                          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                          : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        border: 'none',
                        color: '#fff',
                        boxShadow: opt === 'Yes'
                          ? '0 4px 15px rgba(34,197,94,0.4)'
                          : '0 4px 15px rgba(239,68,68,0.4)',
                      }
                    : {
                        borderColor: opt === 'Yes' ? '#22c55e' : '#ef4444',
                        color: opt === 'Yes' ? '#22c55e' : '#ef4444',
                        '&:hover': {
                          background: opt === 'Yes' ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                          borderColor: opt === 'Yes' ? '#22c55e' : '#ef4444',
                        },
                      }),
                  transform: value === opt ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s',
                }}
              >
                {opt === 'Yes' ? '👍 Yes' : '👎 No'}
              </Button>
            ))}
          </Box>
        );

      case 'text':
        return (
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Share your thoughts here..."
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            sx={{
              mt: 1.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                  borderWidth: 2,
                },
              },
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Fade in timeout={400}>
      <Box>
        {/* Progress bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Question {index + 1} of {total}
            </Typography>
            <Typography variant="caption" sx={{ color: '#667eea', fontWeight: 700 }}>
              {Math.round(progress)}% complete
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              background: 'rgba(102,126,234,0.12)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #667eea, #f093fb)',
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Question card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            border: '1.5px solid rgba(102,126,234,0.15)',
            background: '#fff',
            minHeight: 300,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative corner accent */}
          <Box sx={{
            position: 'absolute', top: 0, right: 0,
            width: 80, height: 80,
            background: 'linear-gradient(135deg, transparent 50%, rgba(102,126,234,0.06) 50%)',
          }} />

          {/* Question number chip */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '0.85rem',
              flexShrink: 0,
            }}>
              {index + 1}
            </Box>
            {question.is_required && (
              <Chip
                label="Required"
                size="small"
                sx={{
                  background: 'rgba(239,68,68,0.1)',
                  color: '#ef4444',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  height: 22,
                }}
              />
            )}
          </Box>

          {/* Question text */}
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 1, lineHeight: 1.4, fontSize: { xs: '1rem', md: '1.2rem' } }}>
            {question.question_text}
          </Typography>

          {/* Type label */}
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            {question.question_type === 'rating' ? '⭐ Rate 1–5' :
             question.question_type === 'mcq' ? '🔘 Choose one' :
             question.question_type === 'yes_no' ? '✅ Yes or No' : '✏️ Open answer'}
          </Typography>

          <Divider sx={{ my: 2, borderColor: 'rgba(0,0,0,0.06)' }} />

          {/* Input */}
          {renderInput()}
        </Paper>
      </Box>
    </Fade>
  );
};

// ── Success Screen ───────────────────────────────────────────────────────────
const SuccessScreen = ({ form, navigate }) => (
  <Zoom in timeout={500}>
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Box sx={{
        width: 100, height: 100, borderRadius: '50%',
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        mx: 'auto', mb: 3,
        boxShadow: '0 8px 30px rgba(34,197,94,0.4)',
        animation: 'pulse 2s infinite',
        '@keyframes pulse': {
          '0%, 100%': { boxShadow: '0 8px 30px rgba(34,197,94,0.4)' },
          '50%': { boxShadow: '0 8px 50px rgba(34,197,94,0.6)' },
        },
      }}>
        <CheckCircleIcon sx={{ fontSize: 56, color: '#fff' }} />
      </Box>

      <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', mb: 1 }}>
        Thank you! 🎉
      </Typography>
      <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400, mb: 1 }}>
        Your feedback has been submitted
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, maxWidth: 400, mx: 'auto' }}>
        Your responses for <strong>{form?.course_name}</strong> have been recorded.
        Your insights help improve the course for everyone!
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={() => navigate('/forms')}
          sx={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff', borderRadius: 3, px: 3, py: 1.2,
            fontWeight: 700,
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(102,126,234,0.4)' },
            transition: 'all 0.2s',
          }}
        >
          View All Forms
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/dashboard')}
          sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 600, borderColor: '#667eea', color: '#667eea' }}
        >
          Go to Dashboard
        </Button>
      </Box>
    </Box>
  </Zoom>
);

// ── Main Page ────────────────────────────────────────────────────────────────
export default function FeedbackPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [formData, questionsData] = await Promise.all([
          formService.getForm(formId),
          formService.getQuestions(formId),
        ]);
        setForm(formData);
        // Sort questions by order
        setQuestions([...questionsData].sort((a, b) => a.order - b.order));
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load form. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [formId]);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const isFirst = currentIndex === 0;

  const handleAnswer = (value) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    setValidationError('');
  };

  const handleNext = () => {
    if (currentQuestion.is_required && !answers[currentQuestion.id]) {
      setValidationError('This question is required. Please provide an answer.');
      return;
    }
    setValidationError('');
    if (!isLast) setCurrentIndex(i => i + 1);
  };

  const handleBack = () => {
    setValidationError('');
    if (!isFirst) setCurrentIndex(i => i - 1);
  };

  const handleSubmit = async () => {
    // Validate all required questions
    const unanswered = questions.filter(q => q.is_required && !answers[q.id]);
    if (unanswered.length > 0) {
      setValidationError(`Please answer all required questions. ${unanswered.length} required question(s) remaining.`);
      return;
    }    setSubmitting(true);
    setError('');
    try {
      // Build answers payload: { question_id, answer_value }
      const answersPayload = questions.map(q => ({
        question_id: q.id,
        answer_value: answers[q.id] !== undefined ? String(answers[q.id]) : '',
      })).filter(a => a.answer_value !== '');

      await formService.submitResponse(formId, {
        is_anonymous: isAnonymous,
        answers: answersPayload,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const requiredCount = questions.filter(q => q.is_required).length;
  const answeredRequiredCount = questions.filter(q => q.is_required && answers[q.id]).length;

  if (loading) {
    return (
      <>
        <Navbar />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 2 }}>
          <CircularProgress sx={{ color: '#667eea' }} size={48} />
          <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>Loading feedback form…</Typography>
        </Box>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <Box sx={{ maxWidth: 700, mx: 'auto', px: { xs: 2, md: 3 }, py: 4 }}>
          <SuccessScreen form={form} navigate={navigate} />
        </Box>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box sx={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #f0f4ff 100%)', minHeight: '100vh', pb: 6 }}>
        <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 3 }, pt: 4 }}>

          {/* Header card */}
          <Paper
            elevation={0}
            sx={{
              mb: 3, borderRadius: 4, overflow: 'hidden',
              border: '1.5px solid rgba(102,126,234,0.12)',
            }}
          >
            {/* Gradient top strip */}
            <Box sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              px: 4, py: 3, color: '#fff',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: 2,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <SchoolIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.3 }}>
                    {form?.title}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>
                    {form?.course_code} · {form?.course_name}
                  </Typography>
                </Box>
                <Chip
                  label="Published"
                  sx={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)' }}
                />
              </Box>

              {form?.description && (
                <Typography variant="body2" sx={{ mt: 2, opacity: 0.9, lineHeight: 1.6 }}>
                  {form.description}
                </Typography>
              )}
            </Box>

            {/* Stats bar */}
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 3, px: 4, py: 2,
              background: '#fff', flexWrap: 'wrap',
            }}>
              <Box sx={{ display: 'flex', gap: 3, flex: 1, flexWrap: 'wrap' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#667eea', lineHeight: 1 }}>{questions.length}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Questions</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#22c55e', lineHeight: 1 }}>{answeredCount}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Answered</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{requiredCount}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Required</Typography>
                </Box>
              </Box>

              {/* Anonymous toggle */}
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                background: isAnonymous ? 'rgba(102,126,234,0.06)' : 'rgba(0,0,0,0.03)',
                borderRadius: 2, px: 1.5, py: 0.5, border: '1px solid',
                borderColor: isAnonymous ? 'rgba(102,126,234,0.2)' : 'rgba(0,0,0,0.08)',
                transition: 'all 0.2s',
              }}>
                {isAnonymous ? <VisibilityOffIcon sx={{ fontSize: 18, color: '#667eea' }} /> : <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
                <Typography variant="body2" sx={{ fontWeight: 600, color: isAnonymous ? '#667eea' : 'text.secondary', whiteSpace: 'nowrap' }}>
                  {isAnonymous ? 'Anonymous' : 'Identified'}
                </Typography>
                <Switch
                  size="small"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-thumb': { background: isAnonymous ? '#667eea' : '#ccc' },
                    '& .MuiSwitch-track': { background: isAnonymous ? 'rgba(102,126,234,0.3) !important' : undefined },
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Question navigator (mini dots) */}
          <Box sx={{ display: 'flex', gap: 0.8, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            {questions.map((q, i) => (
              <Box
                key={q.id}
                onClick={() => {
                  if (i <= currentIndex || answers[questions[i - 1]?.id] || i === 0) {
                    setCurrentIndex(i);
                    setValidationError('');
                  }
                }}
                sx={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s',
                  ...(i === currentIndex
                    ? { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', transform: 'scale(1.15)', boxShadow: '0 2px 10px rgba(102,126,234,0.4)' }
                    : answers[q.id]
                    ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1.5px solid #22c55e' }
                    : { background: 'rgba(0,0,0,0.06)', color: 'text.secondary', border: '1.5px solid rgba(0,0,0,0.1)' }),
                }}
              >
                {answers[q.id] ? '✓' : i + 1}
              </Box>
            ))}
          </Box>

          {/* Current question */}
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              value={answers[currentQuestion.id]}
              onChange={handleAnswer}
              index={currentIndex}
              total={questions.length}
            />
          )}

          {/* Validation error */}
          {validationError && (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }} icon={<LockIcon />}>
              {validationError}
            </Alert>
          )}

          {/* Navigation buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              disabled={isFirst}
              variant="outlined"
              sx={{
                borderRadius: 3, px: 3, py: 1.2, fontWeight: 600,
                borderColor: 'rgba(102,126,234,0.3)', color: '#667eea',
                '&:hover': { borderColor: '#667eea', background: 'rgba(102,126,234,0.04)' },
                '&:disabled': { opacity: 0.4 },
              }}
            >
              Back
            </Button>

            {isLast ? (
              <Button
                endIcon={submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SendIcon />}
                onClick={handleSubmit}
                disabled={submitting}
                variant="contained"
                sx={{
                  background: submitting ? '#ccc' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff', borderRadius: 3, px: 4, py: 1.2, fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(34,197,94,0.4)',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(34,197,94,0.5)' },
                  transition: 'all 0.2s',
                  '&:disabled': { background: '#ccc', transform: 'none' },
                }}
              >
                {submitting ? 'Submitting…' : 'Submit Feedback'}
              </Button>
            ) : (
              <Button
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff', borderRadius: 3, px: 3, py: 1.2, fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(102,126,234,0.5)' },
                  transition: 'all 0.2s',
                }}
              >
                Next
              </Button>
            )}
          </Box>

          {/* Bottom summary */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {answeredRequiredCount} of {requiredCount} required questions answered
              {isAnonymous && ' · 🔒 Your response is anonymous'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}
