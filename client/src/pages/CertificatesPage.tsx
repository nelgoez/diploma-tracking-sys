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
  issue_date: string
  status: 'approved' | 'pending' | 'rejected'
  qualification: number | null
}

export function CertificatesPage() {
  const { t } = useTranslation();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      const userId = localStorage.getItem('userId') || '';
      const token = localStorage.getItem('token') || '';
      try {
        const data = await api.get<Certificate[]>(`/students/${userId}/certificates`, token);
        setCertificates(data);
      }
      finally {
        setLoading(false);
      }
    };

    void fetchCertificates();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
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
