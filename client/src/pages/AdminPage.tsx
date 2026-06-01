import {
  Assignment as AssignmentIcon,
  ChevronRight as ChevronRightIcon,
  EmojiEvents as DiplomaIcon,
  ExpandMore as ExpandMoreIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Grid,
  IconButton,
  InputAdornment,
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
  const [tab, setTab] = useState<'dashboard' | 'students'>('dashboard');
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

  const statCards = [
    { label: 'admin.stats.total_students', value: stats?.total_students, icon: PeopleIcon, color: 'primary' as const },
    { label: 'admin.stats.active_students', value: stats?.active_students, icon: SchoolIcon, color: 'success' as const },
    { label: 'admin.stats.active_tracks', value: stats?.active_tracks, icon: AssignmentIcon, color: 'info' as const },
    { label: 'admin.stats.completion_rate', value: `${stats?.completion_rate ?? 0}%`, icon: TrendingUpIcon, color: 'info' as const },
    { label: 'admin.stats.pending_enrollments', value: stats?.pending_enrollments, icon: AssignmentIcon, color: 'warning' as const },
    { label: 'admin.stats.certificates_issued', value: stats?.total_certificates, icon: DiplomaIcon, color: 'secondary' as const },
    { label: 'admin.stats.eligible', value: stats?.eligible_count, icon: SchoolIcon, color: 'success' as const },
    { label: 'admin.stats.not_eligible', value: stats?.not_eligible_count, icon: SchoolIcon, color: 'error' as const },
  ];

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
        setPagination(data.pagination);
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

  const tabs = [
    { key: 'dashboard' as const, label: 'Dashboard' },
    { key: 'students' as const, label: 'Students' },
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
              <Grid container spacing={3}>
                {statCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={stat.label}>
                      <Card>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Icon color={stat.color as 'primary' | 'success' | 'info' | 'warning' | 'error' | 'inherit' | 'disabled' | 'action'} sx={{ fontSize: 48 }} />
                          <Box>
                            <Typography variant="h4">{stat.value ?? 0}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t(stat.label)}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )
      )}

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
    </Box>
  );
}
