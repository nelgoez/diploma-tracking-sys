import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { api } from '../lib/api';

function handleAuthResponse(response: { access_token: string, refresh_token: string, user: { id: string, name: string, role: string } }) {
  localStorage.setItem('token', response.access_token);
  localStorage.setItem('refreshToken', response.refresh_token);
  localStorage.setItem('userId', response.user.id);
  localStorage.setItem('userRole', response.user.role);
  localStorage.setItem('userName', response.user.name);
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(email, password);
      handleAuthResponse(response);
      void navigate('/app/dashboard');
    }
    catch (err) {
      setError(err instanceof Error ? err.message : t('login.error'));
    }
    finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await api.postPublic<{ access_token: string, refresh_token: string, user: { id: string, name: string, role: string } }>('/auth/demo', {});
      handleAuthResponse(response);
      void navigate('/app/dashboard');
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Demo access unavailable');
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ position: 'fixed', top: 16, right: 16 }}>
        <LanguageSwitcher />
      </Box>
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom textAlign="center">
            {t('app.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            {t('app.subtitle')}
          </Typography>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => { void handleDemo(); }}
            disabled={loading}
            sx={{ mb: 2 }}
            color="secondary"
            data-testid="demo-btn"
          >
            {loading ? <CircularProgress size={24} /> : 'Demo Access — Explore the System'}
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">or sign in</Typography>
          </Divider>

          <form onSubmit={(e) => { void handleSubmit(e); }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label={t('login.email')}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              inputProps={{ 'data-testid': 'email-input' }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label={t('login.password')}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              inputProps={{ 'data-testid': 'password-input' }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="outlined"
              fullWidth
              size="large"
              disabled={loading}
              data-testid="login-btn"
            >
              {loading ? <CircularProgress size={24} /> : t('login.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
