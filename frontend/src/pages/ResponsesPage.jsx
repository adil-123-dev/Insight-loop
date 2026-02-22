import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Paper, Chip, Avatar, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider, Skeleton, Tooltip, Stack, LinearProgress, Alert,
  Card, CardContent, Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonIcon from '@mui/icons-material/Person';
import QuizIcon from '@mui/icons-material/Quiz';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ListIcon from '@mui/icons-material/List';
import formService from '../services/formService';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import useToast from '../utils/useToast';

// ── Helper: question type badge ───────────────────────────────────────────────
const QuestionTypeBadge = ({ type }) => {
  const map = {
    rating:  { icon: <StarIcon sx={{ fontSize: 13 }} />,        label: 'Rating',  color: '#f59e0b', bg: '#fef3c7' },
    text:    { icon: <TextFieldsIcon sx={{ fontSize: 13 }} />,   label: 'Text',    color: '#3b82f6', bg: '#dbeafe' },
    mcq:     { icon: <ListIcon sx={{ fontSize: 13 }} />,         label: 'MCQ',     color: '#8b5cf6', bg: '#ede9fe' },
    yes_no:  { icon: <CheckCircleIcon sx={{ fontSize: 13 }} />,  label: 'Yes/No',  color: '#10b981', bg: '#d1fae5' },
  };
  const m = map[type] || map.text;
  return (
    <Chip
      icon={m.icon}
      label={m.label}
      size="small"
      sx={{
        bgcolor: m.bg, color: m.color, fontWeight: 700, fontSize: 11,
        border: `1px solid ${m.color}30`,
        '& .MuiChip-icon': { color: m.color },
      }}
    />
  );
};

// ── Helper: render answer value nicely ────────────────────────────────────────
const AnswerDisplay = ({ value, type }) => {
  if (!value) return <Typography color="text.disabled" fontSize={13}>—</Typography>;

  if (type === 'rating') {
    const num = parseInt(value, 10);
    return (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        {[1,2,3,4,5].map(i => (
          <StarIcon key={i} sx={{ fontSize: 16, color: i <= num ? '#f59e0b' : '#e5e7eb' }} />
        ))}
        <Typography fontSize={13} fontWeight={700} color="#92400e" sx={{ ml: 0.5 }}>
          {value}/5
        </Typography>
      </Stack>
    );
  }
  if (type === 'yes_no') {
    const isYes = value?.toLowerCase() === 'yes';
    return (
      <Chip
        label={isYes ? '✓ Yes' : '✗ No'}
        size="small"
        sx={{
          bgcolor: isYes ? '#d1fae5' : '#fee2e2',
          color: isYes ? '#065f46' : '#991b1b',
          fontWeight: 700, fontSize: 12,
        }}
      />
    );
  }
  return <Typography fontSize={13} sx={{ lineHeight: 1.5 }}>{value}</Typography>;
};

