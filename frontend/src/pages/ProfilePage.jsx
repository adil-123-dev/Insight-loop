import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Paper, Avatar, Chip, Button, Divider,
  Stack, Grid, Card, CardContent, Skeleton, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LockResetIcon from '@mui/icons-material/LockReset';
import PeopleIcon from '@mui/icons-material/People';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import useToast from '../utils/useToast';

// ── Role chip ─────────────────────────────────────────────────────────────────
const RoleChip = ({ role }) => {
  const map = {
    admin:      { label: '👑 Admin',      color: '#9333ea', bg: '#f3e8ff', border: '#d8b4fe' },
    instructor: { label: '🎓 Instructor', color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
    student:    { label: '🎒 Student',    color: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
  };
  const m = map[role] || { label: role, color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
  return (
    <Chip label={m.label} sx={{
      bgcolor: m.bg, color: m.color, fontWeight: 800, fontSize: 13,
      border: `1.5px solid ${m.border}`, px: 0.5,
    }} />
  );
};

// ── Info row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, mono = false, copyable = false }) => {
  const { showToast } = { showToast: () => {} }; // placeholder — actual toast below
  return (
    <Stack direction="row" alignItems="center" spacing={2} py={1.5}
      sx={{ borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 'none' } }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: '10px',
        bgcolor: '#f0f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#667eea', flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Box flex={1} minWidth={0}>
        <Typography fontSize={11} fontWeight={700} color="text.secondary"
          textTransform="uppercase" letterSpacing={0.5}>
          {label}
        </Typography>
        <Typography fontSize={14} fontWeight={600} color="#1e293b"
          sx={{ fontFamily: mono ? '"Courier New", monospace' : undefined, wordBreak: 'break-all' }}>
          {value || '—'}
        </Typography>
      </Box>
      {copyable && value && (
        <Tooltip title="Copy">
          <IconButton size="small" onClick={() => navigator.clipboard.writeText(value)}
            sx={{ color: '#94a3b8', '&:hover': { color: '#667eea' } }}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

// ── Change Password Dialog ─────────────────────────────────────────────────────
const ChangePasswordDialog = ({ open, onClose, showToast }) => {
  const [form, setForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!form.current || !form.newPwd || !form.confirm) {
      setError('All fields are required.');
      return;
    }
    if (form.newPwd.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (form.newPwd !== form.confirm) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      // The backend doesn't have a dedicated change-password endpoint yet,
      // so we'll show a success message after basic validation.
      // TODO: wire to PUT /auth/password when backend adds it.
      await new Promise(r => setTimeout(r, 800)); // simulate
      showToast('Password change coming soon — backend endpoint not yet available.', 'info');
      onClose();
      setForm({ current: '', newPwd: '', confirm: '' });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setForm({ current: '', newPwd: '', confirm: '' });
    setError('');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{
        background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
        color: '#fff', fontWeight: 800, fontSize: 18,
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <LockResetIcon /> Change Password
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Stack spacing={2.5}>
          <TextField label="Current Password" type="password" fullWidth size="small"
            value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))} />
          <TextField label="New Password" type="password" fullWidth size="small"
            value={form.newPwd} onChange={e => setForm(f => ({ ...f, newPwd: e.target.value }))} />
          <TextField label="Confirm New Password" type="password" fullWidth size="small"
            value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading} variant="outlined" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained"
          sx={{
            background: 'linear-gradient(135deg,#667eea,#764ba2)',
            fontWeight: 700, borderRadius: 2,
          }}>
          {loading ? 'Saving…' : 'Update Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main ProfilePage ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, closeToast } = useToast();

  const [profile, setProfile]       = useState(null);
  const [orgUsers, setOrgUsers]     = useState([]);
  const [loadingProfile, setLP]     = useState(true);
  const [loadingUsers, setLU]       = useState(false);
  const [pwdOpen, setPwdOpen]       = useState(false);

  // Load fresh profile from /auth/me
  useEffect(() => {
    api.get('/auth/me')
      .then(res => setProfile(res.data))
      .catch(() => setProfile(user))   // fallback to localStorage user
      .finally(() => setLP(false));
  }, []);

  // Load org users if admin
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setLU(true);
    api.get('/auth/users')
      .then(res => setOrgUsers(res.data))
      .catch(() => {})
      .finally(() => setLU(false));
  }, [user]);

  const displayUser = profile || user;

  const formatDate = (dt) =>
    dt ? new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  const roleColor = {
    admin:      { start: '#9333ea', end: '#7e22ce' },
    instructor: { start: '#0284c7', end: '#0369a1' },
    student:    { start: '#059669', end: '#047857' },
  }[displayUser?.role] || { start: '#667eea', end: '#764ba2' };

  const avatarLetter = displayUser?.email?.[0]?.toUpperCase() || '?';

  // ── Activity stats derived from local user data ──────────────────────────────
  const stats = [
    {
      label: displayUser?.role === 'student' ? 'Forms Available' : 'Forms Created',
      value: '—',
      icon: '📋',
      note: 'Visit Forms page',
    },
    {
      label: 'Member Since',
      value: formatDate(displayUser?.created_at),
      icon: '📅',
      note: 'Account created',
    },
    {
      label: 'Organization ID',
      value: `#${displayUser?.org_id || '—'}`,
      icon: '🏢',
      note: 'Your org',
    },
    {
      label: 'User ID',
      value: `#${displayUser?.id || '—'}`,
      icon: '🔑',
      note: 'Unique identifier',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
        {/* Back button */}
        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <IconButton onClick={() => navigate('/dashboard')}
            sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', '&:hover': { bgcolor: '#f3f4f6' } }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography fontSize={14} color="text.secondary" fontWeight={600}>
            Back to Dashboard
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {/* ── Left column: Profile card ── */}
          <Grid item xs={12} md={4}>
            {/* Hero profile card */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3 }}>
              {/* Gradient banner */}
              <Box sx={{
                height: 100,
                background: `linear-gradient(135deg, ${roleColor.start} 0%, ${roleColor.end} 100%)`,
                position: 'relative',
              }} />

              {/* Avatar + name */}
              <Box sx={{ px: 3, pb: 3, mt: -5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
                  {loadingProfile ? (
                    <Skeleton variant="circular" width={80} height={80} />
                  ) : (
                    <Avatar sx={{
                      width: 80, height: 80, fontSize: 32, fontWeight: 800,
                      background: `linear-gradient(135deg, ${roleColor.start}, ${roleColor.end})`,
                      border: '4px solid #fff',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    }}>
                      {avatarLetter}
                    </Avatar>
                  )}
                </Box>

                {loadingProfile ? (
                  <>
                    <Skeleton width="70%" height={28} />
                    <Skeleton width="50%" height={20} sx={{ mt: 0.5 }} />
                  </>
                ) : (
                  <>
                    <Typography fontWeight={800} fontSize={18} color="#1e293b" lineHeight={1.2}>
                      {displayUser?.email?.split('@')[0] || 'User'}
                    </Typography>
                    <Typography fontSize={13} color="text.secondary" mb={1.5}>
                      {displayUser?.email}
                    </Typography>
                    <RoleChip role={displayUser?.role} />
                  </>
                )}
              </Box>

              <Divider />

              {/* Action buttons */}
              <Box sx={{ px: 2, py: 2 }}>
                <Button
                  fullWidth variant="outlined"
                  startIcon={<LockResetIcon />}
                  onClick={() => setPwdOpen(true)}
                  sx={{ borderRadius: 2, fontWeight: 700, mb: 1.5,
                    borderColor: '#667eea', color: '#667eea',
                    '&:hover': { bgcolor: '#f0f0ff', borderColor: '#667eea' } }}
                >
                  Change Password
                </Button>
                <Button
                  fullWidth variant="outlined" color="error"
                  onClick={() => { logout(); navigate('/login'); }}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  Sign Out
                </Button>
              </Box>
            </Paper>

            {/* Quick stats card */}
            <Paper sx={{ borderRadius: 3, p: 2.5, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
              <Typography fontWeight={800} fontSize={14} color="#1e293b" mb={2}>
                📊 Account Overview
              </Typography>
              <Stack spacing={1.5}>
                {stats.map(s => (
                  <Stack key={s.label} direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '10px',
                      bgcolor: '#f0f0ff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 18, flexShrink: 0,
                    }}>
                      {s.icon}
                    </Box>
                    <Box>
                      <Typography fontSize={11} color="text.secondary" fontWeight={700}
                        textTransform="uppercase" letterSpacing={0.4}>
                        {s.label}
                      </Typography>
                      <Typography fontSize={13} fontWeight={700} color="#374151">
                        {s.value}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Grid>

          {/* ── Right column: Details ── */}
          <Grid item xs={12} md={8}>
            {/* Account Information */}
            <Paper sx={{ borderRadius: 3, p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', mb: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: '12px',
                  background: 'linear-gradient(135deg,#667eea,#764ba2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <PersonIcon sx={{ color: '#fff', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography fontWeight={800} fontSize={17} color="#1e293b">Account Information</Typography>
                  <Typography fontSize={12} color="text.secondary">Your profile details</Typography>
                </Box>
              </Stack>

              {loadingProfile ? (
                <Stack spacing={2}>
                  {[1,2,3,4,5].map(i => <Skeleton key={i} height={52} sx={{ borderRadius: 2 }} />)}
                </Stack>
              ) : (
                <Box>
                  <InfoRow icon={<PersonIcon fontSize="small" />} label="Display Name"
                    value={displayUser?.email?.split('@')[0]} />
                  <InfoRow icon={<EmailIcon fontSize="small" />} label="Email Address"
                    value={displayUser?.email} copyable />
                  <InfoRow icon={<BadgeIcon fontSize="small" />} label="Role"
                    value={displayUser?.role?.charAt(0).toUpperCase() + displayUser?.role?.slice(1)} />
                  <InfoRow icon={<BusinessIcon fontSize="small" />} label="Organization ID"
                    value={`#${displayUser?.org_id}`} mono />
                  <InfoRow icon={<SecurityIcon fontSize="small" />} label="User ID"
                    value={`#${displayUser?.id}`} mono />
                  <InfoRow icon={<CalendarTodayIcon fontSize="small" />} label="Member Since"
                    value={formatDate(displayUser?.created_at)} />
                </Box>
              )}
            </Paper>

            {/* Security card */}
            <Paper sx={{ borderRadius: 3, p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', mb: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: '12px',
                  background: 'linear-gradient(135deg,#10b981,#059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <SecurityIcon sx={{ color: '#fff', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography fontWeight={800} fontSize={17} color="#1e293b">Security</Typography>
                  <Typography fontSize={12} color="text.secondary">Manage your account security</Typography>
                </Box>
              </Stack>

              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center"
                  sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e5e7eb' }}>
                  <Box>
                    <Typography fontWeight={700} fontSize={14} color="#1e293b">Password</Typography>
                    <Typography fontSize={12} color="text.secondary">
                      Keep your account secure with a strong password
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small" startIcon={<LockResetIcon />}
                    onClick={() => setPwdOpen(true)}
                    sx={{ borderRadius: 2, fontWeight: 700, borderColor: '#10b981', color: '#059669',
                      '&:hover': { bgcolor: '#d1fae5', borderColor: '#10b981' } }}>
                    Change
                  </Button>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center"
                  sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e5e7eb' }}>
                  <Box>
                    <Typography fontWeight={700} fontSize={14} color="#1e293b">Session Token</Typography>
                    <Typography fontSize={12} color="text.secondary">
                      Your current JWT session token (auto-refreshes)
                    </Typography>
                  </Box>
                  <Chip label="Active" size="small"
                    sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 700 }} />
                </Stack>
              </Stack>
            </Paper>

            {/* Admin: Org Users Table */}
            {user?.role === 'admin' && (
              <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <Box sx={{
                  px: 3, py: 2.5,
                  background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
                  display: 'flex', alignItems: 'center', gap: 1.5,
                }}>
                  <PeopleIcon sx={{ color: '#fff' }} />
                  <Typography fontWeight={800} fontSize={16} color="#fff">
                    Organization Members
                  </Typography>
                  <Chip label={`${orgUsers.length} users`}
                    sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }} />
                </Box>

                {loadingUsers ? (
                  <Box sx={{ p: 3 }}>
                    {[1,2,3].map(i => <Skeleton key={i} height={52} sx={{ borderRadius: 1, mb: 1 }} />)}
                  </Box>
                ) : orgUsers.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography color="text.secondary">No users found in your organization.</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          {['ID', 'Email', 'Role', 'Joined'].map(h => (
                            <TableCell key={h} sx={{
                              fontWeight: 800, fontSize: 11, color: '#64748b',
                              textTransform: 'uppercase', letterSpacing: 0.5,
                              borderBottom: '2px solid #e5e7eb',
                            }}>
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orgUsers.map(u => (
                          <TableRow key={u.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                            <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: 13 }}>
                              #{u.id}
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Avatar sx={{
                                  width: 28, height: 28, fontSize: 12, fontWeight: 700,
                                  bgcolor: u.id === displayUser?.id ? '#667eea' : '#e5e7eb',
                                  color: u.id === displayUser?.id ? '#fff' : '#64748b',
                                }}>
                                  {u.email?.[0]?.toUpperCase()}
                                </Avatar>
                                <Typography fontSize={13} fontWeight={600} color="#1e293b">
                                  {u.email}
                                  {u.id === displayUser?.id && (
                                    <Chip label="You" size="small"
                                      sx={{ ml: 1, fontSize: 10, height: 18, bgcolor: '#ede9fe', color: '#7c3aed' }} />
                                  )}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <RoleChip role={u.role} />
                            </TableCell>
                            <TableCell sx={{ fontSize: 13, color: '#64748b' }}>
                              {formatDate(u.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>

      <ChangePasswordDialog open={pwdOpen} onClose={() => setPwdOpen(false)} showToast={showToast} />
      <Toast {...toast} onClose={closeToast} />
    </Box>
  );
}
