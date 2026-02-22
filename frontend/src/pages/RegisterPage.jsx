import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  MenuItem,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../context/AuthContext';
import organizationService from '../services/organizationService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    org_id: '',
  });
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    organizationService
      .getOrganizations()
      .then((data) => {
        setOrgs(data);
        if (data.length === 1) setFormData((f) => ({ ...f, org_id: data[0].id }));
      })
      .catch(() => setOrgs([]))
      .finally(() => setOrgsLoading(false));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.org_id) {
      setError('Please select an organization.');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        org_id: Number(formData.org_id),
      });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'student', label: '🎓 Student', desc: 'Submit feedback on courses' },
    { value: 'instructor', label: '👨‍🏫 Instructor', desc: 'Manage your course forms' },
    { value: 'admin', label: '🛡️ Admin', desc: 'Full system access' },
  ];

  const fieldStyle = {
    mb: 2,
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '&:hover fieldset': { borderColor: '#f093fb' },
      '&.Mui-focused fieldset': { borderColor: '#f093fb' },
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 40%, #fda085 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
      }}
    >
      {/* Floating blobs */}
      <Box
        sx={{
          position: 'absolute',
          width: 350,
          height: 350,
          borderRadius: '50%',
          top: '-100px',
          right: '-100px',
          background: 'rgba(255,255,255,0.1)',
          filter: 'blur(60px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 250,
          height: 250,
          borderRadius: '50%',
          bottom: '-60px',
          left: '-60px',
          background: 'rgba(255,255,255,0.1)',
          filter: 'blur(40px)',
        }}
      />

      <Box
        sx={{
          display: 'flex',
          width: '100%',
          maxWidth: 900,
          mx: 2,
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
        }}
      >
        {/* Left branding */}
        <Box
          sx={{
            flex: 1,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
            backdropFilter: 'blur(10px)',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 5,
            borderRight: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.7))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <Typography sx={{ fontSize: 36 }}>💡</Typography>
          </Box>
          <Typography
            variant="h3"
            sx={{ color: '#fff', fontWeight: 800, mb: 1, textAlign: 'center' }}
          >
            InsightLoop
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'center',
              fontSize: 15,
              lineHeight: 1.8,
              mb: 3,
            }}
          >
            Join thousands of educators and students improving course quality together
          </Typography>

          {/* Role cards */}
          {roles.map((r) => (
            <Box
              key={r.value}
              sx={{
                width: '100%',
                mb: 1.5,
                p: 2,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                {r.label}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                {r.desc}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Right Form */}
        <Box
          sx={{
            flex: 1,
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            p: { xs: 4, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: '#1a1a2e', mb: 0.5 }}
          >
            Create Account ✨
          </Typography>
          <Typography sx={{ color: '#666', mb: 3, fontSize: 15 }}>
            Join InsightLoop for free today
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Typography
              sx={{ fontWeight: 600, mb: 0.5, color: '#333', fontSize: 13 }}
            >
              Email Address
            </Typography>
            <TextField
              required
              fullWidth
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: '#f093fb' }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldStyle}
            />

            <Typography
              sx={{ fontWeight: 600, mb: 0.5, color: '#333', fontSize: 13 }}
            >
              Password
            </Typography>
            <TextField
              required
              fullWidth
              name="password"
              placeholder="Min. 8 characters"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#f093fb' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={fieldStyle}
            />

            <Typography
              sx={{ fontWeight: 600, mb: 0.5, color: '#333', fontSize: 13 }}
            >
              Role
            </Typography>
            <TextField
              required
              fullWidth
              select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeOutlinedIcon sx={{ color: '#f093fb' }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldStyle}
            >
              {roles.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>

            <Typography
              sx={{ fontWeight: 600, mb: 0.5, color: '#333', fontSize: 13 }}
            >
              Organization
            </Typography>
            <TextField
              required
              fullWidth
              select
              name="org_id"
              value={formData.org_id}
              onChange={handleChange}
              disabled={loading || orgsLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessOutlinedIcon sx={{ color: '#f093fb' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ ...fieldStyle, mb: 3 }}
            >
              {orgsLoading ? (
                <MenuItem value="" disabled>
                  Loading organizations…
                </MenuItem>
              ) : orgs.length === 0 ? (
                <MenuItem value="" disabled>
                  No organizations found
                </MenuItem>
              ) : (
                orgs.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.name}
                  </MenuItem>
                ))
              )}
            </TextField>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || orgsLoading || orgs.length === 0}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: 16,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                boxShadow: '0 8px 24px rgba(240,147,251,0.4)',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d67de0, #d94455)',
                  boxShadow: '0 12px 28px rgba(240,147,251,0.5)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: '#fff' }} />
              ) : (
                'Create Account →'
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    textDecoration: 'none',
                    color: '#f5576c',
                    fontWeight: 700,
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;