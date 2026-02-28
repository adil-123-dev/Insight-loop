import { useState, useCallback } from 'react';

// ── useToast ──────────────────────────────────────────────────────────────────
// Lightweight Snackbar toast hook — use alongside <Toast /> component
// Usage:
//   const { toast, showToast } = useToast();
//   showToast('Saved!', 'success');
//   <Toast {...toast} />

export const useToast = () => {
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity });
  }, []);

  const closeToast = useCallback(() => {
    setToast(t => ({ ...t, open: false }));
  }, []);
  return { toast, showToast, closeToast };
};

export default useToast;
