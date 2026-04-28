import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
} from "@mui/material";
import {
  People as PeopleIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as DiplomaIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

interface DashboardStats {
  total_students: number;
  active_students: number;
  completion_rate: number;
  pending_enrollments: number;
  certificates_issued: number;
}

export function AdminPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await api.get("/admin/dashboard-stats");
        
        // Placeholder data
        setStats({
          total_students: 45,
          active_students: 38,
          completion_rate: 67,
          pending_enrollments: 5,
          certificates_issued: 89,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: "admin.stats.total_students", value: stats?.total_students, icon: PeopleIcon, color: "primary" },
    { label: "admin.stats.active_students", value: stats?.active_students, icon: SchoolIcon, color: "success" },
    { label: "admin.stats.completion_rate", value: `${stats?.completion_rate}%`, icon: TrendingUpIcon, color: "info" },
    { label: "admin.stats.pending_enrollments", value: stats?.pending_enrollments, icon: AssignmentIcon, color: "warning" },
    { label: "admin.stats.certificates_issued", value: stats?.certificates_issued, icon: DiplomaIcon, color: "secondary" },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t("nav.admin")}
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={stat.label}>
                <Card>
                  <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Icon color={stat.color as "primary" | "success" | "info" | "warning" | "error" | "inherit" | "disabled" | "action"} sx={{ fontSize: 48 }} />
                    <Box>
                      <Typography variant="h4">{stat.value ?? 0}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t(stat.label)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}