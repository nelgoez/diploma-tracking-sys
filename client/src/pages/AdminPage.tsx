import {
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
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
import { CourseManagement } from '../components/CourseManagement';
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
  const [tab, setTab] = useState<'dashboard' | 'students' | 'courses'>('dashboard');
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
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'estudiante' });
  const [userError, setUserError] = useState('');

  const handleCreateUser = async () => {
    setUserError('');
    if (!newUser.email || !newUser.password || !newUser.name) {
      setUserError('Email, password, and name are required');
      return;
    }
    try {
      const token = localStorage.getItem('token') || '';
      await api.post('/admin/users', newUser, token);
      setUserDialog(false);
      setNewUser({ email: '', password: '', name: '', role: 'estudiante' });
    }
    catch (err) {
      setUserError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const tabs = [
    { key: 'dashboard' as const, label: 'Dashboard' },
    { key: 'students' as const, label: 'Students' },
    { key: 'courses' as const, label: 'Courses' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('nav.admin')}
      </Typography>

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
          : (
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
      )}

      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Email"
              type="email"
              size="small"
              value={newUser.email}
              onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
            />
            <TextField
              label="Name"
              size="small"
              value={newUser.name}
              onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              label="Password"
              type="password"
              size="small"
              value={newUser.password}
              onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
            />
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
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateUser}>Create</Button>
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
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {students.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={8} align="center">
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                  {debouncedSearch ? 'No students match your search' : 'No students found'}
                                </Typography>
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
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ py: 0, borderBottom: expandedRow === s.id ? undefined : 'none' }} colSpan={8}>
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
    </Box>
  );
}
