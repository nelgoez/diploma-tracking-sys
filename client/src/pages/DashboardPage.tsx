import {
  CheckCircle as CheckCircleIcon,
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

export function DashboardPage() {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const userId = localStorage.getItem('userId') || '';

        const tokenPayload = token.split('.')[1];
        const claims = JSON.parse(atob(tokenPayload)) as { role: string, email: string };

        if (claims.role === 'admin' || claims.role === 'coordinador' || claims.role === 'sysadmin') {
          const stats = await api.get<{
            total_students: number
            active_students: number
            active_tracks: number
            total_certificates: number
            completion_rate: number
          }>('/admin/dashboard-stats', token);

          setProgress({
            student_id: userId,
            courses_completed: 0,
            courses_total: 0,
            credits_accumulated: 0,
            credits_required: 0,
            progress_percentage: 0,
            status: 'on_track',
          });

          setEligibility({
            is_eligible: false,
            eligibility_type: 'automatic',
            missing_prerequisites: [],
            reason: `Admin: ${stats.total_students} estudiantes, ${stats.active_tracks} tracks activos`,
          });
        }
        else {
          const [progressData, eligibilityResult] = await Promise.all([
            api.get<StudentProgress>(`/students/${userId}/progress`, token),
            api.get<EligibilityStatus>(`/enrollments/eligibility/${userId}`, token),
          ]);
          setProgress(progressData);
          setEligibility(eligibilityResult);
        }
      }
      catch (_err) {
        setProgress({
          student_id: userId || 'unknown',
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

    void fetchData();
  }, []);

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
      case 'completed':
        return 'success';
      case 'on_track':
        return 'primary';
      case 'at_risk':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('dashboard.welcome')}
        ,
        {localStorage.getItem('userName') || t('dashboard.user_fallback')}
      </Typography>

      <Grid container spacing={3}>
        {/* Progress Card */}
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
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.credits_accumulated')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h5">{progress?.credits_required}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.credits_required')}
                    </Typography>
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
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {t('dashboard.status')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Eligibility Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              bgcolor: eligibility?.is_eligible ? 'success.light' : 'error.light',
              color: eligibility?.is_eligible ? 'success.dark' : 'error.dark',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.exam_date')}
              </Typography>

              <Chip
                label={eligibility?.is_eligible ? t('dashboard.eligible') : t('dashboard.not_eligible')}
                color={eligibility?.is_eligible ? 'success' : 'error'}
                sx={{ mb: 2 }}
              />

              {eligibility?.is_eligible
                ? (
                    <Button variant="contained" color="success" fullWidth>
                      {t('dashboard.register_exam')}
                    </Button>
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

        {/* Next Steps Card */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.next_steps')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.next_steps_description')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
