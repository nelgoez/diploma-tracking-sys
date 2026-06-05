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
import { api } from '../lib/api';

interface CertificateResponse {
  id: string
  student_id: string
  course_id: string
  issue_date: string
  status: 'approved' | 'pending' | 'rejected'
  qualification: number | null
  is_valid: boolean
  student?: { id: string, name: string, email: string }
  course?: { id: string, name: string, code: string, credits: number }
}

interface Certificate {
  id: string
  courseName: string
  studentName?: string
  studentEmail?: string
  issueDate: string
  status: 'approved' | 'pending' | 'rejected'
  qualification: number | null
}

function mapResponse(certs: CertificateResponse[]): Certificate[] {
  return certs.map(c => ({
    id: c.id,
    courseName: c.course?.name ?? c.id,
    studentName: c.student?.name,
    studentEmail: c.student?.email,
    issueDate: c.issue_date,
    status: c.status,
    qualification: c.qualification,
  }));
}

export function CertificatesPage() {
  const { t } = useTranslation();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const fetchCertificates = async () => {
      const userId = localStorage.getItem('userId') || '';
      const token = localStorage.getItem('token') || '';

      const tokenPayload = token.split('.')[1];
      const claims = JSON.parse(atob(tokenPayload)) as { role: string };

      if (claims.role === 'admin' || claims.role === 'coordinador' || claims.role === 'sysadmin') {
        setIsStaff(true);
        try {
          const data = await api.get<CertificateResponse[]>('/certificates', token);
          setCertificates(mapResponse(data));
        }
        catch {
          setCertificates([]);
        }
      }
      else {
        setIsStaff(false);
        try {
          const data = await api.get<CertificateResponse[]>(`/students/${userId}/certificates`, token);
          setCertificates(mapResponse(data));
        }
        catch {
          setCertificates([]);
        }
      }
      setLoading(false);
    };

    void fetchCertificates();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('nav.certificates')}
      </Typography>

      <Card>
        <CardContent>
          {loading
            ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              )
            : certificates.length === 0
              ? (
                  <Typography color="text.secondary" textAlign="center" p={3}>
                    {t('no_results')}
                  </Typography>
                )
              : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {isStaff && <TableCell>Student</TableCell>}
                          <TableCell>{t('table.course')}</TableCell>
                          <TableCell>{t('table.date')}</TableCell>
                          <TableCell>{t('table.qualification')}</TableCell>
                          <TableCell>{t('table.status')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {certificates.map(cert => (
                          <TableRow key={cert.id}>
                            {isStaff && (
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {cert.studentName || cert.studentEmail || '-'}
                                </Typography>
                                {cert.studentEmail && cert.studentName && (
                                  <Typography variant="caption" color="text.secondary">
                                    {cert.studentEmail}
                                  </Typography>
                                )}
                              </TableCell>
                            )}
                            <TableCell>{cert.courseName}</TableCell>
                            <TableCell>{new Date(cert.issueDate).toLocaleDateString()}</TableCell>
                            <TableCell>{cert.qualification ?? '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={t(`status.${cert.status}`)}
                                color={getStatusColor(cert.status)}
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
