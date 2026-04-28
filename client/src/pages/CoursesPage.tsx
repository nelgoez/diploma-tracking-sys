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

interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  is_integrator_exam: boolean;
  status?: "completed" | "in_progress" | "pending";
}

export function CoursesPage() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await api.get("/courses");
        
        // Placeholder data
        setCourses([
          { id: "c1", name: "Introducción a la Programación", code: "PROG101", credits: 4, is_integrator_exam: false, status: "completed" },
          { id: "c2", name: "Bases de Datos", code: "DATA201", credits: 4, is_integrator_exam: false, status: "completed" },
          { id: "c3", name: "Desarrollo Web", code: "WEB301", credits: 4, is_integrator_exam: false, status: "in_progress" },
          { id: "c4", name: "Arquitectura de Software", code: "ARCH401", credits: 4, is_integrator_exam: false, status: "pending" },
          { id: "c5", name: "Examen Integrador", code: "INT500", credits: 4, is_integrator_exam: true, status: "pending" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "primary";
      case "pending":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t("nav.courses")}
      </Typography>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : courses.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" p={3}>
              {t("no_results")}
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("table.course")}</TableCell>
                    <TableCell>{t("table.credits")}</TableCell>
                    <TableCell>{t("table.status")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <Typography fontWeight={course.is_integrator_exam ? 700 : 400}>
                          {course.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {course.code}
                        </Typography>
                        {course.is_integrator_exam && (
                          <Chip label="Integrador" color="secondary" size="small" sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                      <TableCell>{course.credits}</TableCell>
                      <TableCell>
                        <Chip
                          label={t(`status.${course.status}`)}
                          color={getStatusColor(course.status || "pending")}
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