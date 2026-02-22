import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const justRegistered = location.state?.registered === true;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Floating background blobs */}
      <Box sx={{
        position: 'absolute', width: 300, height: 300,
        borderRadius: '50%', top: '-80px', left: '-80px',
        background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)',
      }} />
      <Box sx={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%', bottom: '-100px', right: '-100px',
        background: 'rgba(255,255,255,0.08)', filter: 'blur(60px)',
      }} />

      <Box sx={{
        display: 'flex',
        width: '100%',
        maxWidth: 900,
        mx: 2,
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
      }}>
        {/* Left Panel — Branding */}
        <Box sx={{
          flex: 1,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(10px)',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 5,
          borderRight: '1px solid rgba(255,255,255,0.2)',
        }}>
          {/* Logo */}
          <Box sx={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mb: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <Typography sx={{ fontSize: 36 }}>💡</Typography>
          </Box>
          <Typography variant="h3" sx={{ color: '#fff', fontWeight: 800, mb: 1, textAlign: 'center' }}>
            InsightLoop
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontSize: 16, lineHeight: 1.7 }}>
            Transforming course feedback into actionable insights for better education
          </Typography>

          {/* Feature pills */}
          {['📊 Real-time Analytics', '📝 Smart Forms', '🎯 Actionable Insights'].map((f) => (
            <Box key={f} sx={{
              mt: 2, px: 3, py: 1, borderRadius: 20,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}>
              <Typography sx={{ color: '#fff', fontSize: 14 }}>{f}</Typography>
            </Box>
          ))}
        </Box>

        {/* Right Panel — Form */}
        <Box sx={{
          flex: 1,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          p: { xs: 4, md: 5 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', mb: 0.5 }}>
            Welcome Back 👋
          </Typography>
          <Typography sx={{ color: '#666', mb: 3, fontSize: 15 }}>
            Sign in to your InsightLoop account
          </Typography>          {justRegistered && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              🎉 Account created! Sign in to get started.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Typography sx={{ fontWeight: 600, mb: 0.5, color: '#333', fontSize: 14 }}>Email Address</Typography>
            <TextField
              required fullWidth name="email" placeholder="you@example.com"
              autoComplete="email" autoFocus value={formData.email}
              onChange={handleChange} disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' },
                },
              }}
            />

            <Typography sx={{ fontWeight: 600, mb: 0.5, color: '#333', fontSize: 14 }}>Password</Typography>
            <TextField
              required fullWidth name="password" placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password" value={formData.password}
              onChange={handleChange} disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' },
                },
              }}
            />

            <Button
              type="submit" fullWidth variant="contained" disabled={loading}
              sx={{
                py: 1.5, borderRadius: 2, fontSize: 16, fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                boxShadow: '0 8px 24px rgba(102,126,234,0.4)',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd6, #6a3f91)',
                  boxShadow: '0 12px 28px rgba(102,126,234,0.5)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In →'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{
                  textDecoration: 'none', color: '#667eea', fontWeight: 700,
                }}>
                  Create one free
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;