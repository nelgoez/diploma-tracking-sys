import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { EmptyState, NoSearchResults, SystemReady } from './illustrations';

interface VerificationRow {
  id: string
  reference_code: string
  verification_url: string
  is_active: boolean
  created_at: string
  verified_count: number
  revoked_at: string | null
  enrollment: {
    student_id: string
    student: { name: string, email: string }
    track: { name: string }
  }
}

interface VerificationsResponse {
  data: VerificationRow[]
  pagination: { page: number, limit: number, total: number, pages: number }
}

const STATUS_COLORS: Record<string, 'success' | 'default'> = {
  active: 'success',
  revoked: 'default',
};

export function VerificationsTab() {
  const token = localStorage.getItem('token') || '';
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [pagination, setPagination] = useState({ page: 0, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<VerificationRow | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, page: 0 }));
    }, 400);
    return () => { if (debounceRef.current) { clearTimeout(debounceRef.current); } };
  }, [search]);

  useEffect(() => {
    const fetchVerifications = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pagination.page + 1),
          limit: String(pagination.limit),
          status,
        });
        if (debouncedSearch) { params.set('search', debouncedSearch); }
        const data = await api.get<VerificationsResponse>(
          `/verify/admin/verifications?${params.toString()}`,
          token,
        );
        setRows(data.data);
        setPagination({ ...data.pagination, page: data.pagination.page - 1 });
      }
      catch {
        // silently fail
      }
      finally {
        setLoading(false);
      }
    };

    void fetchVerifications();
  }, [token, pagination.page, pagination.limit, debouncedSearch, status]);

  const handleRevoke = async () => {
    if (!revokeTarget) { return; }
    setRevoking(true);
    try {
      await api.put<VerificationRow>(
        `/verify/admin/verifications/${revokeTarget.id}/revoke`,
        {},
        token,
      );
      setRows(prev => prev.map(r => (
        r.id === revokeTarget.id
          ? { ...r, is_active: false, revoked_at: new Date().toISOString() }
          : r
      )));
      setSnackbar('Enlace de verificación revocado');
    }
    catch {
      setSnackbar('No se pudo revocar el enlace');
    }
    finally {
      setRevoking(false);
      setRevokeTarget(null);
    }
  };

  const handleRegenerate = async (row: VerificationRow) => {
    setRegeneratingId(row.id);
    try {
      const updated = await api.post<VerificationRow>(
        `/verify/admin/verifications/${row.id}/regenerate`,
        {},
        token,
      );
      setRows(prev => prev.map(r => (
        r.id === row.id
          ? { ...r, is_active: false, revoked_at: new Date().toISOString() }
          : r
      )));
      setSnackbar(`Nuevo código generado: ${updated.reference_code}`);
    }
    catch {
      setSnackbar('No se pudo regenerar el enlace');
    }
    finally {
      setRegeneratingId(null);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setSnackbar('URL copiada al portapapeles');
    }
    catch {
      setSnackbar('No se pudo copiar la URL');
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {pagination.total > 0
              ? `Mostrando ${rows.length} de ${pagination.total} verificaciones`
              : 'Verificaciones'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPagination(prev => ({ ...prev, page: 0 }));
                }}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="active">Activas</MenuItem>
                <MenuItem value="revoked">Revocadas</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        {loading
          ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )
          : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Track</TableCell>
                        <TableCell>Reference code</TableCell>
                        <TableCell>Verification URL</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell align="right">Times verified</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ border: 'none', p: 0 }}>
                            <EmptyState
                              illustration={debouncedSearch || status !== 'all' ? <NoSearchResults /> : <SystemReady />}
                              title={debouncedSearch || status !== 'all' ? 'No encontramos verificaciones' : 'No hay verificaciones emitidas'}
                              description={debouncedSearch || status !== 'all' ? 'Probá con otros filtros de búsqueda.' : 'Los enlaces de verificación aparecerán cuando se emitan diplomas.'}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                      {rows.map(row => (
                        <TableRow key={row.id} hover>
                          <TableCell>{row.enrollment?.student?.name || '-'}</TableCell>
                          <TableCell>{row.enrollment?.track?.name || '-'}</TableCell>
                          <TableCell>
                            <Typography fontFamily="monospace" variant="body2">
                              {row.reference_code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography
                                variant="body2"
                                component="a"
                                href={row.verification_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: 'primary.main', textDecoration: 'none' }}
                              >
                                {row.verification_url}
                              </Typography>
                              <Tooltip title="Copiar URL">
                                <IconButton size="small" onClick={() => void copyUrl(row.verification_url)}>
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.is_active ? 'Active' : 'Revoked'}
                              color={STATUS_COLORS[row.is_active ? 'active' : 'revoked']}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(row.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">{row.verified_count}</TableCell>
                          <TableCell align="right">
                            {row.is_active && (
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                <Tooltip title="Regenerar código">
                                  <IconButton
                                    size="small"
                                    disabled={regeneratingId === row.id}
                                    onClick={() => void handleRegenerate(row)}
                                  >
                                    <RefreshIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Button size="small" color="error" onClick={() => setRevokeTarget(row)}>
                                  Revoke
                                </Button>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={pagination.total}
                  page={pagination.page}
                  onPageChange={(_, newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                  rowsPerPage={pagination.limit}
                  onRowsPerPageChange={(e) => {
                    setPagination(prev => ({ ...prev, limit: Number.parseInt(e.target.value, 10), page: 0 }));
                  }}
                  rowsPerPageOptions={[10, 20, 50]}
                />
              </>
            )}
      </CardContent>

      <Dialog open={!!revokeTarget} onClose={() => setRevokeTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Revocar verificación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Revocar el enlace de verificación
            {' '}
            <strong>{revokeTarget?.reference_code}</strong>
            ? El enlace dejará de funcionar inmediatamente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeTarget(null)}>Cancelar</Button>
          <Button variant="contained" color="error" disabled={revoking} onClick={() => void handleRevoke()}>
            {revoking ? 'Revocando...' : 'Revocar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Card>
  );
}
