import React from 'react';
import { Snackbar, Alert } from '@mui/material';

// ── Toast ─────────────────────────────────────────────────────────────────────
// Usage:
//   const { toast, showToast, closeToast } = useToast();
//   showToast('Form deleted!', 'success');
//   <Toast open={toast.open} message={toast.message} severity={toast.severity} onClose={closeToast} />

const Toast = ({ open, message, severity = 'success', onClose, duration = 3500 }) => (
  <Snackbar
    open={open}
    autoHideDuration={duration}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  >
    <Alert
      onClose={onClose}
      severity={severity}
      variant="filled"
      sx={{
        borderRadius: 2,
        fontWeight: 600,
        fontSize: 14,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        minWidth: 280,
      }}
    >
      {message}
    </Alert>
  </Snackbar>
);

export default Toast;
