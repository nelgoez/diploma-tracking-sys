import { People as PeopleIcon, School as SchoolIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import { useCallback, useEffect, useState } from 'react';
import { GradeExamModal } from '../components/GradeExamModal';
import { EmptyState, NoEnrollments } from '../components/illustrations';
import { PageHeader } from '../components/PageHeader';
import { api } from '../lib/api';

interface TrackSummary {
  track_id: string
  track_name: string
  track_code: string
  total_enrolled: number
  eligible: number
  not_eligible: number
  pending_grades: number
}

interface StudentRow {
  enrollment_id: string
  student_id: string
  name: string
  email: string
  dni: string
  exam_status: string | null
  exam_date: string | null
  qualification: number | null
  eligible: boolean | null
}

export function CoordinatorPage() {
  const token = localStorage.getItem('token') || '';

  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<TrackSummary | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState('');
  const [eligibility, setEligibility] = useState('all');
  const [examStatus, setExamStatus] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [snackbar, setSnackbar] = useState<{ msg: string, severity: 'success' | 'error' } | null>(null);
  const [individualGrade, setIndividualGrade] = useState<{ open: boolean, enrollmentId?: string, studentName?: string }>({ open: false });

  const fetchTracks = useCallback(async () => {
    try {
      const data = await api.get<{ tracks: TrackSummary[] }>('/coordinator/dashboard', token);
      setTracks(data.tracks || []);
    }
    catch (err) {
      console.error('Failed to fetch coordinator tracks:', err);
    }
  }, [token]);

  const fetchStudents = useCallback(async (trackId: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ track_id: trackId, limit: '100' });
      if (search) { params.set('search', search); }
      if (eligibility !== 'all') { params.set('eligibility', eligibility); }
      if (examStatus !== 'all') { params.set('exam_status', examStatus); }
      if (fromDate) { params.set('from_date', fromDate); }
      if (toDate) { params.set('to_date', toDate); }
      const data = await api.get<{ data: StudentRow[] }>(`/coordinator/students?${params.toString()}`, token);
      setStudents(data.data || []);
    }
    catch (err) {
      console.error('Failed to fetch students:', err);
    }
    finally {
      setLoading(false);
    }
  }, [token, search, eligibility, examStatus, fromDate, toDate]);

  useEffect(() => {
    void fetchTracks();
  }, [fetchTracks]);

  useEffect(() => {
    if (selectedTrack) {
      void fetchStudents(selectedTrack.track_id);
    }
  }, [selectedTrack, fetchStudents]);

  const handleTrackSelect = (track: TrackSummary) => {
    setSelectedTrack(track);
    setSelectedIds(new Set());
    setGrades({});
    setSearch('');
    setEligibility('all');
    setExamStatus('all');
    setFromDate('');
    setToDate('');
  };

  const handleSelectAll = (checked: boolean) => {
    const inscripto = students.filter(s => s.exam_status === 'inscripto');
    if (checked) {
      setSelectedIds(new Set(inscripto.map(s => s.student_id)));
    }
    else {
      setSelectedIds(new Set());
    }
  };

  const handleToggle = (studentId: string) => {
    const next = new Set(selectedIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    }
    else {
      next.add(studentId);
    }
    setSelectedIds(next);
  };

  const openGradeDialog = () => {
    const initial: Record<string, number> = {};
    selectedIds.forEach((id) => { initial[id] = 7; });
    setGrades(initial);
    setExamDate(new Date().toISOString().split('T')[0]);
    setGradeDialogOpen(true);
  };

  const handleBulkGrade = async () => {
    const gradeEntries = students
      .filter(s => selectedIds.has(s.student_id))
      .map(s => ({
        enrollment_id: s.enrollment_id,
        grade: grades[s.student_id] ?? 7,
      }));

    try {
      const result = await api.post<{ summary: { succeeded: number, failed: number }, results: Array<{ enrollment_id: string, success: boolean, error?: string }> }>(
        '/coordinator/bulk-grade',
        { exam_date: examDate, grades: gradeEntries },
        token,
      );

      setSnackbar({
        msg: `Graded: ${result.summary.succeeded} succeeded, ${result.summary.failed} failed`,
        severity: result.summary.failed > 0 ? 'error' : 'success',
      });

      setGradeDialogOpen(false);
      setSelectedIds(new Set());
      if (selectedTrack) {
        void fetchStudents(selectedTrack.track_id);
      }
    }
    catch (err) {
      console.error('Bulk grade failed:', err);
      setSnackbar({ msg: 'Bulk grade failed', severity: 'error' });
    }
  };

  const inscriptoCount = students.filter(s => s.exam_status === 'inscripto').length;

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Coordinación"
        description="Gestión de tracks, estudiantes, exámenes y calificaciones"
      />

      {!selectedTrack && (
        <Grid container spacing={3}>
          {tracks.map(track => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={track.track_id}>
              <Card variant="outlined">
                <CardActionArea onClick={() => handleTrackSelect(track)}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {track.track_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {track.track_code}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip icon={<PeopleIcon />} label={`${track.total_enrolled} inscriptos`} size="small" />
                      <Chip icon={<SchoolIcon />} label={`${track.eligible} habilitados`} size="small" color="success" />
                      <Chip label={`${track.not_eligible} no habilitados`} size="small" color="warning" />
                      {track.pending_grades > 0 && (
                        <Chip label={`${track.pending_grades} pendientes`} size="small" color="error" />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
          {tracks.length === 0 && (
            <Grid size={12}>
              <Typography color="text.secondary">No tracks assigned.</Typography>
            </Grid>
          )}
        </Grid>
      )}

      {selectedTrack && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button variant="outlined" onClick={() => setSelectedTrack(null)}>
              ← Volver
            </Button>
            <Typography variant="h5">{selectedTrack.track_name}</Typography>
            <Chip label={`${selectedTrack.eligible} habilitados`} color="success" size="small" />
            <Chip label={`${selectedTrack.not_eligible} no habilitados`} color="warning" size="small" />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Buscar"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Habilitación</InputLabel>
              <Select
                value={eligibility}
                label="Habilitación"
                onChange={e => setEligibility(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="true">Habilitados</MenuItem>
                <MenuItem value="false">No habilitados</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Estado examen</InputLabel>
              <Select
                value={examStatus}
                label="Estado examen"
                onChange={e => setExamStatus(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="inscripto">Inscripto</MenuItem>
                <MenuItem value="aprobado">Aprobado</MenuItem>
                <MenuItem value="desaprobado">Desaprobado</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="date"
              label="Desde"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 140 }}
            />
            <TextField
              size="small"
              type="date"
              label="Hasta"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 140 }}
            />
            {inscriptoCount > 0 && (
              <Button
                variant="contained"
                color="primary"
                disabled={selectedIds.size === 0}
                onClick={openGradeDialog}
              >
                Calificar seleccionados (
                {selectedIds.size}
                )
              </Button>
            )}
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedIds.size > 0 && selectedIds.size < inscriptoCount}
                      checked={inscriptoCount > 0 && selectedIds.size === inscriptoCount}
                      onChange={(_, checked) => handleSelectAll(checked)}
                    />
                  </TableCell>
                  <TableCell>Estudiante</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>DNI</TableCell>
                  <TableCell>Estado examen</TableCell>
                  <TableCell>Nota</TableCell>
                  <TableCell>Habilitado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.student_id}>
                    <TableCell padding="checkbox">
                      {s.exam_status === 'inscripto' && (
                        <Checkbox
                          checked={selectedIds.has(s.student_id)}
                          onChange={() => handleToggle(s.student_id)}
                        />
                      )}
                    </TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.dni}</TableCell>
                    <TableCell>{s.exam_status || '-'}</TableCell>
                    <TableCell>{s.qualification ?? '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={s.eligible ? 'Sí' : 'No'}
                        color={s.eligible ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {s.exam_status === 'inscripto' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setIndividualGrade({ open: true, enrollmentId: s.enrollment_id, studentName: s.name })}
                        >
                          Calificar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {students.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ border: 'none', p: 0 }}>
                      <EmptyState
                        illustration={<NoEnrollments />}
                        title="No estás inscripto"
                        description="No hay estudiantes inscriptos en esta track."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <GradeExamModal
        open={individualGrade.open}
        enrollmentId={individualGrade.enrollmentId}
        studentName={individualGrade.studentName}
        onClose={() => setIndividualGrade({ open: false })}
        onGraded={() => {
          setIndividualGrade({ open: false });
          if (selectedTrack) { void fetchStudents(selectedTrack.track_id); }
        }}
      />

      <Dialog open={gradeDialogOpen} onClose={() => setGradeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Calificación masiva</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Fecha de examen"
            type="date"
            value={examDate}
            onChange={e => setExamDate(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <Typography variant="subtitle2" gutterBottom>
            {selectedIds.size}
            {' '}
            estudiantes seleccionados
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Estudiante</TableCell>
                <TableCell>Nota</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...selectedIds].map((id) => {
                const student = students.find(s => s.student_id === id);
                return (
                  <TableRow key={id}>
                    <TableCell>{student?.name || id}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={grades[id] ?? ''}
                        onChange={e => setGrades(prev => ({ ...prev, [id]: Number(e.target.value) }))}
                        inputProps={{ min: 1, max: 10 }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradeDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void handleBulkGrade()}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? <Alert severity={snackbar.severity}>{snackbar.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
