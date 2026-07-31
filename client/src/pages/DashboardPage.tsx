import {
  AdminPanelSettings as AdminIcon,
  Assignment as AssignmentIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as DiplomaIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Science as ScienceIcon,
  Sync as SyncIcon,
  TrendingUp as TrendingUpIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
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

function EligibilityRing({ percentage }: { percentage: number }) {
  const dash = 2 * Math.PI * 36;
  const offset = dash - (dash * percentage) / 100;
  return (
    <Box sx={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={80} height={80} viewBox="0 0 80 80" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={40} cy={40} r={36} fill="none" stroke="#E0DDDA" strokeWidth={6} />
        <circle
          cx={40}
          cy={40}
          r={36}
          fill="none"
          stroke="url(#eligibilityGradient)"
          strokeWidth={6}
          strokeDasharray={dash}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="eligibilityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4B9CD3" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
        {percentage}
        %
      </Typography>
    </Box>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);

  const fetchStudentData = async () => {
    const token = localStorage.getItem('token') || '';

    const tokenPayload = token.split('.')[1];
    const claims = JSON.parse(atob(tokenPayload)) as { sub: string, role: string, email: string };
    const userId = claims.sub;

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

  const init = async () => {
    try {
      await fetchStudentData();
    }
    catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void init();
  }, []);

  const handleRegisterExam = async () => {
    setRegistering(true);
    setRegistrationMessage(null);
    const token = localStorage.getItem('token') || '';
    const userId = token ? (JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>).sub as string : '';
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

  const gridCols = isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr 1fr';

  const adminGridAreas = isMobile
    ? `"welcome"
       "students"
       "tracks"
       "certs"
       "eligibility"
       "actions"`
    : isTablet
      ? `"welcome welcome"
         "students tracks"
         "certs eligibility"
         "actions actions"`
      : `"welcome welcome students tracks"
         "welcome welcome certs eligibility"
         "actions actions actions actions"`;

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 3 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: gridCols, gap: 2 }}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
        <Button variant="outlined" onClick={() => { setLoadError(null); setLoading(true); void init(); }}>
          Retry
        </Button>
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
    const token = localStorage.getItem('token') || '';
    const role = token ? (JSON.parse(atob(token.split('.')[1]) || '{}') || {}).role || '' : '';
    const stats = adminStats;

    const eligibilityPct = stats
      ? Math.round((stats.eligible_count / Math.max(stats.eligible_count + stats.not_eligible_count, 1)) * 100)
      : 89;

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: gridCols, gridTemplateAreas: adminGridAreas, gap: 2.5, alignItems: 'start' }}>
        <Card sx={{
          'gridArea': 'welcome',
          'background': 'linear-gradient(135deg, #4B9CD3 0%, #3B82F6 100%)',
          'color': '#fff',
          '&:hover': { boxShadow: '0 12px 32px rgba(75, 156, 211, 0.3)' },
        }}
        >
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {`¡Buenos días, ${localStorage.getItem('userName') || t('dashboard.user_fallback')}!`}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                Universidad Nacional de Córdoba — Sistema de Seguimiento de Diplomaturas
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {role === 'admin'
                  ? 'Gestión de estudiantes, certificados y progreso de diplomaturas.'
                  : role === 'coordinador'
                    ? 'Revisión de elegibilidad, gestión de exámenes y configuración de reglas.'
                    : 'Acceso completo: cursos, tracks, reglas, integraciones y diagnósticos.'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Chip label={role === 'coordinador' ? 'Coordinador' : role === 'sysadmin' ? 'SysAdmin' : 'Administrador'} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
                <Chip label="UNC" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ gridArea: 'students' }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(75, 156, 211, 0.1)', display: 'flex' }}>
                <PeopleIcon sx={{ color: '#4B9CD3', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{stats?.total_students ?? '-'}</Typography>
                <Typography variant="body2" color="text.secondary">{t('admin.stats.total_students')}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ gridArea: 'tracks' }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(46, 125, 91, 0.1)', display: 'flex' }}>
                <SchoolIcon sx={{ color: '#2E7D5B', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{stats?.active_tracks ?? '-'}</Typography>
                <Typography variant="body2" color="text.secondary">{t('admin.stats.active_tracks')}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ gridArea: 'certs' }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(212, 168, 67, 0.1)', display: 'flex' }}>
                <DiplomaIcon sx={{ color: '#D4A843', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{stats?.total_certificates ?? '-'}</Typography>
                <Typography variant="body2" color="text.secondary">{t('admin.stats.certificates_issued')}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ gridArea: 'eligibility' }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                <EligibilityRing percentage={eligibilityPct} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{stats?.eligible_count ?? '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">{t('admin.stats.eligible')}</Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ gridArea: 'actions' }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>{t('dashboard.quick_actions')}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(role === 'admin' || role === 'coordinador') && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AssignmentIcon />}
                  onClick={() => setGradeModalOpen(true)}
                  data-testid="grade-exam-btn"
                >
                  {t('button.grade_student_exams')}
                </Button>
              )}
              {(role === 'admin' || role === 'coordinador') && (
                <Button
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  href="/app/admin"
                >
                  Enroll
                </Button>
              )}
              {(role === 'admin' || role === 'sysadmin') && (
                <Button
                  variant="outlined"
                  startIcon={<SyncIcon />}
                  href="/app/integrations"
                >
                  Sync
                </Button>
              )}
              {(role === 'admin' || role === 'coordinador') && (
                <Button
                  variant="outlined"
                  startIcon={<TuneIcon />}
                  href="/app/admin"
                >
                  Override
                </Button>
              )}
              {role !== 'sysadmin' && (
                <Button
                  variant="text"
                  startIcon={<AdminIcon />}
                  href="/app/admin"
                >
                  {t('nav.admin')}
                </Button>
              )}
              {role === 'sysadmin' && (
                <Button
                  variant="text"
                  startIcon={<CategoryIcon />}
                  href="/app/sysadmin"
                >
                  System Admin
                </Button>
              )}
              <Button
                variant="text"
                startIcon={<SchoolIcon />}
                href="/app/courses"
              >
                {t('nav.courses')}
              </Button>
            </Box>
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

  const isDemo = !localStorage.getItem('refreshToken');

  const studentGridAreas = isMobile
    ? `"banner"
       "welcome"
       "progress"
       "eligibility"
       "nextsteps"`
    : isTablet
      ? `"banner banner"
         "welcome progress"
         "eligibility nextsteps"`
      : `"banner banner banner banner"
         "welcome welcome progress progress"
         "eligibility eligibility nextsteps nextsteps"`;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: gridCols, gridTemplateAreas: studentGridAreas, gap: 2.5, alignItems: 'start' }}>
      {isDemo && (
        <Alert icon={<ScienceIcon />} severity="info" sx={{ gridArea: 'banner', mb: 0 }} data-testid="demo-banner">
          <Typography variant="body2">
            <strong>🔬 Demo Mode</strong>
            {' '}
            — exploring with mock data. Real login is available in the menu.
          </Typography>
        </Alert>
      )}

      <Card sx={{
        'gridArea': 'welcome',
        'background': 'linear-gradient(135deg, #4B9CD3 0%, #3B82F6 100%)',
        'color': '#fff',
        '&:hover': { boxShadow: '0 12px 32px rgba(75, 156, 211, 0.3)' },
      }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            {`¡Buenos días, ${localStorage.getItem('userName') || t('dashboard.user_fallback')}!`}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Universidad Nacional de Córdoba — Seguimiento de diplomaturas
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Chip label="Estudiante" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
            <Chip label="UNC" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ gridArea: 'progress' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>{t('dashboard.progress')}</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('dashboard.courses_completed')}
              :
              {progress?.courses_completed}
              {' '}
              /
              {progress?.courses_total}
            </Typography>
            <LinearProgress variant="determinate" value={progress?.progress_percentage || 0} sx={{ height: 10, borderRadius: 5 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {progress?.progress_percentage}
              %
              {t('status.completed').toLowerCase()}
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mt: 'auto' }}>
            <Box sx={{ textAlign: 'center' }}>
              <SchoolIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{progress?.credits_accumulated}</Typography>
              <Typography variant="caption" color="text.secondary">{t('dashboard.credits_accumulated')}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <TrendingUpIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{progress?.credits_required}</Typography>
              <Typography variant="caption" color="text.secondary">{t('dashboard.credits_required')}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircleIcon color="primary" sx={{ fontSize: 28 }} />
              <Chip label={t(`status.${progress?.status}`)} color={getStatusColor(progress?.status || '')} size="small" sx={{ mt: 0.5 }} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{t('dashboard.status')}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{
        gridArea: 'eligibility',
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

      <Card sx={{
        gridArea: 'nextsteps',
      }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>{t('dashboard.next_steps')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('dashboard.next_steps_description')}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
