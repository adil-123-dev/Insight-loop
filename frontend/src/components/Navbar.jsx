import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Avatar, Button, Tooltip, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/GridViewRounded';
import FormsIcon from '@mui/icons-material/AssignmentRounded';
import AnalyticsIcon from '@mui/icons-material/BarChartRounded';
import BusinessIcon from '@mui/icons-material/BusinessRounded';
import CategoryIcon from '@mui/icons-material/CategoryRounded';
import LogoutIcon from '@mui/icons-material/LogoutRounded';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import MenuIcon from '@mui/icons-material/MenuRounded';
import CloseIcon from '@mui/icons-material/CloseRounded';
import AccountCircleIcon from '@mui/icons-material/AccountCircleRounded';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard',     icon: <DashboardIcon />, path: '/dashboard',     roles: ['admin','instructor','student'] },
  { label: 'Forms',         icon: <FormsIcon />,     path: '/forms',         roles: ['admin','instructor','student'] },
  { label: 'Analytics',     icon: <AnalyticsIcon />, path: '/analytics',     roles: ['admin','instructor'] },
  { label: 'Organizations', icon: <BusinessIcon />,  path: '/organizations', roles: ['admin'] },
  { label: 'Categories',    icon: <CategoryIcon />,  path: '/categories',    roles: ['admin','instructor'] },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = { admin: '#f5576c', instructor: '#667eea', student: '#22c55e' };

  const visibleNav = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  const handleNavClick = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <>
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        px: { xs: 2, md: 4 }, py: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(102,126,234,0.35)',
        position: 'sticky', top: 0, zIndex: 100,
        minHeight: 64,
      }}>

        {/* ── Hamburger (mobile only) ── */}
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{ display: { xs: 'flex', md: 'none' }, color: '#fff', mr: 1, p: 0.8 }}
        >
          <MenuIcon />
        </IconButton>

        {/* ── Logo ── */}
        <Box
          onClick={() => navigate('/dashboard')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', flexShrink: 0 }}
        >
          <Box sx={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ fontSize: 18 }}>💡</Typography>
          </Box>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>InsightLoop</Typography>
        </Box>

        {/* ── Nav Links (desktop only) ── */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flex: 1, justifyContent: 'center', mx: 2 }}>
          {visibleNav.map(({ label, icon, path }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Button
                key={path}
                onClick={() => navigate(path)}
                startIcon={icon}
                sx={{
                  color: active ? '#667eea' : 'rgba(255,255,255,0.85)',
                  background: active ? '#fff' : 'transparent',
                  fontWeight: active ? 700 : 500,
                  borderRadius: 2, px: 1.8, py: 0.9,
                  textTransform: 'none', fontSize: 13,
                  '&:hover': { background: active ? '#fff' : 'rgba(255,255,255,0.15)' },
                  transition: 'all 0.18s', whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Button>
            );
          })}
        </Box>

        {/* ── Right: avatar + role + logout ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexShrink: 0 }}>
          <Tooltip title="Notifications">
            <Box sx={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              '&:hover': { background: 'rgba(255,255,255,0.25)' },
            }}>
              <NotificationsNoneIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
          </Tooltip>          <Tooltip title="Your Profile">
            <Avatar
              onClick={() => navigate('/profile')}
              sx={{
                width: 34, height: 34,
                background: roleColors[user?.role] || '#667eea',
                fontWeight: 800, fontSize: 14, flexShrink: 0,
                cursor: 'pointer', border: '2px solid rgba(255,255,255,0.4)',
                '&:hover': { border: '2px solid #fff', transform: 'scale(1.05)' },
                transition: 'all 0.18s',
              }}
            >
              {user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </Tooltip>          <Box sx={{ display: { xs: 'none', sm: 'block' }, cursor: 'pointer' }}
            onClick={() => navigate('/profile')}>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
              {user?.email?.split('@')[0]}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'capitalize' }}>
              {user?.role}
            </Typography>
          </Box>

          <Tooltip title="Logout">
            <Button
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{
                color: '#fff', textTransform: 'none', fontWeight: 600,
                background: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 1.5, py: 0.7,
                fontSize: 13, minWidth: 0,
                '&:hover': { background: 'rgba(255,255,255,0.25)' },
              }}
            >
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Logout</Box>
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Mobile Drawer ── */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            background: 'linear-gradient(160deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
          },
        }}
      >
        {/* Drawer Header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2.5, py: 2,
          borderBottom: '1px solid rgba(255,255,255,0.15)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ fontSize: 18 }}>💡</Typography>
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>InsightLoop</Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)', p: 0.5 }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* User Info */}
        <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <Avatar sx={{
            width: 44, height: 44,
            background: roleColors[user?.role] || '#667eea',
            fontWeight: 800, fontSize: 16, border: '2px solid rgba(255,255,255,0.4)',
          }}>
            {user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.3 }}>
              {user?.email?.split('@')[0]}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>
              {user?.role}
            </Typography>
          </Box>
        </Box>

        {/* Nav Items */}
        <List sx={{ px: 1.5, py: 1.5, flex: 1 }}>
          {visibleNav.map(({ label, icon, path }) => {
            const active = location.pathname.startsWith(path);
            return (
              <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavClick(path)}
                  sx={{
                    borderRadius: 2,
                    background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                    '&:hover': { background: 'rgba(255,255,255,0.15)' },
                    py: 1.2, px: 2,
                  }}
                >
                  <ListItemIcon sx={{ color: '#fff', minWidth: 38 }}>
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      fontWeight: active ? 700 : 500,
                      fontSize: 14,
                      color: '#fff',
                    }}
                  />
                  {active && (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>        {/* Drawer Logout */}
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mx: 2 }} />
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            onClick={() => handleNavClick('/profile')}
            startIcon={<AccountCircleIcon />}
            sx={{
              color: '#fff', textTransform: 'none', fontWeight: 600,
              background: location.pathname === '/profile' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              borderRadius: 2, py: 1.2,
              fontSize: 14, justifyContent: 'flex-start', px: 2,
              '&:hover': { background: 'rgba(255,255,255,0.25)' },
            }}
          >
            My Profile
          </Button>
          <Button
            fullWidth
            onClick={() => { setDrawerOpen(false); handleLogout(); }}
            startIcon={<LogoutIcon />}
            sx={{
              color: '#fff', textTransform: 'none', fontWeight: 600,
              background: 'rgba(255,255,255,0.15)', borderRadius: 2, py: 1.2,
              fontSize: 14, justifyContent: 'flex-start', px: 2,
              '&:hover': { background: 'rgba(255,255,255,0.25)' },
            }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
