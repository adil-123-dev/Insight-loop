import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Switch, FormControlLabel,
  IconButton, Tooltip, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/AddRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DragIndicatorIcon from '@mui/icons-material/DragIndicatorRounded';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import StarIcon from '@mui/icons-material/StarRounded';
import TextFieldsIcon from '@mui/icons-material/TextFieldsRounded';
import ListIcon from '@mui/icons-material/ListRounded';
import CheckBoxIcon from '@mui/icons-material/CheckBoxRounded';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../utils/useToast';
import { useAuth } from '../context/AuthContext';

// ── Question type config ──────────────────────────────────────────────────────
const Q_TYPES = {
  rating: { label: 'Rating',       icon: <StarIcon />,       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   desc: '1–5 star scale' },
  text:   { label: 'Text',         icon: <TextFieldsIcon />, color: '#667eea', bg: 'rgba(102,126,234,0.1)', desc: 'Open-ended answer' },
  mcq:    { label: 'Multiple Choice', icon: <ListIcon />,    color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   desc: 'Select one option' },
  yes_no: { label: 'Yes / No',     icon: <CheckBoxIcon />,   color: '#f093fb', bg: 'rgba(240,147,251,0.1)', desc: 'Binary choice' },
};

import formService from '../services/formService';

// ── Question Type Badge ───────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const t = Q_TYPES[type] || Q_TYPES.text;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6,
      background: t.bg, color: t.color, px: 1.2, py: 0.4,
      borderRadius: 1.5, width: 'fit-content' }}>
      {React.cloneElement(t.icon, { sx: { fontSize: 14 } })}
      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{t.label}</Typography>
    </Box>
  );
};

