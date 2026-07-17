import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { api } from '../lib/api';

interface EnrollmentOption {
  id: string
  student_name: string
  course_name: string
  track_name: string
  exam_date: string
}

interface GradeExamModalProps {
  open: boolean
  onClose: () => void
  enrollmentId?: string
  studentName?: string
  onGraded: () => void
}

export function GradeExamModal({ open, onClose, enrollmentId, studentName, onGraded }: GradeExamModalProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentOption[]>([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentOption | null>(null);
  const [qualification, setQualification] = useState<string>('');
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [qualificationError, setQualificationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedEnrollment(null);
      setQualification('');
      setObservations('');
      setError(null);
      setSuccess(false);
      setQualificationError(null);
      return;
    }

    if (enrollmentId) {
      setFetching(false);
      return;
    }

    const fetchEnrollments = async () => {
      setFetching(true);
      setError(null);
      const token = localStorage.getItem('token') || '';
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1])) as { role: string };
        const isAdmin = ['admin', 'sysadmin', 'coordinador'].includes(tokenPayload.role);

        if (!isAdmin) {
          setError(t('grade_exam.unauthorized'));
          return;
        }

        const data = await api.get<EnrollmentOption[]>('/enrollments?exam_history=true', token);
        const inscripto = data.filter((e: any) => e.exam_status === 'inscripto');
        setEnrollments(inscripto);
      }
      catch {
        setError(t('grade_exam.load_error'));
      }
      finally {
        setFetching(false);
      }
    };

    void fetchEnrollments();
  }, [open, enrollmentId]);

  const validateQualification = (value: string): boolean => {
    const num = Number(value);
    if (!value.trim()) {
      setQualificationError(t('grade_exam.error_required'));
      return false;
    }
    if (!Number.isInteger(num)) {
      setQualificationError(t('grade_exam.error_integer'));
      return false;
    }
    if (num < 1 || num > 10) {
      setQualificationError(t('grade_exam.error_range'));
      return false;
    }
    setQualificationError(null);
    return true;
  };

  const handleGrade = async () => {
    if (!validateQualification(qualification)) { return; }

    const token = localStorage.getItem('token') || '';
    const targetId = enrollmentId || selectedEnrollment?.id;

    if (!targetId) {
      setError(t('grade_exam.no_enrollment_selected'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const body: Record<string, unknown> = { qualification: Number(qualification) };
      if (observations.trim()) {
        body.observations = observations.trim();
      }

      await api.put(`/enrollments/${targetId}/grade`, body, token);
      setSuccess(true);
      onGraded();
    }
    catch (err) {
      setError(err instanceof Error ? err.message : t('grade_exam.record_grade_error'));
    }
    finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (success) {
      onGraded();
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {enrollmentId && studentName
          ? `${t('grade_exam.dialog_title')} — ${studentName}`
          : t('grade_exam.dialog_title')}
      </DialogTitle>
      <DialogContent>
        {fetching && (
          <Box sx={{ py: 3 }}>
            <Typography color="text.secondary">{t('grade_exam.loading')}</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('grade_exam.success')}
            {Number(qualification) >= 4 ? t('grade_exam.approved') : t('grade_exam.not_approved')}
          </Alert>
        )}

        {!enrollmentId && !fetching && (
          <Autocomplete
            options={enrollments}
            getOptionLabel={opt =>
              `${opt.student_name} — ${opt.course_name || opt.track_name} (${opt.exam_date})`}
            value={selectedEnrollment}
            onChange={(_, newValue) => {
              setSelectedEnrollment(newValue);
              setError(null);
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={params => (
              <TextField
                {...params}
                label={t('grade_exam.select_enrollment')}
                margin="normal"
                fullWidth
                helperText={t('grade_exam.helper_text')}
              />
            )}
            noOptionsText={t('grade_exam.no_inscripto')}
          />
        )}

        <TextField
          label={t('grade_exam.qualification_label')}
          type="number"
          fullWidth
          margin="normal"
          value={qualification}
          onChange={(e) => {
            setQualification(e.target.value);
            setQualificationError(null);
          }}
          onBlur={() => {
            if (qualification) { validateQualification(qualification); }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { void handleGrade(); }
          }}
          error={!!qualificationError}
          helperText={qualificationError || t('grade_exam.enter_integer')}
          inputProps={{ min: 1, max: 10, step: 1 }}
          slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' } }}
          disabled={loading || success}
        />

        <TextField
          label={t('grade_exam.observations')}
          fullWidth
          multiline
          rows={2}
          margin="normal"
          value={observations}
          onChange={e => setObservations(e.target.value)}
          disabled={loading || success}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {success ? t('grade_exam.close') : t('button.cancel')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => void handleGrade()}
          disabled={!!success || (!enrollmentId && !selectedEnrollment) || !!fetching || loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
        >
          {success ? t('grade_exam.done') : loading ? t('grade_exam.submitting') : t('grade_exam.submit_grade')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
