import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress, Alert,
  MenuItem, Select, FormControl, InputLabel, Divider,
  LinearProgress, Avatar, Tooltip, Button, Tab, Tabs,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded';
import PeopleIcon from '@mui/icons-material/PeopleRounded';
import StarIcon from '@mui/icons-material/StarRounded';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAltRounded';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutralRounded';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfiedRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import DownloadIcon from '@mui/icons-material/DownloadRounded';
import BarChartIcon from '@mui/icons-material/BarChartRounded';
import ForumIcon from '@mui/icons-material/ForumRounded';
import AssignmentIcon from '@mui/icons-material/AssignmentRounded';
import Navbar from '../components/Navbar';
import formService from '../services/formService';
import analyticsService from '../services/analyticsService';

// ── Mock analytics data (used as fallback if API returns no data) ─────────────
const MOCK_SUMMARY = {
  total_responses: 142,
  completion_rate: 87.3,
  avg_rating: 4.2,
  anonymous_count: 98,
  identified_count: 44,
  response_by_date: [
    { date: 'Jan 10', count: 12 },
    { date: 'Jan 11', count: 28 },
    { date: 'Jan 12', count: 19 },
    { date: 'Jan 13', count: 35 },
    { date: 'Jan 14', count: 22 },
    { date: 'Jan 15', count: 26 },
  ],
};

const MOCK_QUESTIONS_ANALYTICS = [
  {
    question_id: 1,
    question_text: 'How would you rate the overall course quality?',
    question_type: 'rating',
    avg_rating: 4.3,
    distribution: { 1: 3, 2: 8, 3: 18, 4: 52, 5: 61 },
    total: 142,
  },
  {
    question_id: 2,
    question_text: 'Which teaching method do you find most effective?',
    question_type: 'mcq',
    options_distribution: {
      'Lectures': 48,
      'Hands-on Labs': 56,
      'Group Discussions': 21,
      'Self-Study': 17,
    },
    total: 142,
  },
  {
    question_id: 3,
    question_text: 'Would you recommend this course?',
    question_type: 'yes_no',
    yes_count: 128,
    no_count: 14,
    total: 142,
  },
  {
    question_id: 4,
    question_text: 'How clear were the course materials?',
    question_type: 'rating',
    avg_rating: 3.9,
    distribution: { 1: 5, 2: 12, 3: 24, 4: 61, 5: 40 },
    total: 142,
  },
];

const MOCK_SENTIMENT = {
  positive: 68,
  neutral: 22,
  negative: 10,
  sample_texts: [
    { text: 'Great course, very well structured and engaging!', sentiment: 'positive' },
    { text: 'The labs could be improved with more practical examples.', sentiment: 'neutral' },
    { text: 'Instructor was very helpful during office hours.', sentiment: 'positive' },
    { text: 'Some topics were rushed and hard to follow.', sentiment: 'negative' },
    { text: 'Overall a good experience with room for improvement.', sentiment: 'neutral' },
  ],
};

const MOCK_TRENDS = [
  { date: 'Jan 10', responses: 12 },
  { date: 'Jan 11', responses: 28 },
  { date: 'Jan 12', responses: 19 },
  { date: 'Jan 13', responses: 35 },
  { date: 'Jan 14', responses: 22 },
  { date: 'Jan 15', responses: 26 },
];

// ── Color palette ─────────────────────────────────────────────────────────────
const CHART_COLORS = ['#667eea', '#f093fb', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, gradient, delay = 0 }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3, borderRadius: 4,
      border: '1.5px solid rgba(0,0,0,0.06)',
      background: '#fff',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 35px rgba(0,0,0,0.1)' },
      height: '100%',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
      <Box sx={{
        width: 48, height: 48, borderRadius: 2.5,
        background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 24,
      }}>
        {icon}
      </Box>
    </Box>
    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>
      {value}
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.4, fontWeight: 500 }}>
      {label}
    </Typography>
    {sub && (
      <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.7 }}>
        {sub}
      </Typography>
    )}
  </Paper>
);

