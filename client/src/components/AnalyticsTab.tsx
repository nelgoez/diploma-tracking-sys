import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { BarChart } from './charts/BarChart';
import { LineChart } from './charts/LineChart';
import { RingChart } from './charts/RingChart';

interface EnrollmentData {
  total_enrollments: number
  active_enrollments: number
  by_track: { track: string, count: number, eligible: number }[]
  by_status: Record<string, number>
  monthly_trend: { month: string, enrollments: number }[]
}

interface CertificateData {
  total_certificates: number
  by_course: { course: string, completed: number, avg_grade: number | null }[]
  by_track: { track: string, completed: number, total_students: number }[]
  monthly_issued: { month: string, count: number }[]
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="30%" />
      </CardContent>
    </Card>
  );
}

function SkeletonChart() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={200} />
      </CardContent>
    </Card>
  );
}

function formatMonth(month: string) {
  const d = new Date(`${month}-01`);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function AnalyticsTab() {
  const theme = useTheme();
  const token = localStorage.getItem('token') || '';
  const [enrollments, setEnrollments] = useState<EnrollmentData | null>(null);
  const [certificates, setCertificates] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchData = async (silent = false) => {
    if (!silent) { setLoading(true); }
    else { setRefreshing(true); }
    try {
      const [enr, cert] = await Promise.all([
        api.get<EnrollmentData>('/admin/analytics/enrollments', token),
        api.get<CertificateData>('/admin/analytics/certificates', token),
      ]);
      setEnrollments(enr);
      setCertificates(cert);
    }
    catch {
      // data stays stale on error
    }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
    intervalRef.current = setInterval(() => { void fetchData(true); }, 300000);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); } };
  }, []);

  const avgGrade = certificates
    ? Math.round(
      (certificates.by_course.reduce((s, c) => s + (c.avg_grade ?? 0), 0)
        / Math.max(certificates.by_course.filter(c => c.avg_grade !== null).length, 1)) * 10,
    ) / 10
    : null;

  const completionRate = enrollments
    ? Math.round((enrollments.active_enrollments / Math.max(enrollments.total_enrollments, 1)) * 100)
    : null;

  const mostPopular = certificates
    ? certificates.by_course[0]?.course ?? null
    : null;

  const summaryCards = [
    { label: 'Total Certificates', value: certificates?.total_certificates ?? null },
    { label: 'Avg Grade', value: avgGrade !== null ? `${avgGrade}` : null },
    { label: 'Completion Rate', value: completionRate !== null ? `${completionRate}%` : null },
    { label: 'Most Popular Course', value: mostPopular },
  ];

  const lineLabels = enrollments?.monthly_trend.map(m => formatMonth(m.month)) ?? [];
  const lineSeries = [
    {
      label: 'Enrollments',
      values: enrollments?.monthly_trend.map(m => m.enrollments) ?? [],
      color: theme.palette.primary.main,
    },
    {
      label: 'Certificates',
      values: certificates?.monthly_issued.map(m => m.count) ?? [],
      color: theme.palette.success.main,
    },
  ];

  const barItems = (certificates?.by_course ?? []).map(c => ({
    label: c.course,
    value: c.completed,
    secondary: c.avg_grade !== null ? `/ ${c.avg_grade}` : undefined,
  }));

  const ringSegments = (certificates?.by_track ?? []).map(t => ({
    label: t.track,
    value: t.completed,
    color: '',
  }));

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[0, 1, 2, 3].map(i => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <SkeletonCard />
          </Grid>
        ))}
        <Grid size={{ xs: 12, md: 8 }}><SkeletonChart /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><SkeletonChart /></Grid>
      </Grid>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => { void fetchData(true); }}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {summaryCards.map(card => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {card.label}
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  {card.value ?? '-'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <LineChart
                title="Enrollment & Certificate Trend (12 months)"
                labels={lineLabels}
                series={lineSeries}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <RingChart
                title="Certificates by Track"
                segments={ringSegments}
                centerLabel={`${certificates?.total_certificates ?? 0}\ntotal`}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <BarChart
                title="Certificates by Course"
                items={barItems}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
