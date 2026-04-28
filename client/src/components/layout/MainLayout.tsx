import { Outlet } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  School as CertificatesIcon,
  MenuBook as CoursesIcon,
  Link as IntegrationsIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const drawerWidth = 240;

const navItems = [
  { path: "/dashboard", labelKey: "nav.dashboard", icon: DashboardIcon },
  { path: "/certificates", labelKey: "nav.certificates", icon: CertificatesIcon },
  { path: "/courses", labelKey: "nav.courses", icon: CoursesIcon },
  { path: "/integrations", labelKey: "nav.integrations", icon: IntegrationsIcon },
  { path: "/admin", labelKey: "nav.admin", icon: AdminIcon },
];

export function MainLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t("app.title")}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, opacity: 0.8 }}>
            {t("app.subtitle")}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout} title={t("nav.logout")}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={isActive}
                    sx={{
                      "&.Mui-selected": {
                        backgroundColor: "primary.light",
                        "&:hover": { backgroundColor: "primary.light" },
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Icon color={isActive ? "primary" : "inherit"} />
                    </ListItemIcon>
                    <ListItemText primary={t(item.labelKey)} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}