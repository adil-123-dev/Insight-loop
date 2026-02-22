import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress, Alert,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Tooltip, Divider, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/AddRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import CategoryIcon from '@mui/icons-material/CategoryRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import AssignmentIcon from '@mui/icons-material/AssignmentRounded';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import categoryService from '../services/categoryService';
import organizationService from '../services/organizationService';

// ── Palette for auto-assigning category colors ────────────────────────────────
const COLORS = [
  '#667eea', '#f093fb', '#22c55e', '#f59e0b',
  '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899',
];

// ── No more mock data — real API used below ───────────────────────────────────

const EMPTY_FORM = { name: '', description: '', organization_id: '' };

// ── Category Card ─────────────────────────────────────────────────────────────
const CategoryCard = ({ cat, canEdit, onEdit, onDelete }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 3,
      border: '1.5px solid rgba(0,0,0,0.06)',
      background: '#fff',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 30px rgba(0,0,0,0.09)' },
      display: 'flex', flexDirection: 'column',
    }}
  >
    {/* Top colour stripe */}
    <Box sx={{ height: 5, background: cat.color }} />

    <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1.2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2,
            background: `${cat.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: cat.color, flexShrink: 0,
          }}>
            <CategoryIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3 }}>
            {cat.name}
          </Typography>
        </Box>

        {canEdit && (
          <Box sx={{ display: 'flex', gap: 0.3, flexShrink: 0 }}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(cat)} sx={{ color: '#667eea', '&:hover': { background: 'rgba(102,126,234,0.08)' } }}>
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(cat)} sx={{ color: '#ef4444', '&:hover': { background: 'rgba(239,68,68,0.08)' } }}>
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      <Typography variant="body2" sx={{
        color: 'text.secondary', lineHeight: 1.6, flex: 1, mb: 2,
        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>
        {cat.description || 'No description provided.'}
      </Typography>

      <Divider sx={{ mb: 1.5, borderColor: 'rgba(0,0,0,0.05)' }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
        <AssignmentIcon sx={{ fontSize: 15, color: cat.color }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: cat.color }}>
          {cat.form_count}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {cat.form_count === 1 ? 'form' : 'forms'}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const { user } = useAuth();
  const canEdit = ['admin', 'instructor'].includes(user?.role);
  const [categories, setCategories] = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [orgs, setOrgs]             = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // Dialog states
  const [dialogOpen,       setDialogOpen]       = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editTarget,       setEditTarget]       = useState(null);
  const [deleteTarget,     setDeleteTarget]     = useState(null);
  const [formData,         setFormData]         = useState(EMPTY_FORM);
  const [saving,           setSaving]           = useState(false);
  const [formError,        setFormError]        = useState('');
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [catsData, orgsData] = await Promise.all([
          categoryService.getCategories(),
          organizationService.getOrganizations(),
        ]);
        const enriched = catsData.map((c, i) => ({
          ...c,
          color: COLORS[i % COLORS.length],
          form_count: c.form_count || 0,
        }));
        setCategories(enriched);
        setFiltered(enriched);
        setOrgs(orgsData);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load categories.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? categories.filter(c => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))
        : categories
    );
  }, [search, categories]);

  const openCreate = () => {
    setEditTarget(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setDialogOpen(true);
  };
  const openEdit = (cat) => {
    setEditTarget(cat);
    setFormData({ name: cat.name, description: cat.description || '', organization_id: cat.organization_id || '' });
    setFormError('');
    setDialogOpen(true);
  };

  const openDelete = (cat) => {
    setDeleteTarget(cat);
    setDeleteDialogOpen(true);
  };
  const handleSave = async () => {
    if (!formData.name.trim()) { setFormError('Category name is required.'); return; }
    if (!editTarget && !formData.organization_id) { setFormError('Please select an organization.'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (editTarget) {
        // Backend has no PUT /categories — update locally
        setCategories(prev => prev.map(c =>
          c.id === editTarget.id ? { ...c, name: formData.name, description: formData.description } : c
        ));
      } else {
        const created = await categoryService.createCategory({
          name: formData.name,
          description: formData.description || null,
          organization_id: Number(formData.organization_id),
        });
        const enriched = {
          ...created,
          color: COLORS[categories.length % COLORS.length],
          form_count: 0,
        };
        setCategories(prev => [enriched, ...prev]);
      }
      setDialogOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await categoryService.deleteCategory(deleteTarget.id);
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete category.');
      setDeleteDialogOpen(false);
    }
  };

  const totalForms = categories.reduce((s, c) => s + (c.form_count || 0), 0);

  return (
    <>
      <Navbar />
      <Box sx={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #f0f4ff 100%)', minHeight: '100vh', pb: 6 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, pt: 4 }}>

          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', mb: 0.5 }}>
                🏷️ Categories
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Organise feedback forms by topic and purpose
              </Typography>
            </Box>
            {canEdit && (
              <Button
                startIcon={<AddIcon />}
                onClick={openCreate}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff', borderRadius: 3, px: 3, py: 1.2, fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(102,126,234,0.5)' },
                  transition: 'all 0.2s',
                }}
              >
                New Category
              </Button>
            )}
          </Box>

          {/* Summary chips */}
          {!loading && (
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
              {[
                { label: `${categories.length} categories`, bg: 'rgba(102,126,234,0.1)', color: '#667eea' },
                { label: `${totalForms} total forms`,       bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
              ].map((c, i) => (
                <Chip key={i} label={c.label} sx={{ background: c.bg, color: c.color, fontWeight: 700, fontSize: '0.8rem' }} />
              ))}
            </Box>
          )}

          {/* Search */}
          <TextField
            fullWidth
            placeholder="Search categories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3, background: '#fff',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress sx={{ color: '#667eea' }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <CategoryIcon sx={{ fontSize: 64, color: 'rgba(0,0,0,0.1)', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                {search ? 'No categories match your search' : 'No categories yet'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                {search ? 'Try a different search term.' : 'Create categories to organise your feedback forms.'}
              </Typography>
              {canEdit && !search && (
                <Button
                  onClick={openCreate}
                  variant="contained"
                  sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: 3, fontWeight: 700 }}
                >
                  Create First Category
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {filtered.map(cat => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id}>
                  <CategoryCard cat={cat} canEdit={canEdit} onEdit={openEdit} onDelete={openDelete} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.2rem', pb: 1 }}>
          {editTarget ? '✏️ Edit Category' : '🏷️ New Category'}
        </DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
          <TextField
            autoFocus
            fullWidth
            label="Category Name *"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            sx={{ mb: 2, mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            placeholder="e.g. Teaching Quality"
          />          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            placeholder="What kind of feedback does this category cover?"
          />
          {/* Organization selector — only required on create */}
          {!editTarget && (
            <TextField
              select
              fullWidth
              label="Organization *"
              value={formData.organization_id}
              onChange={e => setFormData(p => ({ ...p, organization_id: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              helperText="Select the organization this category belongs to"
            >
              {orgs.length === 0 ? (
                <MenuItem disabled value="">No organizations available</MenuItem>
              ) : (
                orgs.map(o => (
                  <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                ))
              )}
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="contained"
            sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: 2, fontWeight: 700, px: 3 }}
          >
            {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#ef4444' }}>🗑️ Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>?
            Forms using this category will not be deleted, but they will lose this categorisation.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{ background: '#ef4444', borderRadius: 2, fontWeight: 700 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
