import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Alert, Tooltip,
} from '@mui/material';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../utils/useToast';
import AddIcon from '@mui/icons-material/AddRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import VisibilityIcon from '@mui/icons-material/VisibilityRounded';
import SendIcon from '@mui/icons-material/SendRounded';
import PublishIcon from '@mui/icons-material/PublishRounded';
import LockIcon from '@mui/icons-material/LockRounded';
import AssignmentIcon from '@mui/icons-material/AssignmentRounded';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import formService from '../services/formService';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  draft:     { label: 'Draft',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  published: { label: 'Published', color: '#22c55e', bg: 'rgba(34,197,94,0.12)'   },
  closed:    { label: 'Closed',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'    },
};

// ── Form Card ─────────────────────────────────────────────────────────────────
const FormCard = ({ form, onDelete, onStatusChange, onViewQuestions, onSubmitFeedback, onViewResponses, canEdit }) => {
  const s = STATUS[form.status] || STATUS.draft;
  return (
    <Box sx={{
      background: '#fff', borderRadius: 3, p: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column', gap: 1.5,
      transition: 'all 0.2s',
      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' },
      borderLeft: `4px solid ${s.color}`,
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Chip label={s.label} size="small"
            sx={{ background: s.bg, color: s.color, fontWeight: 700, fontSize: 11, mb: 1 }} />
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e', lineHeight: 1.3 }}>
            {form.title}
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#888', mt: 0.3 }}>
            {form.course_code} · {form.course_name}
          </Typography>
        </Box>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(135deg,#667eea,#764ba2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AssignmentIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
      </Box>

      {/* Description */}
      {form.description && (
        <Typography sx={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}
          noWrap>{form.description}</Typography>
      )}

      {/* Dates */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {form.open_date && (
          <Typography sx={{ fontSize: 12, color: '#aaa' }}>
            📅 Opens: {new Date(form.open_date).toLocaleDateString()}
          </Typography>
        )}
        {form.close_date && (
          <Typography sx={{ fontSize: 12, color: '#aaa' }}>
            🔒 Closes: {new Date(form.close_date).toLocaleDateString()}
          </Typography>
        )}
      </Box>      {/* Actions */}      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
        <Tooltip title="View / Add Questions">
          <Button size="small" startIcon={<VisibilityIcon />}
            onClick={() => onViewQuestions(form.id)}
            sx={{ textTransform: 'none', fontSize: 12, borderRadius: 2, color: '#667eea',
              border: '1px solid rgba(102,126,234,0.3)',
              '&:hover': { background: 'rgba(102,126,234,0.08)' } }}>
            Questions
          </Button>
        </Tooltip>

        {/* Instructor/Admin: View Responses */}
        {canEdit && (
          <Tooltip title="View student submissions">
            <Button size="small" startIcon={<PeopleAltIcon />}
              onClick={() => onViewResponses(form.id)}
              sx={{ textTransform: 'none', fontSize: 12, borderRadius: 2, color: '#0284c7',
                border: '1px solid rgba(2,132,199,0.3)',
                '&:hover': { background: 'rgba(2,132,199,0.08)' } }}>
              Responses
            </Button>
          </Tooltip>
        )}

        {/* Students see Submit button on published forms */}
        {!canEdit && form.status === 'published' && onSubmitFeedback && (
          <Tooltip title="Submit your feedback">
            <Button size="small" startIcon={<SendIcon />}
              onClick={() => onSubmitFeedback(form.id)}
              sx={{ textTransform: 'none', fontSize: 12, borderRadius: 2,
                background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                color: '#fff', border: 'none',
                '&:hover': { opacity: 0.9, transform: 'translateY(-1px)' },
                transition: 'all 0.2s' }}>
              Submit Feedback
            </Button>
          </Tooltip>
        )}

        {canEdit && form.status === 'draft' && (
          <Tooltip title="Publish Form">
            <Button size="small" startIcon={<PublishIcon />}
              onClick={() => onStatusChange(form.id, 'published')}
              sx={{ textTransform: 'none', fontSize: 12, borderRadius: 2, color: '#22c55e',
                border: '1px solid rgba(34,197,94,0.3)',
                '&:hover': { background: 'rgba(34,197,94,0.08)' } }}>
              Publish
            </Button>
          </Tooltip>
        )}

        {canEdit && form.status === 'published' && (
          <Tooltip title="Close Form">
            <Button size="small" startIcon={<LockIcon />}
              onClick={() => onStatusChange(form.id, 'closed')}
              sx={{ textTransform: 'none', fontSize: 12, borderRadius: 2, color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.3)',
                '&:hover': { background: 'rgba(245,158,11,0.08)' } }}>
              Close
            </Button>
          </Tooltip>
        )}

        {canEdit && (
          <Tooltip title="Delete Form">
            <IconButton size="small" onClick={() => onDelete(form.id)}
              sx={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 2, p: 0.6,
                '&:hover': { background: 'rgba(239,68,68,0.08)' } }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

// ── Create Form Dialog ────────────────────────────────────────────────────────
const CreateFormDialog = ({ open, onClose, onCreate }) => {
  const [data, setData] = useState({
    title: '', description: '', course_name: '', course_code: '',
    open_date: '', close_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...data,
        open_date:  data.open_date  ? new Date(data.open_date).toISOString()  : null,
        close_date: data.close_date ? new Date(data.close_date).toISOString() : null,
      };
      await onCreate(payload);
      setData({ title: '', description: '', course_name: '', course_code: '', open_date: '', close_date: '' });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create form.');
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 20, color: '#1a1a2e', pb: 0 }}>
        📝 Create New Form
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

          <TextField required fullWidth label="Form Title" name="title"
            value={data.title} onChange={handleChange} sx={fieldSx}
            placeholder="e.g. CS101 Mid-Semester Feedback" />

          <TextField fullWidth label="Description" name="description" multiline rows={2}
            value={data.description} onChange={handleChange} sx={fieldSx}
            placeholder="Brief description of this feedback form..." />

          <Grid container spacing={2}>
            <Grid item xs={8}>
              <TextField required fullWidth label="Course Name" name="course_name"
                value={data.course_name} onChange={handleChange} sx={fieldSx}
                placeholder="Introduction to Computer Science" />
            </Grid>
            <Grid item xs={4}>
              <TextField required fullWidth label="Course Code" name="course_code"
                value={data.course_code} onChange={handleChange} sx={fieldSx}
                placeholder="CS101" />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth label="Open Date" name="open_date" type="datetime-local"
                value={data.open_date} onChange={handleChange} sx={fieldSx}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Close Date" name="close_date" type="datetime-local"
                value={data.close_date} onChange={handleChange} sx={fieldSx}
                InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={onClose} sx={{ borderRadius: 2, textTransform: 'none', color: '#666' }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}
            sx={{
              borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3,
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              boxShadow: '0 4px 16px rgba(102,126,234,0.4)',
            }}>
            {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Create Form'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

// ── FormsPage ─────────────────────────────────────────────────────────────────
const FormsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const { toast, showToast, closeToast } = useToast();
  const [confirm, setConfirm] = React.useState({ open: false, title: '', message: '', onConfirm: null });

  const canEdit = user?.role === 'instructor' || user?.role === 'admin';

  // ── Fetch forms ──
  const fetchForms = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await formService.getForms();
      setForms(data);
    } catch (err) {
      setError('Failed to load forms. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForms(); }, []);
  // ── Create form ──
  const handleCreate = async (payload) => {
    const newForm = await formService.createForm(payload);
    setForms((prev) => [newForm, ...prev]);
    showToast('Form created successfully!', 'success');
  };
  // ── Delete form ──
  const handleDelete = async (formId) => {
    setConfirm({
      open: true,
      title: 'Delete Form',
      message: 'Are you sure you want to delete this form? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await formService.deleteForm(formId);
          setForms((prev) => prev.filter((f) => f.id !== formId));
          showToast('Form deleted.', 'info');
        } catch {
          showToast('Failed to delete form.', 'error');
        }
      },
    });
  };

  // ── Status change ──
  const handleStatusChange = async (formId, status) => {
    try {
      const updated = await formService.updateFormStatus(formId, status);
      setForms((prev) => prev.map((f) => (f.id === formId ? updated : f)));
      showToast(`Form ${status}.`, 'success');
    } catch {
      showToast('Failed to update form status.', 'error');
    }
  };

  // ── Filter ──
  const filtered = filter === 'all' ? forms : forms.filter((f) => f.status === filter);

  return (
    <Box sx={{ minHeight: '100vh', background: '#f4f6fb' }}>
      <Navbar />

      <Box sx={{ px: { xs: 2, md: 5 }, py: 4 }}>

        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 26, color: '#1a1a2e' }}>
              📋 Feedback Forms
            </Typography>
            <Typography sx={{ color: '#888', fontSize: 14, mt: 0.3 }}>
              {forms.length} form{forms.length !== 1 ? 's' : ''} total
            </Typography>
          </Box>

          {canEdit && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3, py: 1.2,
                background: 'linear-gradient(135deg,#667eea,#764ba2)',
                boxShadow: '0 4px 16px rgba(102,126,234,0.4)',
                '&:hover': { boxShadow: '0 8px 24px rgba(102,126,234,0.5)', transform: 'translateY(-1px)' },
                transition: 'all 0.2s',
              }}
            >
              Create Form
            </Button>
          )}
        </Box>

        {/* Status Filter Tabs */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          {['all', 'draft', 'published', 'closed'].map((f) => (
            <Chip key={f} label={f === 'all' ? '🗂 All' : STATUS[f]?.label}
              onClick={() => setFilter(f)}
              sx={{
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                background: filter === f ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#fff',
                color: filter === f ? '#fff' : '#666',
                boxShadow: filter === f ? '0 4px 12px rgba(102,126,234,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
                border: 'none',
                '&:hover': { opacity: 0.9 },
              }} />
          ))}
        </Box>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}
            action={<Button size="small" onClick={fetchForms}>Retry</Button>}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#667eea' }} />
          </Box>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography sx={{ fontSize: 64, mb: 2 }}>📭</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 20, color: '#1a1a2e', mb: 1 }}>
              No forms found
            </Typography>
            <Typography sx={{ color: '#888', mb: 3 }}>
              {filter !== 'all' ? `No ${filter} forms yet.` : 'Create your first feedback form to get started.'}
            </Typography>
            {canEdit && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
                  background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                Create First Form
              </Button>
            )}
          </Box>
        ) : (
          /* Forms Grid */
          <Grid container spacing={3}>
            {filtered.map((form) => (
              <Grid item xs={12} sm={6} lg={4} key={form.id}>                <FormCard
                  form={form}
                  canEdit={canEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onViewQuestions={(id) => navigate(`/forms/${id}/questions`)}
                  onSubmitFeedback={(id) => navigate(`/forms/${id}/submit`)}
                  onViewResponses={(id) => navigate(`/forms/${id}/responses`)}
                />
              </Grid>
            ))}
          </Grid>
        )}

      </Box>      {/* Create Dialog */}
      <CreateFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />      {/* Toast notifications */}
      <Toast open={toast.open} message={toast.message} severity={toast.severity} onClose={closeToast} />

      {/* Confirm dialog */}
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

export default FormsPage;
