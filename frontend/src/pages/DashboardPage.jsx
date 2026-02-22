import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Chip, CircularProgress } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import formService from '../services/formService';

const StatCard = ({ icon, label, value, color, bg }) => (
  <Box sx={{
    background: '#fff', borderRadius: 3, p: 3,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    display: 'flex', alignItems: 'center', gap: 2,
    transition: 'all 0.2s',
    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' },
  }}>
    <Box sx={{ width: 56, height: 56, borderRadius: 2.5, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
    </Box>
    <Box>
      <Typography sx={{ fontSize: 13, color: '#888', fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}>{value}</Typography>
    </Box>
  </Box>
);

const QuickCard = ({ icon, title, desc, gradient, onClick }) => (
  <Box onClick={onClick} sx={{
    borderRadius: 3, p: 3, background: gradient,
    cursor: 'pointer', position: 'relative', overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)', transition: 'all 0.2s',
    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 40px rgba(0,0,0,0.2)' },
  }}>
    <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
    <Typography sx={{ fontSize: 32, mb: 1 }}>{icon}</Typography>
    <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 18, mb: 0.5 }}>{title}</Typography>
    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{desc}</Typography>
  </Box>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const roleColor = { admin: '#f5576c', instructor: '#667eea', student: '#22c55e' };

  // ── Real stats from API ──────────────────────────────────────────────────────
  const [statsData, setStatsData] = useState({ totalForms: '—', published: '—', draft: '—', closed: '—' });
  const [loadingStats, setLoadingStats] = useState(true);
  const [recentForms, setRecentForms] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const forms = await formService.getForms();
        setRecentForms(forms.slice(0, 5));
        setStatsData({
          totalForms: forms.length,
          published:  forms.filter(f => f.status === 'published').length,
          draft:      forms.filter(f => f.status === 'draft').length,
          closed:     forms.filter(f => f.status === 'closed').length,
        });
      } catch {
        // silently keep defaults
      } finally {
        setLoadingStats(false);
      }
    };
    load();
  }, []);

  const stats = [
    { icon: <AssignmentIcon />, label: 'Total Forms',      value: loadingStats ? '…' : statsData.totalForms,  color: '#667eea', bg: 'rgba(102,126,234,0.12)' },
    { icon: <CheckCircleIcon />, label: 'Published',        value: loadingStats ? '…' : statsData.published,   color: '#22c55e', bg: 'rgba(34,197,94,0.12)'   },
    { icon: <PeopleIcon />,      label: 'Draft Forms',      value: loadingStats ? '…' : statsData.draft,       color: '#f093fb', bg: 'rgba(240,147,251,0.12)' },
    { icon: <TrendingUpIcon />,  label: 'Closed Forms',     value: loadingStats ? '…' : statsData.closed,      color: '#fda085', bg: 'rgba(253,160,133,0.12)' },
  ];
  const quickActions = [
    { icon: '📝', title: 'Create Form',    desc: 'Build a new feedback form',   gradient: 'linear-gradient(135deg,#667eea,#764ba2)', path: '/forms',         roles: ['admin','instructor'] },
    { icon: '📊', title: 'View Analytics', desc: 'See detailed insights',        gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', path: '/analytics',     roles: ['admin','instructor'] },
    { icon: '📋', title: 'Browse Forms',   desc: 'View all feedback forms',      gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', path: '/forms',         roles: ['admin','instructor','student'] },
    { icon: '🏷️', title: 'Categories',    desc: 'Manage form categories',       gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', path: '/categories',    roles: ['admin','instructor'] },
    { icon: '🏢', title: 'Organizations', desc: 'Manage organisations',          gradient: 'linear-gradient(135deg,#fa709a,#fee140)', path: '/organizations', roles: ['admin'] },
  ].filter(a => !a.roles || a.roles.includes(user?.role));

  return (
    <Box sx={{ minHeight: '100vh', background: '#f4f6fb' }}>
      <Navbar />

      <Box sx={{ px: { xs: 2, md: 5 }, py: 4 }}>

        {/* Welcome Banner */}
        <Box sx={{
          borderRadius: 3, p: { xs: 3, md: 4 }, mb: 4,
          background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          <Box sx={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', top: '-60px', right: '10%', background: 'rgba(102,126,234,0.3)', filter: 'blur(40px)' }} />
          <Box sx={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', bottom: '-40px', right: '30%', background: 'rgba(240,147,251,0.2)', filter: 'blur(30px)' }} />
          <Chip label={user?.role?.toUpperCase() || 'USER'} size="small"
            sx={{ background: roleColor[user?.role] || '#667eea', color: '#fff', fontWeight: 700, mb: 2, fontSize: 11 }} />
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: 22, md: 30 }, mb: 1 }}>
            Hello, {user?.email?.split('@')[0] || 'User'}! 👋
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>
            {user?.email} · Welcome to your InsightLoop dashboard
          </Typography>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((s) => (
            <Grid item xs={12} sm={6} md={3} key={s.label}>
              <StatCard {...s} />
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#1a1a2e', mb: 2 }}>Quick Actions</Typography>
        <Grid container spacing={3}>
          {quickActions.map((q) => (
            <Grid item xs={12} sm={6} md={3} key={q.title}>
              <QuickCard {...q} onClick={() => navigate(q.path)} />
            </Grid>
          ))}
        </Grid>        {/* Recent Activity */}
        <Box sx={{ mt: 4, background: '#fff', borderRadius: 3, p: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#1a1a2e', mb: 2 }}>📋 Recent Forms</Typography>
          {loadingStats ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} sx={{ color: '#667eea' }} />
            </Box>
          ) : recentForms.length === 0 ? (
            <Typography sx={{ color: '#aaa', fontSize: 14, textAlign: 'center', py: 3 }}>
              No forms yet. Create your first form!
            </Typography>
          ) : (
            recentForms.map((form, i) => {
              const statusColor = { published: '#22c55e', draft: '#f59e0b', closed: '#ef4444' }[form.status] || '#667eea';
              return (
                <Box
                  key={form.id}
                  onClick={() => navigate(`/forms/${form.id}/questions`)}
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    py: 1.5, cursor: 'pointer',
                    borderBottom: i < recentForms.length - 1 ? '1px solid #f0f0f0' : 'none',
                    '&:hover': { background: 'rgba(102,126,234,0.04)', borderRadius: 1, px: 1, mx: -1 },
                    transition: 'all 0.15s',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{form.title}</Typography>
                      <Typography sx={{ fontSize: 12, color: '#aaa' }}>{form.course_code} · {form.course_name}</Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={form.status}
                    size="small"
                    sx={{
                      background: `${statusColor}18`, color: statusColor,
                      fontWeight: 700, fontSize: '0.7rem', height: 22, textTransform: 'capitalize',
                    }}
                  />
                </Box>
              );
            })
          )}
        </Box>

      </Box>
    </Box>
  );
};

export default DashboardPage;