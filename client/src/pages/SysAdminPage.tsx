import {
  Add as AddIcon,
  Block as BlockIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Science as DiagnosticsIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { CourseManagement } from '../components/CourseManagement';
import { EmptyState, NoOverrides } from '../components/illustrations';
import { PageHeader } from '../components/PageHeader';
import { api } from '../lib/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface Course {
  id: string
  name: string
  code: string
  credits: number
  order_index: number
  is_active: boolean
  is_integrator_exam: boolean
  track: { id: string, name: string } | null
}

interface Track {
  id: string
  name: string
  code: string
  description?: string
  credits_required?: number
  is_active: boolean
  courses: { count: number }
}

interface Rule {
  id: string
  condition: string
  is_active: boolean
  target_course: { id: string, name: string, code: string }
  sources: { source_course_id: string }[]
  parent_rule_id?: string | null
}

interface EligibilityResult {
  eligible: boolean
  rule_breakdown: {
    rule_id: string
    satisfied: boolean
    condition: string
    children: unknown[]
  }[]
}

interface Diagnostics {
  timestamp: string
  environment: string
  mock_mode: boolean
  db: { status: string, tables: Record<string, number> }
  integrations: { moodle: { last_sync: string | null }, guarani: { last_sync: string | null }, recent_errors_7d: number }
}

interface StudentSummary {
  id: string
  first_name?: string
  last_name?: string
  email: string
}

interface OverrideItem {
  id: string
  student: { id: string, name?: string, first_name?: string, last_name?: string, email: string }
  rule: { id: string, condition: string, target_course_id: string }
  reason: string
  status: string
  expires_at: string | null
  created_at: string
}

