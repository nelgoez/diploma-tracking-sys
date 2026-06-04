import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  CloudSync as SyncIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

interface ProviderHealth {
  status: string | null
  last_sync: string | null
  records_synced: number
  errors: number
}

interface IntegrationStatus {
  demo?: boolean
  moodle: ProviderHealth
  guarani: ProviderHealth
}

const mapStatus = (raw: string | null | undefined): 'ok' | 'warning' | 'error' => {
  if (!raw) { return 'warning'; }
  if (raw === 'connected' || raw === 'ok') { return 'ok'; }
  if (raw === 'disconnected') { return 'warning'; }
  if (raw === 'error') { return 'error'; }
  return 'warning';
};

const STATUS_TIMEOUT_MS = 15000;

export function IntegrationsPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<{ moodle: boolean, guarani: boolean }>({ moodle: false, guarani: false });
  const [syncError, setSyncError] = useState<string | null>(null);

  const fetchStatus = async () => {
    const token = localStorage.getItem('token') || '';
    setLoadError(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/integrations/status`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) { throw new Error(`Status ${res.status}`); }
      const data = await res.json() as IntegrationStatus;
      setStatus(data);
    }
    catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setLoadError('La página tardó demasiado en cargar. Los servicios externos (Moodle, Guaraní) pueden estar lentos.');
      }
      else {
        setLoadError(err instanceof Error ? err.message : 'Error al cargar estado');
      }
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
  }, []);

  const handleSync = async (integration: 'moodle' | 'guarani') => {
    setSyncing(prev => ({ ...prev, [integration]: true }));
    setSyncError(null);
    const token = localStorage.getItem('token') || '';
    try {
      await api.post(`/integrations/sync/${integration}`, {}, token);
      await fetchStatus();
    }
    catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setSyncError('Sincronización abortada — posiblemente excedió el tiempo límite del servidor. Verificá la conectividad con Moodle/Guaraní.');
      }
      else {
        setSyncError(err instanceof Error ? err.message : 'Sync failed');
      }
    }
    finally {
      setSyncing(prev => ({ ...prev, [integration]: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">Consultando servicios externos...</Typography>
      </Box>
    );
  }

  if (loadError && !status) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>{t('nav.integrations')}</Typography>
        <Alert severity="warning" action={<Button size="small" onClick={() => { setLoading(true); void fetchStatus(); }}>Reintentar</Button>}>
          {loadError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('nav.integrations')}
      </Typography>

      {loadError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setLoadError(null)}>{loadError}</Alert>
      )}

      <Grid container spacing={3}>
        {syncError && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="error" onClose={() => setSyncError(null)}>{syncError}</Alert>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">{t('integration.moodle')}</Typography>
                  <Chip
                    label={t(`integration.status.${mapStatus(status?.moodle.status)}`)}
                    color={getStatusColor(mapStatus(status?.moodle.status))}
                    size="small"
                    icon={getStatusIcon(mapStatus(status?.moodle.status))}
                  />
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<SyncIcon />}
                  onClick={() => { void handleSync('moodle'); }}
                  disabled={syncing.moodle}
                >
                  {syncing.moodle ? <CircularProgress size={20} /> : t('button.sync')}
                </Button>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('integration.last_sync')}
                  :
                  {' '}
                  {status?.moodle.last_sync
                    ? new Date(status.moodle.last_sync).toLocaleString()
                    : t('integration.never')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('integration.records_synced')}
                  :
                  {' '}
                  {status?.moodle.records_synced ?? 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">{t('integration.guarani')}</Typography>
                  <Chip
                    label={t(`integration.status.${mapStatus(status?.guarani.status)}`)}
                    color={getStatusColor(mapStatus(status?.guarani.status))}
                    size="small"
                    icon={getStatusIcon(mapStatus(status?.guarani.status))}
                  />
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<SyncIcon />}
                  onClick={() => { void handleSync('guarani'); }}
                  disabled={syncing.guarani}
                >
                  {syncing.guarani ? <CircularProgress size={20} /> : t('button.sync')}
                </Button>
              </Box>

              {mapStatus(status?.guarani.status) !== 'ok' && (
                <Alert severity={mapStatus(status?.guarani.status) === 'error' ? 'error' : 'warning'} sx={{ mb: 2 }}>
                  {status?.guarani.status === 'disconnected'
                    ? 'Guaraní no está configurado — falta el token de acceso (GUARANI_TOKEN).'
                    : t('integration.sync_errors', { count: status?.guarani.errors ?? 0 })}
                </Alert>
              )}

              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('integration.last_sync')}
                  :
                  {' '}
                  {status?.guarani.last_sync
                    ? new Date(status.guarani.last_sync).toLocaleString()
                    : t('integration.never')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('integration.records_synced')}
                  :
                  {' '}
                  {status?.guarani.records_synced ?? 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
