import {
  AdminPanelSettings as AdminIcon,
  Assignment as AssignmentIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as DiplomaIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
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
  LinearProgress,
  Skeleton,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GradeExamModal } from '../components/GradeExamModal';
import { api } from '../lib/api';

interface StudentProgress {
  student_id: string
  courses_completed: number
  courses_total: number
  credits_accumulated: number
  credits_required: number
  progress_percentage: number
  status: 'at_risk' | 'on_track' | 'completed'
}

interface EligibilityStatus {
  is_eligible: boolean
  eligibility_type: 'automatic' | 'manual'
  missing_prerequisites: string[]
  reason: string | null
}

interface AdminStats {
  total_students: number
  active_students: number
  active_tracks: number
  total_certificates: number
  completion_rate: number
  eligible_count: number
  not_eligible_count: number
  pending_enrollments: number
  recent_sync_errors: number
}

export function DashboardPage() {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);

  const fetchStudentData = async () => {
    const userId = localStorage.getItem('userId') || '';
    const token = localStorage.getItem('token') || '';

    const tokenPayload = token.split('.')[1];
    const claims = JSON.parse(atob(tokenPayload)) as { role: string, email: string };

    if (claims.role === 'admin' || claims.role === 'coordinador' || claims.role === 'sysadmin') {
      setIsStudent(false);
      try {
        const stats = await api.get<AdminStats>('/admin/dashboard-stats', token);
        setAdminStats(stats);
      }
      catch {
        setAdminStats(null);
      }
    }
    else {
      setIsStudent(true);
      const [progressData, eligibilityResult] = await Promise.all([
        api.get<StudentProgress>(`/students/${userId}/progress`, token),
        api.get<EligibilityStatus>(`/enrollments/eligibility/${userId}`, token),
      ]);
      setProgress(progressData);
      setEligibility(eligibilityResult);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await fetchStudentData();
      }
      catch {
        setProgress({
          student_id: localStorage.getItem('userId') || 'unknown',
          courses_completed: 2,
          courses_total: 5,
          credits_accumulated: 8,
          credits_required: 20,
          progress_percentage: 40,
          status: 'on_track',
        });
        setEligibility({
          is_eligible: false,
          eligibility_type: 'automatic',
          missing_prerequisites: ['course-3', 'course-4'],
          reason: 'Prerrequisitos no cumplidos',
        });
      }
      finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  const handleRegisterExam = async () => {
    setRegistering(true);
    setRegistrationMessage(null);
    const userId = localStorage.getItem('userId') || '';
    const token = localStorage.getItem('token') || '';
    try {
      await api.post('/enrollments', {
        student_id: userId,
        exam_date: new Date().toISOString(),
      }, token);
      setRegistrationMessage({ type: 'success', text: t('dashboard.exam_registered') });
      await fetchStudentData();
    }
    catch {
      setRegistrationMessage({ type: 'error', text: t('dashboard.exam_registration_error') });
    }
    finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rectangular" height={150} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rectangular" height={150} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'on_track': return 'primary';
      case 'at_risk': return 'warning';
      default: return 'default';
    }
  };

  if (!isStudent) {
    const role = JSON.parse(atob((localStorage.getItem('token') || '').split('.')[1] || '{}') || '{}').role || '';
    const stats = adminStats;
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          {`${t('dashboard.welcome')}, ${localStorage.getItem('userName') || t('dashboard.user_fallback')}`}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
                <PeopleIcon color="primary" />
                <Box>
                  <Typography variant="h5">{stats?.total_students ?? '-'}</Typography>
                  <Typography variant="caption" color="text.secondary">{t('admin.stats.total_students')}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
                <SchoolIcon color="success" />
                <Box>
                  <Typography variant="h5">{stats?.active_tracks ?? '-'}</Typography>
                  <Typography variant="caption" color="text.secondary">{t('admin.stats.active_tracks')}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
                <DiplomaIcon color="secondary" />
                <Box>
                  <Typography variant="h5">{stats?.total_certificates ?? '-'}</Typography>
                  <Typography variant="caption" color="text.secondary">{t('admin.stats.certificates_issued')}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
                <CheckCircleIcon color="success" />
                <Box>
                  <Typography variant="h5">{stats?.eligible_count ?? '-'}</Typography>
                  <Typography variant="caption" color="text.secondary">{t('admin.stats.eligible')}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>{t('dashboard.quick_actions')}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AssignmentIcon />}
                onClick={() => setGradeModalOpen(true)}
                data-testid="grade-exam-btn"
              >
                {t('button.grade_student_exams')}
              </Button>
              {role !== 'sysadmin' && (
                <Button
                  variant="outlined"
                  startIcon={<AdminIcon />}
                  href="/app/admin"
                >
                  {t('nav.admin')}
                </Button>
              )}
              {role === 'sysadmin' && (
                <Button
                  variant="outlined"
                  startIcon={<CategoryIcon />}
                  href="/app/sysadmin"
                >
                  System Admin
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<SchoolIcon />}
                href="/app/courses"
              >
                {t('nav.courses')}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              {role === 'admin' ? 'Administrator Dashboard' : role === 'coordinador' ? 'Coordinador Dashboard' : 'System Dashboard'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {role === 'admin'
                ? 'Manage students, view certificates, and monitor diploma progress from the '
                + 'Administration panel. Track eligibility status and handle enrollments.'
                : role === 'coordinador'
                  ? 'Review student eligibility, manage exam registrations, and configure prerequisite rules.'
                  : 'Full system access: manage courses, tracks, rules, overrides, integrations, and diagnostics.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {role === 'admin' || role === 'sysadmin'
                ? 'Use the Administration panel for detailed student management, tracks, and courses.'
                : 'Check the coordinator dashboard for exam registration and student management.'}
            </Typography>
          </CardContent>
        </Card>

        <GradeExamModal
          open={gradeModalOpen}
          onClose={() => setGradeModalOpen(false)}
          onGraded={() => {
            setGradeModalOpen(false);
            void fetchStudentData();
          }}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {`${t('dashboard.welcome')}, ${localStorage.getItem('userName') || t('dashboard.user_fallback')}`}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.progress')}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('dashboard.courses_completed')}
                  :
                  {progress?.courses_completed}
                  {' '}
                  /
                  {progress?.courses_total}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress?.progress_percentage || 0}
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {progress?.progress_percentage}
                  %
                  {t('status.completed').toLowerCase()}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <SchoolIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h5">{progress?.credits_accumulated}</Typography>
                    <Typography variant="body2" color="text.secondary">{t('dashboard.credits_accumulated')}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h5">{progress?.credits_required}</Typography>
                    <Typography variant="body2" color="text.secondary">{t('dashboard.credits_required')}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CheckCircleIcon color="primary" sx={{ fontSize: 40 }} />
                    <Chip
                      label={t(`status.${progress?.status}`)}
                      color={getStatusColor(progress?.status || '')}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('dashboard.status')}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              bgcolor: eligibility?.is_eligible ? 'success.light' : 'error.light',
              color: eligibility?.is_eligible ? 'success.dark' : 'error.dark',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('dashboard.exam_date')}</Typography>
              <Chip
                label={eligibility?.is_eligible ? t('dashboard.eligible') : t('dashboard.not_eligible')}
                color={eligibility?.is_eligible ? 'success' : 'error'}
                sx={{ mb: 2 }}
              />
              {eligibility?.is_eligible
                ? (
                    <Box>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        onClick={() => { void handleRegisterExam(); }}
                        disabled={registering}
                        data-testid="exam-register-btn"
                      >
                        {registering ? <CircularProgress size={20} color="inherit" /> : t('dashboard.register_exam')}
                      </Button>
                      {registrationMessage && (
                        <Alert severity={registrationMessage.type} sx={{ mt: 1 }}>{registrationMessage.text}</Alert>
                      )}
                    </Box>
                  )
                : (
                    <Alert severity="warning">
                      {t('dashboard.missing_prerequisites')}
                      :
                      {eligibility?.missing_prerequisites.length}
                      {' '}
                      {t('dashboard.courses')}
                    </Alert>
                  )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('dashboard.next_steps')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('dashboard.next_steps_description')}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
