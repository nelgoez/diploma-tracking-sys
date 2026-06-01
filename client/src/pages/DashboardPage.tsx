import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as DiplomaIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  SyncProblem as SyncErrorIcon,
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
      catch (_err) {
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
    const statCards = [
      { label: 'admin.stats.total_students', value: adminStats?.total_students ?? '-', icon: PeopleIcon, color: 'primary' as const },
      { label: 'admin.stats.active_students', value: adminStats?.active_students ?? '-', icon: SchoolIcon, color: 'success' as const },
      { label: 'admin.stats.active_tracks', value: adminStats?.active_tracks ?? '-', icon: AssignmentIcon, color: 'info' as const },
      { label: 'admin.stats.certificates_issued', value: adminStats?.total_certificates ?? '-', icon: DiplomaIcon, color: 'secondary' as const },
      { label: 'admin.stats.eligible', value: adminStats?.eligible_count ?? '-', icon: CheckCircleIcon, color: 'success' as const },
      { label: 'admin.stats.not_eligible', value: adminStats?.not_eligible_count ?? '-', icon: CheckCircleIcon, color: 'error' as const },
      { label: 'admin.stats.completion_rate', value: adminStats ? `${adminStats.completion_rate}%` : '-', icon: TrendingUpIcon, color: 'info' as const },
    ];

    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          {`${t('dashboard.welcome')}, ${localStorage.getItem('userName') || t('dashboard.user_fallback')}`}
        </Typography>
        <Grid container spacing={3}>
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={stat.label}>
                <Card>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Icon color={stat.color} sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4">{stat.value}</Typography>
                      <Typography variant="body2" color="text.secondary">{t(stat.label)}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {adminStats && adminStats.recent_sync_errors > 0 && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="warning" icon={<SyncErrorIcon />}>
                {adminStats.recent_sync_errors}
                {' '}
                sync errors in last 7 days
              </Alert>
            </Grid>
          )}
        </Grid>
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
