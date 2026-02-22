import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress, Alert,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Tooltip, Avatar, Divider, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/AddRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import BusinessIcon from '@mui/icons-material/BusinessRounded';
import PeopleIcon from '@mui/icons-material/PeopleRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import SchoolIcon from '@mui/icons-material/SchoolRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import organizationService from '../services/organizationService';

// ── Color palette for auto-assigning org avatars ──────────────────────────────
const ORG_COLORS = ['#667eea', '#f093fb', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

// ── Empty dialog state ────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', subdomain: '', description: '' };

// ── Org Card ─────────────────────────────────────────────────────────────────
const OrgCard = ({ org, canEdit, onEdit, onDelete }) => {
  const initials = org.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3, borderRadius: 4,
        border: '1.5px solid rgba(0,0,0,0.06)',
        background: '#fff',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 35px rgba(0,0,0,0.09)' },
        height: '100%',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Colored top accent */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(90deg, ${org.color}, ${org.color}99)`,
      }} />

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <Avatar sx={{
          width: 52, height: 52, borderRadius: 2.5, flexShrink: 0,
          background: `linear-gradient(135deg, ${org.color}, ${org.color}bb)`,
          fontSize: '1.1rem', fontWeight: 800,
        }}>
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{
            fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {org.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Since {new Date(org.created_at).getFullYear()}
          </Typography>
        </Box>

        {canEdit && (
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(org)} sx={{ color: '#667eea', '&:hover': { background: 'rgba(102,126,234,0.08)' } }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(org)} sx={{ color: '#ef4444', '&:hover': { background: 'rgba(239,68,68,0.08)' } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      <Typography variant="body2" sx={{
        color: 'text.secondary', lineHeight: 1.6, flex: 1, mb: 2,
        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
        WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
      }}>
        {org.description || 'No description provided.'}
      </Typography>

      <Divider sx={{ mb: 2, borderColor: 'rgba(0,0,0,0.06)' }} />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <PeopleIcon sx={{ fontSize: 16, color: org.color }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: org.color }}>
            {org.member_count?.toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>members</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <SchoolIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#f59e0b' }}>
            {org.form_count}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>forms</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrganizationsPage() {
  const { user } = useAuth();
  const canEdit = ['admin'].includes(user?.role);

  const [orgs, setOrgs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  // ── Load orgs from real API ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await organizationService.getOrganizations();
        // Enrich with a stable color per org based on index
        const enriched = data.map((o, i) => ({
          ...o,
          color: ORG_COLORS[i % ORG_COLORS.length],
          description: o.description || o.subdomain || '',
          member_count: o.member_count || 0,
          form_count: o.form_count || 0,
        }));
        setOrgs(enriched);
        setFiltered(enriched);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load organizations.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? orgs.filter(o => o.name.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : orgs);
  }, [search, orgs]);

  const openCreate = () => {
    setEditTarget(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setDialogOpen(true);
  };
  const openEdit = (org) => {
    setEditTarget(org);
    setFormData({ name: org.name, subdomain: org.subdomain || '', description: org.description || '' });
    setFormError('');
    setDialogOpen(true);
  };

  const openDelete = (org) => {
    setDeleteTarget(org);
    setDeleteDialogOpen(true);
  };
  const handleSave = async () => {
    if (!formData.name.trim())      { setFormError('Organization name is required.'); return; }
    if (!formData.subdomain.trim()) { setFormError('Subdomain is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (editTarget) {
        // Backend has no PUT /organizations — update locally only
        const updated = {
          ...editTarget,
          name: formData.name,
          subdomain: formData.subdomain,
          description: formData.description,
        };
        setOrgs(prev => prev.map(o => o.id === editTarget.id ? updated : o));
      } else {
        const created = await organizationService.createOrganization({
          name: formData.name,
          subdomain: formData.subdomain,
        });
        const enriched = {
          ...created,
          color: ORG_COLORS[orgs.length % ORG_COLORS.length],
          description: formData.description || created.subdomain,
          member_count: 0,
          form_count: 0,
        };
        setOrgs(prev => [enriched, ...prev]);
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
      await organizationService.deleteOrganization(deleteTarget.id);
      setOrgs(prev => prev.filter(o => o.id !== deleteTarget.id));
      setDeleteDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete organization.');
      setDeleteDialogOpen(false);
    }
  };

  const totalMembers = orgs.reduce((sum, o) => sum + (o.member_count || 0), 0);
  const totalForms   = orgs.reduce((sum, o) => sum + (o.form_count   || 0), 0);

  return (
    <>
      <Navbar />
      <Box sx={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #f0f4ff 100%)', minHeight: '100vh', pb: 6 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, pt: 4 }}>

          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', mb: 0.5 }}>
                🏛️ Organizations
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Manage departments, schools, and institutions
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
                New Organization
              </Button>
            )}
          </Box>

          {/* Quick stats */}
          {!loading && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: 'Organizations', value: orgs.length, icon: <BusinessIcon />, color: '#667eea', bg: 'rgba(102,126,234,0.1)' },
                { label: 'Total Members', value: totalMembers.toLocaleString(), icon: <PeopleIcon />, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
                { label: 'Total Forms', value: totalForms, icon: <SchoolIcon />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
              ].map((s, i) => (
                <Grid item xs={12} sm={4} key={i}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1.5px solid rgba(0,0,0,0.06)', background: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {s.icon}
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>{s.value}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{s.label}</Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Search */}
          <TextField
            fullWidth
            placeholder="Search organizations…"
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

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress sx={{ color: '#667eea' }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <BusinessIcon sx={{ fontSize: 64, color: 'rgba(0,0,0,0.1)', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                {search ? 'No organizations match your search' : 'No organizations yet'}
              </Typography>
              {canEdit && !search && (
                <Button onClick={openCreate} variant="contained" sx={{ mt: 2, background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: 3, fontWeight: 700 }}>
                  Create First Organization
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {filtered.map(org => (
                <Grid item xs={12} sm={6} md={4} key={org.id}>
                  <OrgCard org={org} canEdit={canEdit} onEdit={openEdit} onDelete={openDelete} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.2rem', pb: 1 }}>
          {editTarget ? '✏️ Edit Organization' : '🏛️ New Organization'}
        </DialogTitle>
        <DialogContent>          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
          <TextField
            autoFocus
            fullWidth
            label="Organization Name *"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            sx={{ mb: 2, mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            placeholder="e.g. MIT Computer Science Department"
          />
          <TextField
            fullWidth
            label="Subdomain *"
            value={formData.subdomain}
            onChange={e => setFormData(p => ({ ...p, subdomain: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            placeholder="e.g. mit-cs"
            helperText="URL-safe identifier (lowercase, hyphens only)"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            placeholder="Brief description of this organization…"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}>
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
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#ef4444' }}>🗑️ Delete Organization</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2, fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" sx={{ background: '#ef4444', borderRadius: 2, fontWeight: 700 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
