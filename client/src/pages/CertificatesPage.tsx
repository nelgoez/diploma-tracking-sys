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

interface Certificate {
  id: string
  course_name: string
  student_name?: string
  student_email?: string
  issue_date: string
  status: 'approved' | 'pending' | 'rejected'
  qualification: number | null
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
        setCertificates([]);
      }
      else {
        setIsStaff(false);
        try {
          const data = await api.get<Certificate[]>(`/students/${userId}/certificates`, token);
          setCertificates(data);
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

  if (isStaff) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>{t('nav.certificates')}</Typography>
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                System Certificate Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As an administrator, you can view and manage all student certificates.
                Navigate to the Admin Panel or SysAdmin Panel to search for specific students and their certificates.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

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
                          <TableCell>{t('table.course')}</TableCell>
                          <TableCell>{t('table.date')}</TableCell>
                          <TableCell>{t('table.qualification')}</TableCell>
                          <TableCell>{t('table.status')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {certificates.map(cert => (
                          <TableRow key={cert.id}>
                            <TableCell>{cert.course_name}</TableCell>
                            <TableCell>{new Date(cert.issue_date).toLocaleDateString()}</TableCell>
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
