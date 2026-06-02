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
  Card,
  CardContent,
  Grid,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface AdminStatsGridProps {
  stats: {
    total_students: number | null
    active_students: number | null
    active_tracks: number | null
    total_certificates: number | null
    eligible_count: number | null
    not_eligible_count: number | null
    completion_rate: number | null
    pending_enrollments: number | null
    recent_sync_errors: number | null
  } | null
  showSyncAlert?: boolean
}

export function AdminStatsGrid({ stats, showSyncAlert }: AdminStatsGridProps) {
  const { t } = useTranslation();

  const statCards = [
    { label: 'admin.stats.total_students', value: stats?.total_students ?? 0, icon: PeopleIcon, color: 'primary' as const },
    { label: 'admin.stats.active_students', value: stats?.active_students ?? 0, icon: SchoolIcon, color: 'success' as const },
    { label: 'admin.stats.active_tracks', value: stats?.active_tracks ?? 0, icon: AssignmentIcon, color: 'info' as const },
    { label: 'admin.stats.certificates_issued', value: stats?.total_certificates ?? 0, icon: DiplomaIcon, color: 'secondary' as const },
    { label: 'admin.stats.completion_rate', value: `${stats?.completion_rate ?? 0}%`, icon: TrendingUpIcon, color: 'info' as const },
    { label: 'admin.stats.eligible', value: stats?.eligible_count ?? 0, icon: CheckCircleIcon, color: 'success' as const },
    { label: 'admin.stats.not_eligible', value: stats?.not_eligible_count ?? 0, icon: CheckCircleIcon, color: 'error' as const },
    { label: 'admin.stats.pending_enrollments', value: stats?.pending_enrollments ?? 0, icon: AssignmentIcon, color: 'warning' as const },
  ];

  return (
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
      {showSyncAlert && stats && stats.recent_sync_errors !== null && stats.recent_sync_errors > 0 && (
        <Grid size={{ xs: 12 }}>
          <Alert severity="warning" icon={<SyncErrorIcon />}>
            {stats.recent_sync_errors}
            {' '}
            {t('admin.stats.sync_errors_7d')}
          </Alert>
        </Grid>
      )}
    </Grid>
  );
}
