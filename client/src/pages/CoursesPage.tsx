import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, NoCertificates } from '../components/illustrations';
import { api } from '../lib/api';

interface ApiCourse {
  id: string
  name: string
  code: string
  credits: number
  is_integrator_exam: boolean
  track: { id: string, name: string, code: string }
}

interface ApiCertificate {
  id: string
  course_name: string
  status: 'approved' | 'pending' | 'rejected'
  qualification: number | null
}

interface Course extends ApiCourse {
  status: 'completed' | 'in_progress' | 'pending'
}

export function CoursesPage() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      const userId = localStorage.getItem('userId') || '';
      const token = localStorage.getItem('token') || '';
      try {
        const [coursesData, certsData] = await Promise.all([
          api.get<ApiCourse[]>('/courses', token),
          api.get<ApiCertificate[]>(`/students/${userId}/certificates`, token),
        ]);
        const approvedCourseNames = new Set(
          certsData.filter(c => c.status === 'approved').map(c => c.course_name),
        );
        const coursesWithStatus: Course[] = coursesData.map(c => ({
          ...c,
          status: approvedCourseNames.has(c.name) ? 'completed' : 'pending',
        }));
        setCourses(coursesWithStatus);
      }
      finally {
        setLoading(false);
      }
    };

    void fetchCourses();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('nav.courses')}
      </Typography>

      <Card>
        <CardContent>
          {loading
            ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              )
            : courses.length === 0
              ? (
                  <EmptyState
                    illustration={<NoCertificates />}
                    title="No hay cursos disponibles"
                    description="Los cursos aparecerán aquí cuando se configuren en el sistema."
                  />
                )
              : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('table.course')}</TableCell>
                          <TableCell>{t('table.credits')}</TableCell>
                          <TableCell>{t('table.status')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {courses.map(course => (
                          <TableRow key={course.id}>
                            <TableCell>
                              <Typography fontWeight={course.is_integrator_exam ? 700 : 400}>
                                {course.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {course.code}
                                {course.track && ` — ${course.track.name}`}
                              </Typography>
                              {course.is_integrator_exam && (
                                <Chip label={t('course.integrator_exam')} color="secondary" size="small" sx={{ ml: 1 }} />
                              )}
                            </TableCell>
                            <TableCell>{course.credits}</TableCell>
                            <TableCell>
                              <Chip
                                label={t(`status.${course.status}`)}
                                color={getStatusColor(course.status || 'pending')}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
        </CardContent>
      </Card>
    </Box>
  );
}
