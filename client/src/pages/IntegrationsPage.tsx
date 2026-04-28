import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  CloudSync as SyncIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

interface IntegrationStatus {
  moodle: {
    status: "ok" | "warning" | "error";
    last_sync: string | null;
    records_synced: number;
    errors: number;
  };
  guarani: {
    status: "ok" | "warning" | "error";
    last_sync: string | null;
    records_synced: number;
    errors: number;
  };
}

export function IntegrationsPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<{ moodle: boolean; guarani: boolean }>({ moodle: false, guarani: false });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await api.get("/integrations/status");
        
        // Placeholder data
        setStatus({
          moodle: {
            status: "ok",
            last_sync: new Date().toISOString(),
            records_synced: 120,
            errors: 0,
          },
          guarani: {
            status: "warning",
            last_sync: new Date(Date.now() - 3600000).toISOString(),
            records_synced: 45,
            errors: 1,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleSync = async (integration: "moodle" | "guarani") => {
    setSyncing((prev) => ({ ...prev, [integration]: true }));
    try {
      // TODO: Replace with actual API call
      // await api.post(`/integrations/sync/${integration}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Refresh status after sync
      window.location.reload();
    } finally {
      setSyncing((prev) => ({ ...prev, [integration]: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckIcon color="success" />;
      case "warning":
        return <WarningIcon color="warning" />;
      case "error":
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t("nav.integrations")}
      </Typography>

      <Grid container spacing={3}>
        {/* Moodle Integration */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6">{t("integration.moodle")}</Typography>
                  <Chip
                    label={t(`integration.status.${status?.moodle.status}`)}
                    color={getStatusColor(status?.moodle.status || "")}
                    size="small"
                    icon={getStatusIcon(status?.moodle.status || "")}
                  />
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<SyncIcon />}
                  onClick={() => handleSync("moodle")}
                  disabled={syncing.moodle}
                >
                  {syncing.moodle ? <CircularProgress size={20} /> : t("button.sync")}
                </Button>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("integration.last_sync")}:{" "}
                  {status?.moodle.last_sync
                    ? new Date(status.moodle.last_sync).toLocaleString()
                    : "Nunca"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t("integration.records_synced")}: {status?.moodle.records_synced}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Guaraní Integration */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6">{t("integration.guarani")}</Typography>
                  <Chip
                    label={t(`integration.status.${status?.guarani.status}`)}
                    color={getStatusColor(status?.guarani.status || "")}
                    size="small"
                    icon={getStatusIcon(status?.guarani.status || "")}
                  />
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<SyncIcon />}
                  onClick={() => handleSync("guarani")}
                  disabled={syncing.guarani}
                >
                  {syncing.guarani ? <CircularProgress size={20} /> : t("button.sync")}
                </Button>
              </Box>

              {status?.guarani.status !== "ok" && (
                <Alert severity={status?.guarani.status === "error" ? "error" : "warning"} sx={{ mb: 2 }}>
                  {status?.guarani.errors} errores en la última sincronización
                </Alert>
              )}

              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("integration.last_sync")}:{" "}
                  {status?.guarani.last_sync
                    ? new Date(status.guarani.last_sync).toLocaleString()
                    : "Nunca"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t("integration.records_synced")}: {status?.guarani.records_synced}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}