export function SysAdminPage() {
  const token = localStorage.getItem('token') || '';

  const [tab, setTab] = useState<'courses' | 'tracks' | 'rules' | 'overrides' | 'diagnostics'>('courses');
  const [dialogType, setDialogType] = useState<'course' | 'track' | 'evaluate'>('course');
  const [courses, setCourses] = useState<Course[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [trackForm, setTrackForm] = useState({
    name: '',
    code: '',
    description: '',
    credits_required: 0,
    is_active: true,
  });
  const [evalForm, setEvalForm] = useState({ student_id: '', track_id: '' });
  const [evalResult, setEvalResult] = useState<EligibilityResult | null>(null);

  // -- rule dialog state
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleDialogMode, setRuleDialogMode] = useState<'create' | 'edit'>('create');
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    target_course_id: '',
    condition: 'ALL',
    source_course_ids: [] as string[],
    parent_rule_id: '',
    is_active: true,
  });

  // -- override dialog state
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    student_id: '',
    rule_id: '',
    reason: '',
    expires_at: '',
  });

  // -- overrides table state
  const [overrides, setOverrides] = useState<OverrideItem[]>([]);
  const [overrideStatusFilter, setOverrideStatusFilter] = useState<'active' | 'expired' | 'revoked'>('active');
  const [students, setStudents] = useState<StudentSummary[]>([]);

  // -- delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState('');

  const fetchCourses = async () => {
    try {
      const data = await api.get<Course[]>('/admin/courses', token);
      setCourses(data);
    }
    catch {
      setSnackbar({ open: true, message: 'Failed to load courses', severity: 'error' });
    }
    finally {
      setLoading(false);
    }
  };

  const fetchTracks = async () => {
    try {
      const data = await api.get<Track[]>('/admin/tracks', token);
      setTracks(data);
    }
    catch {
      setSnackbar({ open: true, message: 'Failed to load tracks', severity: 'error' });
    }
    finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      const data = await api.get<Rule[]>('/rules', token);
      setRules(data);
    }
    catch {
      setSnackbar({ open: true, message: 'Failed to load rules', severity: 'error' });
    }
    finally {
      setLoading(false);
    }
  };

  const fetchDiagnostics = async () => {
    try {
      const data = await api.get<Diagnostics>('/system/diagnostics', token);
      setDiagnostics(data);
    }
    catch {
      setSnackbar({ open: true, message: 'Failed to load diagnostics', severity: 'error' });
    }
    finally {
      setLoading(false);
    }
  };

  const fetchOverrides = async () => {
    try {
      const data = await api.get<{ data: OverrideItem[], pagination: unknown }>(
        `/overrides?status=${overrideStatusFilter}`,
        token,
      );
      setOverrides(data.data || []);
    }
    catch {
      setSnackbar({ open: true, message: 'Failed to load overrides', severity: 'error' });
    }
    finally {
      setLoading(false);
    }
  };

  const ensureCourses = async () => {
    if (courses.length > 0) { return; }
    try { const data = await api.get<Course[]>('/admin/courses', token); setCourses(data); }
    catch { /* */ }
  };

  const ensureStudents = async () => {
    if (students.length > 0) { return; }
    try {
      const data = await api.get<{ data: StudentSummary[], pagination: unknown }>('/admin/students', token);
      setStudents(data.data || []);
    }
    catch { /* */ }
  };

  useEffect(() => {
    setLoading(true);
    if (tab === 'courses') { void fetchCourses(); }
    else if (tab === 'tracks') { void fetchTracks(); }
    else if (tab === 'rules') { void fetchRules(); }
    else if (tab === 'overrides') { void fetchOverrides(); }
    else { void fetchDiagnostics(); }
  }, [tab, overrideStatusFilter]);

  const handleSaveTrack = async () => {
    try {
      if (dialogMode === 'create') {
        await api.post<Track>('/tracks', trackForm, token);
        setSnackbar({ open: true, message: 'Track created', severity: 'success' });
      }
      else if (editingTrack) {
        await fetch(`${API_BASE}/tracks/${editingTrack.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(trackForm),
        });
        setSnackbar({ open: true, message: 'Track updated', severity: 'success' });
      }
      setDialogOpen(false);
      void fetchTracks();
    }
    catch {
      setSnackbar({ open: true, message: 'Failed to save track', severity: 'error' });
    }
  };

  const handleToggleTrack = async (track: Track) => {
    try {
      const res = await fetch(`${API_BASE}/tracks/${track.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_active: !track.is_active }),
      });
      if (res.ok) {
        setSnackbar({ open: true, message: `Track ${track.is_active ? 'deactivated' : 'activated'}`, severity: 'success' });
        void fetchTracks();
      }
      else {
        const err = await res.json() as { error: string };
        setSnackbar({ open: true, message: err.error || 'Failed to toggle track', severity: 'error' });
      }
    }
    catch {
      setSnackbar({ open: true, message: 'Failed to toggle track', severity: 'error' });
    }
  };

  const handleEvaluate = async () => {
    try {
      const result = await api.post<EligibilityResult>('/rules/evaluate', evalForm, token);
      setEvalResult(result);
    }
    catch {
      setSnackbar({ open: true, message: 'Evaluation failed', severity: 'error' });
    }
  };

  const openTrackDialog = (mode: 'create' | 'edit', track?: Track) => {
    setDialogType('track');
    setDialogMode(mode);
    if (mode === 'edit' && track) {
      setEditingTrack(track);
      setTrackForm({
        name: track.name,
        code: track.code,
        description: track.description || '',
        credits_required: track.credits_required || 0,
        is_active: track.is_active,
      });
    }
    else {
      setEditingTrack(null);
      setTrackForm({ name: '', code: '', description: '', credits_required: 0, is_active: true });
    }
    setDialogOpen(true);
  };

  const openEvalDialog = () => {
    setDialogType('evaluate');
    setEvalResult(null);
    setEvalForm({ student_id: '', track_id: '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (dialogType === 'track') { void handleSaveTrack(); }
  };

  // ========== rule handlers ==========

  const handleSaveRule = async () => {
    if (ruleDialogMode === 'create') {
      try {
        await api.post('/rules', {
          target_course_id: ruleForm.target_course_id,
          condition: ruleForm.condition,
          source_course_ids: ruleForm.source_course_ids,
          parent_rule_id: ruleForm.parent_rule_id || undefined,
        }, token);
        setSnackbar({ open: true, message: 'Rule created', severity: 'success' });
        setRuleDialogOpen(false);
        void fetchRules();
      }
      catch {
        setSnackbar({ open: true, message: 'Failed to create rule', severity: 'error' });
      }
    }
    else if (ruleDialogMode === 'edit' && editingRule) {
      try {
        const res = await fetch(`${API_BASE}/rules/${editingRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            condition: ruleForm.condition,
            is_active: ruleForm.is_active,
            source_course_ids: ruleForm.source_course_ids,
          }),
        });
        if (res.ok) {
          setSnackbar({ open: true, message: 'Rule updated', severity: 'success' });
          setRuleDialogOpen(false);
          void fetchRules();
        }
        else {
          const err = await res.json().catch(() => ({})) as { error?: string };
          setSnackbar({ open: true, message: err.error || 'Failed to update rule', severity: 'error' });
        }
      }
      catch {
        setSnackbar({ open: true, message: 'Failed to update rule', severity: 'error' });
      }
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/rules/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSnackbar({ open: true, message: 'Rule deleted', severity: 'success' });
        void fetchRules();
      }
      else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setSnackbar({ open: true, message: err.error || 'Failed to delete', severity: 'error' });
      }
    }
    catch {
      setSnackbar({ open: true, message: 'Failed to delete rule', severity: 'error' });
    }
  };

  const openRuleDialog = (mode: 'create' | 'edit', rule?: Rule) => {
    void ensureCourses();
    setRuleDialogMode(mode);
    if (mode === 'edit' && rule) {
      setEditingRule(rule);
      setRuleForm({
        target_course_id: rule.target_course.id,
        condition: rule.condition,
        source_course_ids: rule.sources.map(s => s.source_course_id),
        parent_rule_id: rule.parent_rule_id || '',
        is_active: rule.is_active,
      });
    }
    else {
      setEditingRule(null);
      setRuleForm({ target_course_id: '', condition: 'ALL', source_course_ids: [], parent_rule_id: '', is_active: true });
    }
    setRuleDialogOpen(true);
  };

  const openDeleteConfirm = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const getRuleDepth = (rule: Rule, all: Rule[]): number => {
    let depth = 0;
    let current = rule;
    for (let i = 0; i < 20; i++) {
      if (!current.parent_rule_id) { break; }
      const parent = all.find(r => r.id === current.parent_rule_id);
      if (!parent) { break; }
      depth++;
      current = parent;
    }
    return depth;
  };

  // ========== override handlers ==========

  const handleSaveOverride = async () => {
    if (overrideForm.reason.length < 10) {
      setSnackbar({ open: true, message: 'Reason must be at least 10 characters', severity: 'error' });
      return;
    }
    try {
      const body: Record<string, unknown> = {
        student_id: overrideForm.student_id,
        rule_id: overrideForm.rule_id,
        reason: overrideForm.reason,
      };
      if (overrideForm.expires_at) { body.expires_at = overrideForm.expires_at; }
      await api.post('/overrides', body, token);
      setSnackbar({ open: true, message: 'Override created', severity: 'success' });
      setOverrideDialogOpen(false);
      void fetchOverrides();
    }
    catch {
      setSnackbar({ open: true, message: 'Failed to create override', severity: 'error' });
    }
  };

  const handleRevokeOverride = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/overrides/${id}/revoke`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSnackbar({ open: true, message: 'Override revoked', severity: 'success' });
        void fetchOverrides();
      }
      else {
        setSnackbar({ open: true, message: 'Failed to revoke override', severity: 'error' });
      }
    }
    catch {
      setSnackbar({ open: true, message: 'Failed to revoke override', severity: 'error' });
    }
  };

  const openOverrideDialog = () => {
    void ensureStudents();
    void ensureCourses();
    setOverrideForm({ student_id: '', rule_id: '', reason: '', expires_at: '' });
    setOverrideDialogOpen(true);
  };

  const studentLabel = (s: StudentSummary) => {
    if (s.first_name || s.last_name) { return [s.first_name, s.last_name].filter(Boolean).join(' ') || s.email; }
    return s.email;
  };

  const overrideStudentLabel = (o: OverrideItem) => {
    if (o.student.name) { return o.student.name; }
    if (o.student.first_name || o.student.last_name) { return [o.student.first_name, o.student.last_name].filter(Boolean).join(' '); }
    return o.student.email;
  };

  const courseNameById = (id: string) => courses.find(c => c.id === id)?.name || id;

  const tabs = [
    { key: 'courses' as const, label: 'Courses' },
    { key: 'tracks' as const, label: 'Tracks' },
    { key: 'rules' as const, label: 'Rules' },
    { key: 'overrides' as const, label: 'Overrides' },
    { key: 'diagnostics' as const, label: 'Diagnostics' },
  ];

  const overrideStatusTabs: { key: typeof overrideStatusFilter, label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'expired', label: 'Expired' },
    { key: 'revoked', label: 'Revoked' },
  ];

  return (
    <Box>
      <PageHeader
        title="Sistema"
        description="Gestión de cursos, tracks, reglas, overrides y diagnóstico del sistema"
      />

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {tabs.map(t => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'contained' : 'outlined'}
            onClick={() => { setTab(t.key); }}
            size="small"
          >
            {t.label}
          </Button>
        ))}
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && tab === 'courses' && (
        <CourseManagement onSnackbar={(msg, severity) => setSnackbar({ open: true, message: msg, severity })} />
      )}

      {!loading && tab === 'tracks' && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Tracks (
                {tracks.length}
                )
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { openTrackDialog('create'); }}>
                  New Track
                </Button>
                <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => { setLoading(true); void fetchTracks(); }}>
                  Refresh
                </Button>
              </Box>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Courses</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tracks.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.code}</TableCell>
                      <TableCell>{t.courses?.count || 0}</TableCell>
                      <TableCell>
                        <Chip label={t.is_active ? 'Active' : 'Inactive'} color={t.is_active ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => { openTrackDialog('edit', t); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <Button
                          size="small"
                          variant="outlined"
                          color={t.is_active ? 'warning' : 'success'}
                          onClick={() => { void handleToggleTrack(t); }}
                          sx={{ ml: 0.5, fontSize: '0.75rem' }}
                        >
                          {t.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {!loading && tab === 'rules' && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Rules (
                {rules.length}
                )
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { openRuleDialog('create'); }}>
                  New Rule
                </Button>
                <Button variant="outlined" size="small" startIcon={<DiagnosticsIcon />} onClick={openEvalDialog}>
                  Evaluate Eligibility
                </Button>
                <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => { setLoading(true); void fetchRules(); }}>
                  Refresh
                </Button>
              </Box>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Target Course</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Sources</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.map((r) => {
                    const depth = getRuleDepth(r, rules);
                    return (
                      <TableRow key={r.id}>
                        <TableCell sx={{ pl: depth * 3 + 2 }}>
                          {r.target_course?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <Chip label={r.condition} color={r.condition === 'ALL' ? 'primary' : 'warning'} size="small" />
                        </TableCell>
                        <TableCell>{r.sources?.length || 0}</TableCell>
                        <TableCell>
                          <Chip label={r.is_active ? 'Active' : 'Inactive'} color={r.is_active ? 'success' : 'default'} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => { openRuleDialog('edit', r); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => { openDeleteConfirm(r.id); }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {!loading && tab === 'overrides' && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Overrides (
                {overrides.length}
                )
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openOverrideDialog}>
                  New Override
                </Button>
                <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => { setLoading(true); void fetchOverrides(); }}>
                  Refresh
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {overrideStatusTabs.map(st => (
                <Button
                  key={st.key}
                  variant={overrideStatusFilter === st.key ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => { setOverrideStatusFilter(st.key); }}
                >
                  {st.label}
                </Button>
              ))}
            </Box>

            {overrides.length === 0
              ? (
                  <EmptyState
                    illustration={<NoOverrides />}
                    title="No hay overrides activas"
                    description="Las excepciones manuales aparecerán aquí cuando se creen."
                  />
                )
              : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell>Rule Target</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell>Expires</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {overrides.map(o => (
                          <TableRow key={o.id}>
                            <TableCell>{overrideStudentLabel(o)}</TableCell>
                            <TableCell>{courseNameById(o.rule.target_course_id)}</TableCell>
                            <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {o.reason}
                            </TableCell>
                            <TableCell>
                              {o.expires_at ? new Date(o.expires_at).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={o.status}
                                color={o.status === 'active' ? 'success' : o.status === 'expired' ? 'warning' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              {o.status === 'active' && (
                                <IconButton size="small" color="warning" onClick={() => { void handleRevokeOverride(o.id); }}>
                                  <BlockIcon fontSize="small" />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
          </CardContent>
        </Card>
      )}

      {!loading && tab === 'diagnostics' && diagnostics && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>System</Typography>
                <Typography variant="body2">
                  Environment:
                  {diagnostics.environment}
                </Typography>
                <Typography variant="body2">
                  Mock mode:
                  {String(diagnostics.mock_mode)}
                </Typography>
                <Typography variant="body2">
                  Timestamp:
                  {new Date(diagnostics.timestamp).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  DB (
                  {diagnostics.db.status}
                  )
                </Typography>
                {Object.entries(diagnostics.db.tables).map(([k, v]) => (
                  <Typography key={k} variant="body2">
                    {k}
                    :
                    {' '}
                    {v}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Integrations</Typography>
                <Typography variant="body2">
                  Moodle last sync:
                  {' '}
                  {diagnostics.integrations.moodle?.last_sync ? new Date(diagnostics.integrations.moodle.last_sync).toLocaleString() : 'Never'}
                </Typography>
                <Typography variant="body2">
                  Guaraní last sync:
                  {' '}
                  {diagnostics.integrations.guarani?.last_sync ? new Date(diagnostics.integrations.guarani.last_sync).toLocaleString() : 'Never'}
                </Typography>
                <Typography variant="body2">
                  Recent errors (7d):
                  {diagnostics.integrations.recent_errors_7d}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Track / Evaluate shared dialog */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'track' && dialogMode === 'create' && 'New Track'}
          {dialogType === 'track' && dialogMode === 'edit' && 'Edit Track'}
          {dialogType === 'evaluate' && 'Evaluate Eligibility'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'track' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Name" value={trackForm.name} onChange={e => setTrackForm(prev => ({ ...prev, name: e.target.value }))} fullWidth />
              <TextField label="Code" value={trackForm.code} onChange={e => setTrackForm(prev => ({ ...prev, code: e.target.value }))} fullWidth />
              <TextField label="Description" value={trackForm.description} onChange={e => setTrackForm(prev => ({ ...prev, description: e.target.value }))} fullWidth multiline rows={2} />
              <TextField label="Credits Required" type="number" value={trackForm.credits_required} onChange={e => setTrackForm(prev => ({ ...prev, credits_required: Number(e.target.value) }))} fullWidth />
              <TextField label="Active" select value={String(trackForm.is_active)} onChange={e => setTrackForm(prev => ({ ...prev, is_active: e.target.value === 'true' }))} fullWidth>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Box>
          )}
          {dialogType === 'evaluate' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Student ID" value={evalForm.student_id} onChange={e => setEvalForm(prev => ({ ...prev, student_id: e.target.value }))} fullWidth />
              <TextField label="Track ID" value={evalForm.track_id} onChange={e => setEvalForm(prev => ({ ...prev, track_id: e.target.value }))} fullWidth />
              {evalResult && (
                <Alert severity={evalResult.eligible ? 'success' : 'warning'}>
                  {evalResult.eligible ? 'Student IS eligible' : 'Student is NOT eligible'}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CancelIcon />} onClick={() => { setDialogOpen(false); }}>Cancel</Button>
          {dialogType === 'track' && (
            <Button variant="contained" startIcon={dialogMode === 'create' ? <AddIcon /> : <EditIcon />} onClick={() => { void handleSave(); }}>
              {dialogMode === 'create' ? 'Create' : 'Save'}
            </Button>
          )}
          {dialogType === 'evaluate' && (
            <Button variant="contained" startIcon={<DiagnosticsIcon />} onClick={() => { void handleEvaluate(); }}>
              Evaluate
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Rule dialog */}
      <Dialog open={ruleDialogOpen} onClose={() => { setRuleDialogOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {ruleDialogMode === 'create' ? 'New Rule' : 'Edit Rule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Target Course"
              select
              value={ruleForm.target_course_id}
              onChange={e => setRuleForm(prev => ({ ...prev, target_course_id: e.target.value }))}
              fullWidth
              disabled={ruleDialogMode === 'edit'}
            >
              {courses.filter(c => c.is_active).map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                  {' '}
                  (
                  {c.code}
                  )
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Condition"
              select
              value={ruleForm.condition}
              onChange={e => setRuleForm(prev => ({ ...prev, condition: e.target.value }))}
              fullWidth
            >
              <MenuItem value="ALL">ALL — every source required</MenuItem>
              <MenuItem value="ANY">ANY — at least one source required</MenuItem>
            </TextField>
            <TextField
              label="Source Courses"
              select
              SelectProps={{
                multiple: true,
                renderValue: (selected) => {
                  const ids = selected as string[];
                  return ids.map(id => courses.find(c => c.id === id)?.name || id).join(', ');
                },
              }}
              value={ruleForm.source_course_ids}
              onChange={(e) => {
                const val = e.target.value as unknown as string[];
                setRuleForm(prev => ({ ...prev, source_course_ids: val }));
              }}
              fullWidth
            >
              {courses.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  <Checkbox checked={ruleForm.source_course_ids.includes(c.id)} size="small" />
                  {c.name}
                  {' '}
                  (
                  {c.code}
                  )
                </MenuItem>
              ))}
            </TextField>
            {ruleDialogMode === 'create' && (
              <TextField
                label="Parent Rule (optional)"
                select
                value={ruleForm.parent_rule_id}
                onChange={e => setRuleForm(prev => ({ ...prev, parent_rule_id: e.target.value }))}
                fullWidth
              >
                <MenuItem value="">None</MenuItem>
                {rules.filter(r => r.is_active).map(r => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.target_course?.name}
                    {' '}
                    (
                    {r.condition}
                    )
                  </MenuItem>
                ))}
              </TextField>
            )}
            {ruleDialogMode === 'edit' && (
              <TextField
                label="Active"
                select
                value={String(ruleForm.is_active)}
                onChange={e => setRuleForm(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                fullWidth
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CancelIcon />} onClick={() => { setRuleDialogOpen(false); }}>Cancel</Button>
          <Button variant="contained" startIcon={ruleDialogMode === 'create' ? <AddIcon /> : <EditIcon />} onClick={() => { void handleSaveRule(); }}>
            {ruleDialogMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Override dialog */}
      <Dialog open={overrideDialogOpen} onClose={() => { setOverrideDialogOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>New Override</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Student"
              select
              value={overrideForm.student_id}
              onChange={e => setOverrideForm(prev => ({ ...prev, student_id: e.target.value }))}
              fullWidth
            >
              {students.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {studentLabel(s)}
                  {' '}
                  (
                  {s.email}
                  )
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Rule"
              select
              value={overrideForm.rule_id}
              onChange={e => setOverrideForm(prev => ({ ...prev, rule_id: e.target.value }))}
              fullWidth
            >
              {rules.filter(r => r.is_active).map(r => (
                <MenuItem key={r.id} value={r.id}>
                  {r.target_course?.name}
                  {' '}
                  —
                  {r.condition}
                  {' '}
                  (
                  {r.sources?.length || 0}
                  {' '}
                  sources)
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Reason"
              value={overrideForm.reason}
              onChange={e => setOverrideForm(prev => ({ ...prev, reason: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
              error={overrideForm.reason.length > 0 && overrideForm.reason.length < 10}
              helperText={overrideForm.reason.length > 0 && overrideForm.reason.length < 10 ? 'At least 10 characters required' : `${overrideForm.reason.length}/10 min`}
            />
            <TextField
              label="Expires At (optional)"
              type="datetime-local"
              value={overrideForm.expires_at}
              onChange={e => setOverrideForm(prev => ({ ...prev, expires_at: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CancelIcon />} onClick={() => { setOverrideDialogOpen(false); }}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { void handleSaveOverride(); }}
            disabled={overrideForm.reason.length < 10 || !overrideForm.student_id || !overrideForm.rule_id}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => { setDeleteConfirmOpen(false); }}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this rule? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CancelIcon />} onClick={() => { setDeleteConfirmOpen(false); }}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
            onClick={() => { setDeleteConfirmOpen(false); void handleDeleteRule(deleteTargetId); }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
