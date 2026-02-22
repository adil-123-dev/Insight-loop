import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
// Usage:
//   const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
//   setConfirm({ open: true, title: 'Delete Form', message: 'This cannot be undone.', onConfirm: () => handleDelete(id) });
//   <ConfirmDialog {...confirm} onClose={() => setConfirm(c => ({ ...c, open: false }))} />

const ConfirmDialog = ({ open, title, message, onConfirm, onClose, confirmLabel = 'Delete', confirmColor = '#ef4444' }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
    PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
      <WarningAmberRoundedIcon sx={{ color: confirmColor, fontSize: 28 }} />
      <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#1a1a2e' }}>{title}</Typography>
    </DialogTitle>
    <DialogContent>
      <Typography sx={{ color: '#555', fontSize: 14, lineHeight: 1.6 }}>{message}</Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
      <Button onClick={onClose} sx={{ borderRadius: 2, textTransform: 'none', color: '#666', fontWeight: 600 }}>
        Cancel
      </Button>
      <Button
        onClick={() => { onConfirm?.(); onClose(); }}
        variant="contained"
        sx={{
          borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3,
          background: confirmColor,
          '&:hover': { background: confirmColor, filter: 'brightness(0.9)' },
          boxShadow: 'none',
        }}
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
