import {
  Add as AddIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useCallback, useEffect, useState } from 'react';
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
  is_active: boolean
}

interface CourseManagementProps {
  onSnackbar?: (msg: string, severity: 'success' | 'error') => void
}

export function CourseManagement({ onSnackbar }: CourseManagementProps) {
  const token = localStorage.getItem('token') || '';
  const [courses, setCourses] = useState<Course[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [form, setForm] = useState({
    name: '',
    code: '',
    credits: 4,
    track_id: '',
    is_integrator_exam: false,
    is_active: true,
    order_index: 0,
  });

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    if (onSnackbar) {
      onSnackbar(message, severity);
    }
    else {
      setSnackbar({ open: true, message, severity });
    }
  }, [onSnackbar]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Course[]>('/admin/courses', token);
      setCourses(data);
    }
    catch {
      showSnackbar('Failed to load courses', 'error');
    }
    finally {
      setLoading(false);
    }
  }, [token, showSnackbar]);

  const fetchTracks = useCallback(async () => {
    try {
      const data = await api.get<Track[]>('/admin/tracks', token);
      setTracks(data);
    }
    catch {
      // tracks are optional for the dropdown
    }
  }, [token]);

  useEffect(() => {
    void fetchCourses();
    void fetchTracks();
  }, [fetchCourses, fetchTracks]);

  const handleSave = async () => {
    try {
      if (dialogMode === 'create') {
        await api.post('/courses', form, token);
        showSnackbar('Course created', 'success');
      }
      else if (editingCourse) {
        await fetch(`${API_BASE}/courses/${editingCourse.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(form),
        });
        showSnackbar('Course updated', 'success');
      }
      setDialogOpen(false);
      void fetchCourses();
    }
    catch {
      showSnackbar('Failed to save course', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showSnackbar('Course deleted', 'success');
        void fetchCourses();
      }
      else {
        const err = await res.json() as { error: string };
        showSnackbar(err.error || 'Failed to delete course', 'error');
      }
    }
    catch {
      showSnackbar('Failed to delete course', 'error');
    }
    setDeleteConfirmOpen(false);
    setDeleteTargetId('');
  };

  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingCourse(null);
    setForm({ name: '', code: '', credits: 4, track_id: '', is_integrator_exam: false, is_active: true, order_index: 0 });
    setDialogOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setDialogMode('edit');
    setEditingCourse(course);
    setForm({
      name: course.name,
      code: course.code,
      credits: course.credits,
      track_id: course.track?.id || '',
      is_integrator_exam: course.is_integrator_exam,
      is_active: course.is_active,
      order_index: course.order_index,
    });
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Courses (
              {courses.length}
              )
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreateDialog}>
                New Course
              </Button>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => { void fetchCourses(); }}>
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
                  <TableCell>Track</TableCell>
                  <TableCell>Credits</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map(c => (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      {c.name}
                      {c.is_integrator_exam && (
                        <Chip label="Integrator" color="secondary" size="small" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>{c.code}</TableCell>
                    <TableCell>{c.track?.name || '-'}</TableCell>
                    <TableCell>{c.credits}</TableCell>
                    <TableCell>{c.order_index}</TableCell>
                    <TableCell>
                      <Chip
                        label={c.is_active ? 'Active' : 'Inactive'}
                        color={c.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEditDialog(c)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => { setDeleteTargetId(c.id); setDeleteConfirmOpen(true); }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Typography variant="body2" color="text.secondary">Loading...</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'New Course' : 'Edit Course'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} fullWidth />
            <TextField label="Code" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} fullWidth />
            <TextField label="Credits" type="number" value={form.credits} onChange={e => setForm(p => ({ ...p, credits: Number(e.target.value) }))} fullWidth />
            <TextField label="Order Index" type="number" value={form.order_index} onChange={e => setForm(p => ({ ...p, order_index: Number(e.target.value) }))} fullWidth />
            <TextField label="Track" select value={form.track_id} onChange={e => setForm(p => ({ ...p, track_id: e.target.value }))} fullWidth>
              {tracks.filter(t => t.is_active).map(t => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                  {' '}
                  (
                  {t.code}
                  )
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Integrator Exam" select value={String(form.is_integrator_exam)} onChange={e => setForm(p => ({ ...p, is_integrator_exam: e.target.value === 'true' }))} fullWidth>
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </TextField>
            <TextField label="Active" select value={String(form.is_active)} onChange={e => setForm(p => ({ ...p, is_active: e.target.value === 'true' }))} fullWidth>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CancelIcon />} onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={dialogMode === 'create' ? <AddIcon /> : <EditIcon />} onClick={() => { void handleSave(); }}>
            {dialogMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Course</DialogTitle>
        <DialogContent>
          This action cannot be undone. Delete this course?
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CancelIcon />} onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => { void handleDelete(deleteTargetId); }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {!onSnackbar && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(p => ({ ...p, open: false }))}
          message={snackbar.message}
        />
      )}
    </>
  );
}
