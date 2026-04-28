import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await api.post("/auth/login", { email, password });
      
      // Placeholder login - always succeeds
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      localStorage.setItem("token", "placeholder-token");
      localStorage.setItem("userId", "user-123");
      localStorage.setItem("userRole", "estudiante");
      localStorage.setItem("userName", "Usuario Prueba");
      
      navigate("/dashboard");
    } catch {
      setError(t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%", mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom textAlign="center">
            {t("app.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            {t("app.subtitle")}
          </Typography>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label={t("login.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label={t("login.password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : t("login.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}