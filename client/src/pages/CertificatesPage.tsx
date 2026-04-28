import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface Certificate {
  id: string;
  course_name: string;
  issue_date: string;
  status: "approved" | "pending" | "rejected";
  qualification: number | null;
}

export function CertificatesPage() {
  const { t } = useTranslation();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await api.get("/certificates");
        
        // Placeholder data
        setCertificates([
          {
            id: "cert-1",
            course_name: "Introducción a la Programación",
            issue_date: "2024-03-15",
            status: "approved",
            qualification: 8,
          },
          {
            id: "cert-2",
            course_name: "Bases de Datos",
            issue_date: "2024-05-20",
            status: "approved",
            qualification: 7,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t("nav.certificates")}
      </Typography>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : certificates.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" p={3}>
              {t("no_results")}
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("table.course")}</TableCell>
                    <TableCell>{t("table.date")}</TableCell>
                    <TableCell>{t("table.qualification")}</TableCell>
                    <TableCell>{t("table.status")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>{cert.course_name}</TableCell>
                      <TableCell>{new Date(cert.issue_date).toLocaleDateString()}</TableCell>
                      <TableCell>{cert.qualification ?? "-"}</TableCell>
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