// ── Question Card ─────────────────────────────────────────────────────────────
const QuestionCard = ({ question, index, onEdit, onDelete, canEdit }) => (
  <Box sx={{
    background: '#fff', borderRadius: 3, p: 3,
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    display: 'flex', alignItems: 'flex-start', gap: 2,
    transition: 'all 0.2s',
    '&:hover': { boxShadow: '0 8px 28px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' },
    borderLeft: `4px solid ${Q_TYPES[question.question_type]?.color || '#667eea'}`,
  }}>
    {/* Drag handle */}
    {canEdit && (
      <Box sx={{ color: '#ccc', mt: 0.5, cursor: 'grab' }}>
        <DragIndicatorIcon />
      </Box>
    )}

    {/* Order number */}
    <Box sx={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#667eea,#764ba2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{index + 1}</Typography>
    </Box>

    {/* Content */}
    <Box sx={{ flex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
        <TypeBadge type={question.question_type} />
        {question.is_required && (
          <Chip label="Required" size="small"
            sx={{ fontSize: 11, fontWeight: 700, height: 22,
              background: 'rgba(239,68,68,0.1)', color: '#ef4444' }} />
        )}
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e', mb: 0.5 }}>
        {question.question_text}
      </Typography>

      {/* MCQ Options preview */}
      {question.question_type === 'mcq' && question.options?.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1 }}>
          {question.options.map((opt, i) => (
            <Chip key={i} label={opt} size="small"
              sx={{ fontSize: 12, background: '#f4f6fb', color: '#555', height: 24 }} />
          ))}
        </Box>
      )}

      {/* Type description */}
      <Typography sx={{ fontSize: 12, color: '#aaa', mt: 0.8 }}>
        {Q_TYPES[question.question_type]?.desc}
      </Typography>
    </Box>

    {/* Actions */}
    {canEdit && (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Edit Question">
          <IconButton size="small" onClick={() => onEdit(question)}
            sx={{ color: '#667eea', border: '1px solid rgba(102,126,234,0.3)', borderRadius: 1.5,
              '&:hover': { background: 'rgba(102,126,234,0.08)' } }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Question">
          <IconButton size="small" onClick={() => onDelete(question.id)}
            sx={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 1.5,
              '&:hover': { background: 'rgba(239,68,68,0.08)' } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    )}
  </Box>
);

// ── Add / Edit Question Dialog ────────────────────────────────────────────────
const QuestionDialog = ({ open, onClose, onSave, editData }) => {
  const blank = { question_text: '', question_type: 'rating', is_required: false, options: [] };
  const [form, setForm] = useState(blank);
  const [optionInput, setOptionInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate when editing
  useEffect(() => {
    if (editData) {
      setForm({ ...editData, options: editData.options || [] });
    } else {
      setForm(blank);
    }
    setOptionInput('');
    setError('');
  }, [editData, open]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const addOption = () => {
    const val = optionInput.trim();
    if (!val || form.options.includes(val)) return;
    setForm((prev) => ({ ...prev, options: [...prev.options, val] }));
    setOptionInput('');
  };

  const removeOption = (opt) => {
    setForm((prev) => ({ ...prev, options: prev.options.filter((o) => o !== opt) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.question_text.trim()) { setError('Question text is required.'); return; }
    if (form.question_type === 'mcq' && form.options.length < 2) {
      setError('Multiple choice questions need at least 2 options.'); return;
    }
    setLoading(true);
    try {
      await onSave({
        ...form,
        options: form.question_type === 'mcq' ? form.options : null,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save question.');
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '&:hover fieldset': { borderColor: '#667eea' },
      '&.Mui-focused fieldset': { borderColor: '#667eea' },
    },
  };

  const isMCQ = form.question_type === 'mcq';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 20, color: '#1a1a2e', pb: 0 }}>
        {editData ? '✏️ Edit Question' : '➕ Add Question'}
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

          {/* Question Type */}
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 13, color: '#333', mb: 1 }}>Question Type</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              {Object.entries(Q_TYPES).map(([key, t]) => (
                <Box key={key} onClick={() => setForm((p) => ({ ...p, question_type: key }))}
                  sx={{
                    p: 1.5, borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
                    border: `2px solid ${form.question_type === key ? t.color : '#e5e7eb'}`,
                    background: form.question_type === key ? t.bg : '#fafafa',
                    transition: 'all 0.15s',
                  }}>
                  {React.cloneElement(t.icon, { sx: { color: t.color, fontSize: 20 } })}
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{t.label}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#888' }}>{t.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Question Text */}
          <TextField required fullWidth multiline rows={2} label="Question Text"
            name="question_text" value={form.question_text} onChange={handleChange}
            placeholder="e.g. How clear were the lectures?" sx={fieldSx} />

          {/* MCQ Options */}
          {isMCQ && (
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 13, color: '#333', mb: 1 }}>
                Answer Options <Typography component="span" sx={{ color: '#888', fontWeight: 400 }}>(min. 2)</Typography>
              </Typography>

              {/* Existing options */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.5 }}>
                {form.options.map((opt) => (
                  <Chip key={opt} label={opt} onDelete={() => removeOption(opt)}
                    sx={{ background: 'rgba(102,126,234,0.1)', color: '#667eea', fontWeight: 600 }} />
                ))}
              </Box>

              {/* Add new option */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField size="small" fullWidth placeholder="Type an option..."
                  value={optionInput} onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                  sx={fieldSx} />
                <Button onClick={addOption} variant="outlined"
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700,
                    borderColor: '#667eea', color: '#667eea', px: 2,
                    '&:hover': { background: 'rgba(102,126,234,0.08)' } }}>
                  Add
                </Button>
              </Box>
            </Box>
          )}

          {/* Required toggle */}
          <FormControlLabel
            control={
              <Switch checked={form.is_required} name="is_required"
                onChange={handleChange}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#667eea' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#667eea' } }} />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Required</Typography>
                <Typography sx={{ fontSize: 12, color: '#888' }}>Students must answer this question</Typography>
              </Box>
            }
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={onClose}
            sx={{ borderRadius: 2, textTransform: 'none', color: '#666' }}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}
            sx={{
              borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3,
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              boxShadow: '0 4px 16px rgba(102,126,234,0.4)',
            }}>
            {loading
              ? <CircularProgress size={20} sx={{ color: '#fff' }} />
              : editData ? 'Save Changes' : 'Add Question'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

// ── QuestionsPage ─────────────────────────────────────────────────────────────
const QuestionsPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'instructor' || user?.role === 'admin';
  const [form, setForm] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const { toast, showToast, closeToast } = useToast();
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  // ── Load form + questions from real API ─────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [formData, questionsData] = await Promise.all([
          formService.getForm(formId),
          formService.getQuestions(formId),
        ]);
        setForm(formData);
        setQuestions(questionsData);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [formId]);
  // ── Save (Add or Edit) via real API ────────────────────────────────────────
  const handleSave = async (data) => {
    if (editQuestion) {
      const updated = await formService.updateQuestion(editQuestion.id, data);
      setQuestions((prev) => prev.map((q) => q.id === editQuestion.id ? updated : q));
    } else {
      const newQ = await formService.addQuestion(formId, {
        ...data,
        order: questions.length + 1,
      });
      setQuestions((prev) => [...prev, newQ]);
    }
    setEditQuestion(null);
  };
  // ── Delete via real API ─────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setConfirm({
      open: true,
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question? This cannot be undone.',
      onConfirm: async () => {
        try {
          await formService.deleteQuestion(id);
          setQuestions((prev) =>
            prev.filter((q) => q.id !== id).map((q, i) => ({ ...q, order: i + 1 }))
          );
          showToast('Question deleted.', 'info');
        } catch (err) {
          showToast(err.response?.data?.detail || 'Failed to delete question.', 'error');
        }
      },
    });
  };

  // ── Open edit dialog ──
  const handleEdit = (question) => {
    setEditQuestion(question);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditQuestion(null);
    setDialogOpen(true);
  };

  // ── Type summary counts ──
  const typeCounts = Object.keys(Q_TYPES).reduce((acc, type) => {
    acc[type] = questions.filter((q) => q.question_type === type).length;
    return acc;
  }, {});

  return (
    <Box sx={{ minHeight: '100vh', background: '#f4f6fb' }}>
      <Navbar />

      <Box sx={{ px: { xs: 2, md: 5 }, py: 4 }}>

        {/* Back button */}
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/forms')}
          sx={{ textTransform: 'none', color: '#667eea', fontWeight: 600, mb: 3,
            '&:hover': { background: 'rgba(102,126,234,0.08)' }, borderRadius: 2 }}>
          Back to Forms
        </Button>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#667eea' }} />
          </Box>
        ) : (
          <>
            {/* Form Info Banner */}
            <Box sx={{
              borderRadius: 3, p: { xs: 3, md: 4 }, mb: 4,
              background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>
              <Box sx={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%',
                top: '-50px', right: '8%', background: 'rgba(102,126,234,0.25)', filter: 'blur(40px)' }} />
              <Box sx={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%',
                bottom: '-30px', right: '30%', background: 'rgba(240,147,251,0.15)', filter: 'blur(30px)' }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Chip label={form?.status?.toUpperCase()} size="small"
                    sx={{ background: form?.status === 'published' ? '#22c55e' : '#f59e0b',
                      color: '#fff', fontWeight: 700, fontSize: 11, mb: 1.5 }} />
                  <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: 18, md: 24 }, mb: 0.5 }}>
                    {form?.title}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                    {form?.course_code} · {form?.course_name}
                  </Typography>
                </Box>

                {/* Stats pills */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Total', value: questions.length, color: '#fff' },
                    { label: 'Required', value: questions.filter((q) => q.is_required).length, color: '#fca5a5' },
                    { label: 'Optional', value: questions.filter((q) => !q.is_required).length, color: '#86efac' },
                  ].map((s) => (
                    <Box key={s.label} sx={{
                      background: 'rgba(255,255,255,0.1)', borderRadius: 2, px: 2, py: 1,
                      textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)',
                    }}>
                      <Typography sx={{ color: s.color, fontWeight: 800, fontSize: 20, lineHeight: 1 }}>{s.value}</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, mt: 0.2 }}>{s.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Type summary chips */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
              {Object.entries(Q_TYPES).map(([key, t]) => (
                <Box key={key} sx={{
                  display: 'flex', alignItems: 'center', gap: 0.8,
                  background: '#fff', border: `1px solid ${t.color}33`,
                  borderRadius: 2, px: 1.5, py: 0.8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  {React.cloneElement(t.icon, { sx: { color: t.color, fontSize: 16 } })}
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#555' }}>
                    {t.label}: <strong style={{ color: t.color }}>{typeCounts[key]}</strong>
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Page header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#1a1a2e' }}>
                Questions
                <Typography component="span" sx={{ fontSize: 14, color: '#888', fontWeight: 400, ml: 1 }}>
                  ({questions.length} total)
                </Typography>
              </Typography>

              {canEdit && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}
                  sx={{
                    textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3, py: 1.2,
                    background: 'linear-gradient(135deg,#667eea,#764ba2)',
                    boxShadow: '0 4px 16px rgba(102,126,234,0.4)',
                    '&:hover': { boxShadow: '0 8px 24px rgba(102,126,234,0.5)', transform: 'translateY(-1px)' },
                    transition: 'all 0.2s',
                  }}>
                  Add Question
                </Button>
              )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            {/* Questions list */}
            {questions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography sx={{ fontSize: 60, mb: 2 }}>❓</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 20, color: '#1a1a2e', mb: 1 }}>No questions yet</Typography>
                <Typography sx={{ color: '#888', mb: 3 }}>
                  Add your first question to this feedback form.
                </Typography>
                {canEdit && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
                      background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                    Add First Question
                  </Button>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {questions
                  .sort((a, b) => a.order - b.order)
                  .map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      index={i}
                      canEdit={canEdit}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}

                {/* Add another question CTA */}
                {canEdit && (
                  <Box
                    onClick={handleAddNew}
                    sx={{
                      border: '2px dashed #d1d5db', borderRadius: 3, p: 3,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                      cursor: 'pointer', color: '#9ca3af',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: '#667eea', color: '#667eea', background: 'rgba(102,126,234,0.04)' },
                    }}
                  >
                    <AddIcon />
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Add another question</Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Box>      {/* Add / Edit Dialog */}
      <QuestionDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditQuestion(null); }}
        onSave={handleSave}
        editData={editQuestion}
      />

      <Toast open={toast.open} message={toast.message} severity={toast.severity} onClose={closeToast} />
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onClose={() => setConfirm(c => ({ ...c, open: false }))}
      />
    </Box>
  );
};

export default QuestionsPage;