// ── Response Detail Dialog ────────────────────────────────────────────────────
const ResponseDetailDialog = ({ open, onClose, responseId, questions }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !responseId) return;
    setLoading(true);
    formService.getResponse(responseId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [open, responseId]);

  // Build a map of questionId → question object for rich display
  const questionMap = {};
  (questions || []).forEach(q => { questionMap[q.id] = q; });

  const formatDate = (dt) =>
    dt ? new Date(dt).toLocaleString('en-US', {
      dateStyle: 'medium', timeStyle: 'short',
    }) : '—';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{
        background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
        color: '#fff', fontWeight: 800, fontSize: 18, pb: 2,
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <QuizIcon />
        Response Detail
        {detail && (
          <Chip
            label={detail.is_anonymous ? 'Anonymous' : detail.student_email || 'Known'}
            size="small"
            sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}
          />
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 1 }}>
        {loading ? (
          <Stack spacing={2}>
            {[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />)}
          </Stack>
        ) : !detail ? (
          <Alert severity="error">Could not load response details.</Alert>
        ) : (
          <>
            {/* Meta info */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#f8fafc' }}>
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <Box>
                  <Typography fontSize={11} color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
                    Submitted
                  </Typography>
                  <Typography fontSize={14} fontWeight={600}>{formatDate(detail.submitted_at)}</Typography>
                </Box>
                <Box>
                  <Typography fontSize={11} color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
                    Student
                  </Typography>
                  <Typography fontSize={14} fontWeight={600}>
                    {detail.is_anonymous ? '🔒 Anonymous' : (detail.student_email || `ID #${detail.student_id}`)}
                  </Typography>
                </Box>
                <Box>
                  <Typography fontSize={11} color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
                    Answers
                  </Typography>
                  <Typography fontSize={14} fontWeight={600}>{detail.answers?.length ?? 0}</Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Answers */}
            <Stack spacing={2}>
              {(detail.answers || []).map((ans, idx) => {
                const q = questionMap[ans.question_id];
                return (
                  <Paper key={ans.id} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography fontSize={13} fontWeight={700} color="text.secondary">
                        Q{idx + 1}. {q?.question_text || `Question #${ans.question_id}`}
                        {q?.is_required && (
                          <Chip label="Required" size="small"
                            sx={{ ml: 1, fontSize: 10, height: 18, bgcolor: '#fee2e2', color: '#991b1b' }} />
                        )}
                      </Typography>
                      {q && <QuestionTypeBadge type={q.question_type} />}
                    </Stack>
                    <Box sx={{ pl: 1 }}>
                      <AnswerDisplay value={ans.answer_value} type={q?.question_type || 'text'} />
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main ResponsesPage ────────────────────────────────────────────────────────
export default function ResponsesPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, closeToast } = useToast();

  const [form, setForm]               = useState(null);
  const [responses, setResponses]     = useState([]);
  const [questions, setQuestions]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedId, setSelectedId]   = useState(null);
  const [detailOpen, setDetailOpen]   = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [formData, responseData, questionData] = await Promise.all([
        formService.getForm(formId),
        formService.getResponses(formId),
        formService.getQuestions(formId),
      ]);
      setForm(formData);
      setResponses(responseData);
      setQuestions(questionData);
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Failed to load responses', 'error');
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => { load(); }, [load]);

  const handleViewDetail = (responseId) => {
    setSelectedId(responseId);
    setDetailOpen(true);
  };

  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      const response = await import('../services/api').then(m => m.default.get(
        `/forms/${formId}/responses/export`,
        { responseType: 'blob' }
      ));
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `form_${formId}_responses.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('CSV downloaded!', 'success');
    } catch {
      showToast('Export failed — no responses yet or server error.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dt) =>
    dt ? new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  // ── Stat cards ──────────────────────────────────────────────────────────────
  const totalResponses  = responses.length;
  const anonCount       = responses.filter(r => r.is_anonymous).length;
  const knownCount      = totalResponses - anonCount;
  const avgAnswers      = totalResponses
    ? Math.round(responses.reduce((s, r) => s + (r.answer_count || 0), 0) / totalResponses)
    : 0;

  const stats = [
    { label: 'Total Responses', value: totalResponses, icon: '📋', color: '#667eea', bg: 'linear-gradient(135deg,#667eea,#764ba2)' },
    { label: 'Anonymous',       value: anonCount,      icon: '🔒', color: '#10b981', bg: 'linear-gradient(135deg,#10b981,#059669)' },
    { label: 'Identified',      value: knownCount,     icon: '👤', color: '#f59e0b', bg: 'linear-gradient(135deg,#f59e0b,#d97706)' },
    { label: 'Avg Answers',     value: avgAnswers,     icon: '✏️', color: '#3b82f6', bg: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Navbar />

      <Container maxWidth="xl" sx={{ pt: 4, pb: 6 }}>
        {/* ── Header ── */}
        <Stack direction="row" alignItems="flex-start" spacing={2} mb={3}>
          <IconButton onClick={() => navigate('/forms')}
            sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', mt: 0.5,
              '&:hover': { bgcolor: '#f3f4f6' } }}>
            <ArrowBackIcon />
          </IconButton>
          <Box flex={1}>
            {loading ? (
              <>
                <Skeleton width={280} height={36} />
                <Skeleton width={200} height={22} sx={{ mt: 0.5 }} />
              </>
            ) : (
              <>
                <Typography variant="h4" fontWeight={800} color="#1e293b" lineHeight={1.2}>
                  📋 {form?.title || `Form #${formId}`}
                </Typography>
                <Typography color="text.secondary" fontSize={14} mt={0.5}>
                  {form?.course_code && <><strong>{form.course_code}</strong> · </>}
                  Response submissions viewer
                </Typography>
              </>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadCSV}
            disabled={downloading || loading || totalResponses === 0}
            sx={{
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              fontWeight: 700, borderRadius: 2, px: 2.5,
              '&:hover': { background: 'linear-gradient(135deg,#5a6fd8,#6a3f91)' },
            }}
          >
            {downloading ? 'Exporting…' : 'Export CSV'}
          </Button>
        </Stack>

        {/* ── Stat Cards ── */}
        <Grid container spacing={2.5} mb={4}>
          {stats.map(s => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'visible' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography fontSize={12} fontWeight={700} color="text.secondary"
                        textTransform="uppercase" letterSpacing={0.5} mb={0.5}>
                        {s.label}
                      </Typography>
                      {loading ? <Skeleton width={40} height={40} /> : (
                        <Typography fontSize={32} fontWeight={900} color={s.color} lineHeight={1}>
                          {s.value}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '12px',
                      background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>
                      {s.icon}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ── Responses Table ── */}
        <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {/* Table header bar */}
          <Box sx={{
            px: 3, py: 2,
            background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Typography fontWeight={800} color="#fff" fontSize={16}>
              All Submissions
            </Typography>
            <Chip label={`${totalResponses} total`}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }} />
          </Box>

          {loading ? (
            <Box sx={{ px: 3, py: 3 }}>
              <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />
              {[1,2,3,4].map(i => (
                <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 1, mb: 1 }} />
              ))}
            </Box>
          ) : responses.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <Typography fontSize={52} mb={1}>📭</Typography>
              <Typography fontWeight={700} fontSize={18} color="text.secondary">No responses yet</Typography>
              <Typography fontSize={13} color="text.disabled" mt={0.5}>
                Students haven't submitted any feedback for this form.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    {['#', 'Student', 'Submitted At', 'Answers', 'Privacy', 'Action'].map(h => (
                      <TableCell key={h} sx={{
                        fontWeight: 800, fontSize: 12, color: '#64748b',
                        textTransform: 'uppercase', letterSpacing: 0.5,
                        borderBottom: '2px solid #e5e7eb',
                      }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {responses.map((r, idx) => (
                    <TableRow key={r.id} hover
                      sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }}
                      onClick={() => handleViewDetail(r.id)}
                    >
                      <TableCell sx={{ fontWeight: 700, color: '#94a3b8', fontSize: 13 }}>
                        #{idx + 1}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{
                            width: 34, height: 34, fontSize: 14, fontWeight: 700,
                            bgcolor: r.is_anonymous ? '#e5e7eb' : '#667eea',
                            color: r.is_anonymous ? '#9ca3af' : '#fff',
                          }}>
                            {r.is_anonymous ? <PersonOffIcon sx={{ fontSize: 18 }} /> : (
                              r.student_email?.[0]?.toUpperCase() || <PersonIcon sx={{ fontSize: 18 }} />
                            )}
                          </Avatar>
                          <Box>
                            <Typography fontSize={13} fontWeight={600} color="#1e293b">
                              {r.is_anonymous ? 'Anonymous Student' : (r.student_email || `Student #${r.student_id}`)}
                            </Typography>
                            {!r.is_anonymous && r.student_id && (
                              <Typography fontSize={11} color="text.secondary">ID #{r.student_id}</Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13} color="#374151">{formatDate(r.submitted_at)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${r.answer_count} answers`}
                          size="small"
                          sx={{ bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 700, fontSize: 12 }}
                        />
                      </TableCell>
                      <TableCell>
                        {r.is_anonymous ? (
                          <Chip icon={<PersonOffIcon sx={{ fontSize: 14 }} />} label="Anonymous"
                            size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600 }} />
                        ) : (
                          <Chip icon={<PersonIcon sx={{ fontSize: 14 }} />} label="Identified"
                            size="small" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 600 }} />
                        )}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Tooltip title="View full response">
                          <IconButton size="small" onClick={() => handleViewDetail(r.id)}
                            sx={{
                              bgcolor: '#f0f0ff', color: '#667eea',
                              '&:hover': { bgcolor: '#e0e0ff' },
                            }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>

      {/* ── Detail Dialog ── */}
      <ResponseDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        responseId={selectedId}
        questions={questions}
      />

      <Toast {...toast} onClose={closeToast} />
    </Box>
  );
}
