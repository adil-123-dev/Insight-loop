import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';

// ── Code-split page imports (lazy loaded) ────────────────────────────────────
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const RegisterPage     = lazy(() => import('./pages/RegisterPage'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const FormsPage        = lazy(() => import('./pages/FormsPage'));
const QuestionsPage    = lazy(() => import('./pages/QuestionsPage'));
const FeedbackPage     = lazy(() => import('./pages/FeedbackPage'));
const AnalyticsPage    = lazy(() => import('./pages/AnalyticsPage'));
const OrganizationsPage = lazy(() => import('./pages/OrganizationsPage'));
const CategoriesPage   = lazy(() => import('./pages/CategoriesPage'));
const ResponsesPage    = lazy(() => import('./pages/ResponsesPage'));
const ProfilePage      = lazy(() => import('./pages/ProfilePage'));

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#667eea' },
    secondary: { main: '#f093fb' },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
});

// ── Global Error Boundary ─────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
        }}>
          <Typography sx={{ fontSize: 64, mb: 2 }}>💥</Typography>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 24, mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, mb: 3, maxWidth: 360, textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard'; }}
            sx={{ background: '#fff', color: '#667eea', fontWeight: 700, borderRadius: 2,
              '&:hover': { background: 'rgba(255,255,255,0.9)' } }}
          >
            Go to Dashboard
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

// ── 404 Not Found Page ────────────────────────────────────────────────────────
const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
    }}>
      <Typography sx={{ fontSize: 96, fontWeight: 900, color: 'rgba(255,255,255,0.2)', lineHeight: 1 }}>404</Typography>
      <Typography sx={{ fontSize: 32, mb: 1 }}>🔍</Typography>
      <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 22, mb: 1 }}>Page Not Found</Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, mb: 3 }}>
        The page you're looking for doesn't exist.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/dashboard')}
        sx={{ background: '#fff', color: '#667eea', fontWeight: 700, borderRadius: 2, px: 3,
          '&:hover': { background: 'rgba(255,255,255,0.9)' } }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
};

// ── Branded Loading Spinner ───────────────────────────────────────────────────
const AppLoader = () => (
  <Box sx={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
    gap: 2,
  }}>
    <Box sx={{
      width: 56, height: 56, borderRadius: '50%',
      background: 'rgba(255,255,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1,
    }}>
      <Typography sx={{ fontSize: 28 }}>💡</Typography>
    </Box>
    <CircularProgress sx={{ color: '#fff' }} thickness={3} size={36} />
    <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: 14 }}>
      Loading InsightLoop…
    </Typography>
  </Box>
);

// ── Protected Route ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AppLoader />;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// ── Public Route (redirect if already logged in) ──────────────────────────────
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AppLoader />;
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <Suspense fallback={<AppLoader />}>
              <Routes>
                <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/forms"       element={<ProtectedRoute><FormsPage /></ProtectedRoute>} />
                <Route path="/forms/:formId/questions" element={<ProtectedRoute><QuestionsPage /></ProtectedRoute>} />
                <Route path="/forms/:formId/submit"    element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
                <Route path="/forms/:formId/responses" element={<ProtectedRoute><ResponsesPage /></ProtectedRoute>} />
                <Route path="/analytics"      element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
                <Route path="/organizations"  element={<ProtectedRoute><OrganizationsPage /></ProtectedRoute>} />
                <Route path="/categories"     element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
                <Route path="/profile"        element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
