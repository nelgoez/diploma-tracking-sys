import {
  ChevronRight as ChevronRightIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminStatsGrid } from '../components/AdminStatsGrid';
import { AnalyticsTab } from '../components/AnalyticsTab';
import { CourseManagement } from '../components/CourseManagement';
import { EmptyState, NoSearchResults, SystemReady } from '../components/illustrations';
import { PageHeader } from '../components/PageHeader';
import { VerificationsTab } from '../components/VerificationsTab';
import { api } from '../lib/api';

interface DashboardStats {
  total_students: number
  active_students: number
  completion_rate: number
  pending_enrollments: number
  total_certificates: number
  eligible_count: number
  not_eligible_count: number
  active_tracks: number
  recent_sync_errors: number
}

interface Student {
  id: string
  name: string
  email: string
  dni: string
  role: string
  is_active: boolean
  created_at?: string
  certificates: { count: number }
  enrollments: { count: number }
}

interface StudentsResponse {
  data: Student[]
  pagination: { page: number, limit: number, total: number, pages: number }
}

export function AdminPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'dashboard' | 'students' | 'courses' | 'analytics' | 'verifications'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const data = await api.get<DashboardStats>('/admin/dashboard-stats', token);
        setStats(data);
      }
      catch {
        // Stats remain null on error
      }
      finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, []);

  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState({ page: 0, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
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
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const token = localStorage.getItem('token') || '';
        const p = pagination.page + 1;
        const params = new URLSearchParams({ page: String(p), limit: String(pagination.limit) });
        if (debouncedSearch) { params.set('search', debouncedSearch); }
        const data = await api.get<StudentsResponse>(`/admin/students?${params.toString()}`, token);
        setStudents(data.data);
        setPagination({ ...data.pagination, page: data.pagination.page - 1 });
      }
      catch {
        // silently fail
      }
      finally {
        setLoadingStudents(false);
      }
    };

    if (tab === 'students') {
      void fetchStudents();
    }
  }, [tab, pagination.page, pagination.limit, debouncedSearch]);

  const [userDialog, setUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<Student | null>(null);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'estudiante' });
  const [userError, setUserError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const handleCreateUser = async () => {
    setUserError('');
    if (!newUser.email || !newUser.name) {
      setUserError('Email and name are required');
      return;
    }
    try {
      const token = localStorage.getItem('token') || '';
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, { name: newUser.name, role: newUser.role }, token);
      }
      else {
        if (!newUser.password) {
          setUserError('Password is required for new users');
          return;
        }
        await api.post('/admin/users', newUser, token);
      }
      setUserDialog(false);
      setEditingUser(null);
      setNewUser({ email: '', password: '', name: '', role: 'estudiante' });
      if (tab === 'students') { setPagination(prev => ({ ...prev, page: prev.page })); }
    }
    catch (err) {
      setUserError(err instanceof Error ? err.message : 'Failed to save user');
    }
  };

  const handleToggleActive = async (student: Student) => {
    try {
      const token = localStorage.getItem('token') || '';
      await api.put(`/admin/users/${student.id}`, { is_active: !student.is_active }, token);
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, is_active: !s.is_active } : s));
    }
    catch {
      // silently fail
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) { return; }
    try {
      const token = localStorage.getItem('token') || '';
      await api.delete(`/admin/users/${deleteTarget.id}`, token);
      setStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
    }
    catch {
      // silently fail
    }
    finally {
      setDeleteTarget(null);
    }
  };

  const handleEditUser = (student: Student) => {
    setEditingUser(student);
    setNewUser({
      email: student.email,
      password: '',
      name: student.name,
      role: student.role,
    });
    setUserDialog(true);
  };

  const tabs = [
    { key: 'dashboard' as const, label: t('admin.tabs.dashboard') },
    { key: 'students' as const, label: t('admin.tabs.students') },
    { key: 'courses' as const, label: t('admin.tabs.courses') },
    { key: 'analytics' as const, label: t('admin.tabs.analytics') },
    { key: 'verifications' as const, label: t('admin.tabs.verifications') },
  ];

  return (
    <Box>
      <PageHeader
        title="Administración"
        description="Gestión de estudiantes, cursos, tracks y dashboard del sistema"
      />

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {tabs.map(tabItem => (
          <Button
            key={tabItem.key}
            variant={tab === tabItem.key ? 'contained' : 'outlined'}
            onClick={() => { setTab(tabItem.key); }}
            size="small"
          >
            {tabItem.label}
          </Button>
        ))}
      </Box>

      {tab === 'dashboard' && (
        loading
          ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )
          : stats
            ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PersonAddIcon />}
                      onClick={() => setUserDialog(true)}
                    >
                      Create User
                    </Button>
                  </Box>
                  <AdminStatsGrid stats={stats} />
                </>
              )
            : (
                <Card>
                  <EmptyState
                    illustration={<SystemReady />}
                    title="El sistema está listo"
                    description="Los datos y estadísticas aparecerán aquí cuando haya actividad en el sistema."
                  />
                </Card>
              )
      )}

      <Dialog open={userDialog} onClose={() => { setUserDialog(false); setEditingUser(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Email"
              type="email"
              size="small"
              value={newUser.email}
              disabled={!!editingUser}
              onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
            />
            <TextField
              label="Name"
              size="small"
              value={newUser.name}
              onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
            />
            {!editingUser && (
              <TextField
                label="Password"
                type="password"
                size="small"
                value={newUser.password}
                onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
            )}
            <FormControl size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={newUser.role}
                label="Role"
                onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
              >
                <MenuItem value="estudiante">Student</MenuItem>
                <MenuItem value="coordinador">Coordinator</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="sysadmin">Sysadmin</MenuItem>
              </Select>
            </FormControl>
            {userError && (
              <Typography variant="caption" color="error">{userError}</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUserDialog(false); setEditingUser(null); }}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleCreateUser()}>{editingUser ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Student</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete
            {' '}
            <strong>{deleteTarget?.name}</strong>
            {' '}
            (
            {deleteTarget?.email}
            )? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => void handleDelete()}>Delete</Button>
        </DialogActions>
      </Dialog>

      {tab === 'students' && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {pagination.total > 0
                  ? `Showing ${students.length} of ${pagination.total} total students`
                  : 'Students'}
              </Typography>
              <TextField
                size="small"
                placeholder="Search by name, email, or DNI..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                sx={{ width: 350 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            {loadingStudents
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
                            <TableCell sx={{ width: 40 }} />
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>DNI</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Certificates</TableCell>
                            <TableCell>Enrollments</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell sx={{ width: 140 }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {students.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={9} sx={{ border: 'none', p: 0 }}>
                                <EmptyState
                                  illustration={<NoSearchResults />}
                                  title={debouncedSearch ? 'No encontramos estudiantes' : 'No hay estudiantes registrados'}
                                  description={debouncedSearch ? 'Probá con otro término de búsqueda.' : 'Los estudiantes aparecerán cuando se registren en el sistema.'}
                                />
                              </TableCell>
                            </TableRow>
                          )}
                          {students.map(s => (
                            <>
                              <TableRow
                                key={s.id}
                                hover
                                sx={{ cursor: 'pointer' }}
                                onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                              >
                                <TableCell>
                                  <IconButton size="small">
                                    {expandedRow === s.id ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                                  </IconButton>
                                </TableCell>
                                <TableCell>{s.name}</TableCell>
                                <TableCell>{s.email}</TableCell>
                                <TableCell>{s.dni || '-'}</TableCell>
                                <TableCell>
                                  <Chip label={s.role} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell>{s.certificates?.count ?? 0}</TableCell>
                                <TableCell>{s.enrollments?.count ?? 0}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={s.is_active ? 'Active' : 'Inactive'}
                                    color={s.is_active ? 'success' : 'default'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditUser(s); }} title="Edit">
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); void handleToggleActive(s); }} title={s.is_active ? 'Deactivate' : 'Activate'}>
                                      {s.is_active ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
                                    </IconButton>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }} title="Delete" color="error">
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ py: 0, borderBottom: expandedRow === s.id ? undefined : 'none' }} colSpan={9}>
                                  <Collapse in={expandedRow === s.id} timeout="auto" unmountOnExit>
                                    <Box sx={{ py: 2, px: 4 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        User ID:
                                        {' '}
                                        {s.id}
                                      </Typography>
                                      {s.created_at && (
                                        <Typography variant="body2" color="text.secondary">
                                          Created:
                                          {' '}
                                          {new Date(s.created_at).toLocaleDateString()}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </>
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
        </Card>
      )}

      {tab === 'courses' && <CourseManagement />}

      {tab === 'analytics' && <AnalyticsTab />}

      {tab === 'verifications' && <VerificationsTab />}
    </Box>
  );
}
