import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onSessionExpired } from '../lib/api';

export function SessionManager() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setOpen(true);
    });
    return unsubscribe;
  }, []);

  const handleReLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    setOpen(false);
    void navigate('/login');
  };

  return (
    <Dialog open={open} disableEscapeKeyDown>
      <DialogTitle>Sesión expirada</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Tu sesión ha expirado por inactividad. Volvé a iniciar sesión para continuar.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReLogin} variant="contained">
          Iniciar sesión
        </Button>
      </DialogActions>
    </Dialog>
  );
}