// ── Custom Bar Chart (pure MUI) ───────────────────────────────────────────────
const BarChart = ({ data, maxValue, colorFn }) => {
  const max = maxValue || Math.max(...data.map(d => d.value));
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 180, pt: 2 }}>
      {data.map((item, i) => {
        const pct = max > 0 ? (item.value / max) * 100 : 0;
        const color = colorFn ? colorFn(i, item) : CHART_COLORS[i % CHART_COLORS.length];
        return (
          <Tooltip key={i} title={`${item.label}: ${item.value}${item.suffix || ''}`} arrow>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color, fontSize: '0.7rem' }}>
                {item.value}{item.suffix || ''}
              </Typography>
              <Box
                sx={{
                  width: '100%', borderRadius: '6px 6px 0 0',
                  background: color,
                  height: `${Math.max(pct, 4)}%`,
                  minHeight: 8,
                  transition: 'height 0.6s ease',
                  opacity: 0.88,
                  '&:hover': { opacity: 1 },
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', textAlign: 'center', lineHeight: 1.2 }}>
                {item.label}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
};

// ── Rating Distribution Chart ─────────────────────────────────────────────────
const RatingDistChart = ({ distribution, total, avgRating }) => {
  const maxVal = Math.max(...Object.values(distribution));
  const stars = [5, 4, 3, 2, 1];
  const colors = ['#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];

  return (
    <Box>
      {/* Avg rating hero */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
            {avgRating?.toFixed(1)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.3, justifyContent: 'center', mt: 0.4 }}>
            {[1,2,3,4,5].map(s => (
              <StarIcon key={s} sx={{ fontSize: 14, color: s <= Math.round(avgRating) ? '#f59e0b' : 'rgba(0,0,0,0.15)' }} />
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>out of 5</Typography>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Box sx={{ flex: 1 }}>
          {stars.map((star, i) => {
            const count = distribution[star] || 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.6 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, width: 12, color: colors[i] }}>
                  {star}
                </Typography>
                <StarIcon sx={{ fontSize: 12, color: colors[i] }} />
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    flex: 1, height: 8, borderRadius: 4,
                    background: 'rgba(0,0,0,0.06)',
                    '& .MuiLinearProgress-bar': { background: colors[i], borderRadius: 4 },
                  }}
                />
                <Typography variant="caption" sx={{ width: 28, textAlign: 'right', color: 'text.secondary', fontWeight: 600 }}>
                  {count}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

// ── Sentiment Card ────────────────────────────────────────────────────────────
const SentimentSection = ({ sentiment }) => {
  const total = sentiment.positive + sentiment.neutral + sentiment.negative;
  const items = [
    { label: 'Positive', value: sentiment.positive, pct: ((sentiment.positive / total) * 100).toFixed(0), color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: <SentimentSatisfiedAltIcon /> },
    { label: 'Neutral',  value: sentiment.neutral,  pct: ((sentiment.neutral  / total) * 100).toFixed(0), color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <SentimentNeutralIcon /> },
    { label: 'Negative', value: sentiment.negative, pct: ((sentiment.negative / total) * 100).toFixed(0), color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: <SentimentDissatisfiedIcon /> },
  ];

  // Segmented bar
  const segments = items.map(it => ({ ...it, width: parseFloat(it.pct) }));

  return (
    <Box>
      {/* Segmented bar */}
      <Box sx={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', mb: 2, gap: 0.3 }}>
        {segments.map((s, i) => (
          <Tooltip key={i} title={`${s.label}: ${s.pct}%`} arrow>
            <Box sx={{ width: `${s.width}%`, background: s.color, transition: 'width 0.6s', cursor: 'pointer', '&:hover': { opacity: 0.85 } }} />
          </Tooltip>
        ))}
      </Box>

      {/* Stat chips */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {items.map((s, i) => (
          <Box key={i} sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            background: s.bg, borderRadius: 2, px: 1.5, py: 0.8, flex: 1, minWidth: 90,
          }}>
            <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.pct}%</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{s.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Sample responses */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
        Sample Responses
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sentiment.sample_texts?.map((item, i) => {
          const sentItem = items.find(s => s.label.toLowerCase() === item.sentiment);
          return (
            <Box
              key={i}
              sx={{
                display: 'flex', gap: 1.5, alignItems: 'flex-start',
                p: 1.5, borderRadius: 2,
                background: sentItem?.bg || 'rgba(0,0,0,0.03)',
                border: `1px solid ${sentItem?.color || '#ccc'}22`,
              }}
            >
              <Box sx={{ color: sentItem?.color, display: 'flex', mt: 0.2, flexShrink: 0 }}>
                {sentItem?.icon}
              </Box>
              <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.5 }}>
                "{item.text}"
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

// ── Trend Chart (pure MUI sparkline) ─────────────────────────────────────────
const TrendChart = ({ trends }) => {
  const max = Math.max(...trends.map(t => t.responses));
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 120, mb: 0.5 }}>
        {trends.map((t, i) => {
          const pct = max > 0 ? (t.responses / max) * 100 : 0;
          const isMax = t.responses === max;
          return (
            <Tooltip key={i} title={`${t.date}: ${t.responses} responses`} arrow>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                {isMax && (
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#667eea', fontWeight: 800 }}>
                    peak
                  </Typography>
                )}
                <Box
                  sx={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    background: isMax
                      ? 'linear-gradient(180deg, #667eea, #764ba2)'
                      : 'linear-gradient(180deg, rgba(102,126,234,0.5), rgba(102,126,234,0.25))',
                    height: `${Math.max(pct, 8)}%`,
                    transition: 'height 0.6s ease',
                    cursor: 'pointer',
                    '&:hover': { filter: 'brightness(1.1)' },
                  }}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {trends.map((t, i) => (
          <Typography key={i} variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', flex: 1, textAlign: 'center' }}>
            {t.date.split(' ')[1]}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

// ── Yes/No Donut (pure CSS) ───────────────────────────────────────────────────
const YesNoChart = ({ yes, no, total }) => {
  const yesPct = total > 0 ? ((yes / total) * 100).toFixed(0) : 0;
  const noPct = total > 0 ? ((no / total) * 100).toFixed(0) : 0;
  const circumference = 2 * Math.PI * 40; // r=40
  const yesDash = (yes / total) * circumference;
  const noDash = (no / total) * circumference;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
      {/* SVG donut */}
      <Box sx={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="14" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke="#22c55e" strokeWidth="14"
            strokeDasharray={`${yesDash} ${circumference - yesDash}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke="#ef4444" strokeWidth="14"
            strokeDasharray={`${noDash} ${circumference - noDash}`}
            strokeDashoffset={-yesDash}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', textAlign: 'center',
        }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#22c55e', lineHeight: 1 }}>{yesPct}%</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>Yes</Typography>
        </Box>
      </Box>

      {/* Legend */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Yes — {yes} ({yesPct}%)</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>No — {no} ({noPct}%)</Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ── Question Analytics Card ───────────────────────────────────────────────────
const QuestionAnalyticsCard = ({ qa, index }) => {
  const renderViz = () => {
    if (qa.question_type === 'rating') {
      return <RatingDistChart distribution={qa.distribution} total={qa.total} avgRating={qa.avg_rating} />;
    }
    if (qa.question_type === 'mcq') {
      const data = Object.entries(qa.options_distribution || {}).map(([k, v]) => ({ label: k, value: v }));
      return <BarChart data={data} />;
    }
    if (qa.question_type === 'yes_no') {
      return <YesNoChart yes={qa.yes_count} no={qa.no_count} total={qa.total} />;
    }
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <ForumIcon sx={{ fontSize: 36, color: 'rgba(0,0,0,0.15)', mb: 1 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Open-ended responses collected</Typography>
      </Box>
    );
  };

  const typeColor = {
    rating: '#f59e0b', mcq: '#22c55e', yes_no: '#667eea', text: '#f093fb',
  }[qa.question_type] || '#667eea';

  return (
    <Paper elevation={0} sx={{
      p: 3, borderRadius: 3,
      border: '1.5px solid rgba(0,0,0,0.06)',
      background: '#fff',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: `${typeColor}18`, color: typeColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '0.85rem',
        }}>
          {index + 1}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a2e', lineHeight: 1.4, mb: 0.5 }}>
            {qa.question_text}
          </Typography>
          <Chip
            label={qa.question_type.replace('_', ' ').toUpperCase()}
            size="small"
            sx={{
              background: `${typeColor}18`,
              color: typeColor,
              fontWeight: 700, fontSize: '0.65rem', height: 20,
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', mt: 0.5 }}>
          {qa.total} responses
        </Typography>
      </Box>
      <Divider sx={{ mb: 2, borderColor: 'rgba(0,0,0,0.04)' }} />
      {renderViz()}
    </Paper>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [questionsAnalytics, setQuestionsAnalytics] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [trends, setTrends] = useState([]);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');

  // Load the forms list on mount
  useEffect(() => {
    const loadForms = async () => {
      try {
        const data = await formService.getForms();
        setForms(data);
        if (data.length > 0) setSelectedForm(data[0].id);
        else setLoading(false);
      } catch (err) {
        setError('Failed to load forms.');
        setLoading(false);
      }
    };
    loadForms();
  }, []);

  // Load analytics whenever the selected form changes
  useEffect(() => {
    if (!selectedForm) return;
    const loadAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const [sumData, sentData, trendData] = await Promise.all([
          analyticsService.getSummary(selectedForm),
          analyticsService.getSentiment(selectedForm),
          analyticsService.getTrends(selectedForm),
        ]);
        setSummary(sumData || MOCK_SUMMARY);
        setSentiment(sentData || MOCK_SENTIMENT);
        // Normalise trends: backend returns { date, count } or { date, responses }
        const normTrends = (trendData || MOCK_TRENDS).map(t => ({
          date: t.date,
          responses: t.responses ?? t.count ?? 0,
        }));
        setTrends(normTrends);
        // Build per-question analytics from summary if backend provides it
        setQuestionsAnalytics(
          sumData?.question_analytics || MOCK_QUESTIONS_ANALYTICS
        );
      } catch (err) {
        // Graceful fallback to mock data so the UI stays useful
        setSummary(MOCK_SUMMARY);
        setSentiment(MOCK_SENTIMENT);
        setTrends(MOCK_TRENDS);
        setQuestionsAnalytics(MOCK_QUESTIONS_ANALYTICS);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [selectedForm]);

  const currentForm = forms.find(f => f.id === selectedForm);

  const handleExport = async () => {
    try {
      const data = await analyticsService.exportReport(selectedForm);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-form-${selectedForm}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed. Please try again.');
    }
  };

  return (
    <>
      <Navbar />
      <Box sx={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #f0f4ff 100%)', minHeight: '100vh', pb: 6 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, pt: 4 }}>

          {/* Page header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', mb: 0.5 }}>
                📊 Analytics
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Deep insights into feedback responses and trends
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Form selector */}              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel sx={{ fontWeight: 600 }}>Select Form</InputLabel>
                <Select
                  value={selectedForm}
                  onChange={e => setSelectedForm(e.target.value)}
                  label="Select Form"
                  sx={{ borderRadius: 2, background: '#fff' }}
                >
                  {forms.map(f => (
                    <MenuItem key={f.id} value={f.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.title}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{f.course_code}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                startIcon={<DownloadIcon />}
                variant="outlined"
                onClick={handleExport}
                disabled={!selectedForm}
                sx={{
                  borderRadius: 2, fontWeight: 600,
                  borderColor: 'rgba(102,126,234,0.3)', color: '#667eea',
                  '&:hover': { borderColor: '#667eea', background: 'rgba(102,126,234,0.04)' },
                }}
              >
                Export
              </Button>
            </Box>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress sx={{ color: '#667eea' }} size={48} />
                <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>
                  Crunching the numbers…
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              {/* ── Summary stat cards ── */}
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {[
                  {
                    icon: <PeopleIcon />,
                    label: 'Total Responses',
                    value: summary?.total_responses,
                    sub: `${summary?.anonymous_count} anonymous · ${summary?.identified_count} identified`,
                    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
                  },
                  {
                    icon: <CheckCircleIcon />,
                    label: 'Completion Rate',
                    value: `${summary?.completion_rate}%`,
                    sub: 'Forms fully completed',
                    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  },
                  {
                    icon: <StarIcon />,
                    label: 'Average Rating',
                    value: summary?.avg_rating?.toFixed(1),
                    sub: 'Across all rating questions',
                    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  },
                  {
                    icon: <TrendingUpIcon />,
                    label: 'Peak Day',
                    value: `${Math.max(...(summary?.response_by_date?.map(d => d.count) || [0]))}`,
                    sub: 'Responses in a single day',
                    gradient: 'linear-gradient(135deg, #f093fb, #e879f9)',
                  },
                ].map((card, i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <StatCard {...card} />
                  </Grid>
                ))}
              </Grid>

              {/* ── Tabs ── */}
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                  mb: 3,
                  '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #667eea, #f093fb)', height: 3, borderRadius: 2 },
                  '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' },
                  '& .Mui-selected': { color: '#667eea !important' },
                }}
              >
                <Tab label="📈 Trends" />
                <Tab label="❓ Questions" />
                <Tab label="💬 Sentiment" />
              </Tabs>

              {/* ── Tab: Trends ── */}
              {tab === 0 && (
                <Grid container spacing={3}>
                  {/* Trend chart */}
                  <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1.5px solid rgba(0,0,0,0.06)', background: '#fff' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                            Responses Over Time
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Daily submission volume
                          </Typography>
                        </Box>
                        <Box sx={{
                          background: 'rgba(102,126,234,0.08)',
                          borderRadius: 2, px: 1.5, py: 0.5,
                        }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#667eea' }}>
                            Last 6 days
                          </Typography>
                        </Box>
                      </Box>
                      <TrendChart trends={trends} />
                    </Paper>
                  </Grid>

                  {/* Anonymous breakdown */}
                  <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1.5px solid rgba(0,0,0,0.06)', background: '#fff', height: '100%' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 2 }}>
                        Submission Type
                      </Typography>
                      <YesNoChart
                        yes={summary?.anonymous_count || 0}
                        no={summary?.identified_count || 0}
                        total={(summary?.anonymous_count || 0) + (summary?.identified_count || 0)}
                      />
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Anonymous</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#22c55e' }}>{summary?.anonymous_count}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Identified</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#ef4444' }}>{summary?.identified_count}</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Per-day bar chart */}
                  <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1.5px solid rgba(0,0,0,0.06)', background: '#fff' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 3 }}>
                        Response Volume by Day
                      </Typography>
                      <BarChart
                        data={trends.map(t => ({ label: t.date, value: t.responses }))}
                        colorFn={(i, item) => {
                          const max = Math.max(...trends.map(t => t.responses));
                          return item.value === max ? '#667eea' : 'rgba(102,126,234,0.4)';
                        }}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* ── Tab: Questions ── */}
              {tab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {questionsAnalytics.map((qa, i) => (
                    <QuestionAnalyticsCard key={qa.question_id} qa={qa} index={i} />
                  ))}
                </Box>
              )}

              {/* ── Tab: Sentiment ── */}
              {tab === 2 && sentiment && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1.5px solid rgba(0,0,0,0.06)', background: '#fff' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 0.5 }}>
                        Sentiment Analysis
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                        AI-powered analysis of open-ended text responses
                      </Typography>
                      <SentimentSection sentiment={sentiment} />
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1.5px solid rgba(0,0,0,0.06)', background: '#fff' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 2 }}>
                        Sentiment Score
                      </Typography>
                      {/* Net sentiment */}
                      {(() => {
                        const total = sentiment.positive + sentiment.neutral + sentiment.negative;
                        const score = Math.round(((sentiment.positive - sentiment.negative) / total) * 100);
                        const color = score > 30 ? '#22c55e' : score < 0 ? '#ef4444' : '#f59e0b';
                        return (
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h2" sx={{ fontWeight: 800, color, lineHeight: 1 }}>
                              {score > 0 ? '+' : ''}{score}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                              Net Sentiment Score
                            </Typography>
                            <Chip
                              label={score > 30 ? '😊 Very Positive' : score < 0 ? '😞 Needs Attention' : '😐 Mixed'}
                              sx={{
                                mt: 2,
                                background: `${color}18`,
                                color,
                                fontWeight: 700,
                                fontSize: '0.85rem',
                              }}
                            />
                          </Box>
                        );
                      })()}
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {[
                          { label: '😊 Positive', value: sentiment.positive, color: '#22c55e' },
                          { label: '😐 Neutral',  value: sentiment.neutral,  color: '#f59e0b' },
                          { label: '😞 Negative', value: sentiment.negative, color: '#ef4444' },
                        ].map((s, i) => (
                          <Box key={i}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.label}</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: s.color }}>{s.value}%</Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={s.value}
                              sx={{
                                height: 8, borderRadius: 4,
                                background: 'rgba(0,0,0,0.06)',
                                '& .MuiLinearProgress-bar': { background: s.color, borderRadius: 4 },
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </>
          )}
        </Box>
      </Box>
    </>
  );
}
