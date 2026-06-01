import {
  AdminPanelSettings as AdminIcon,
  School as CertificatesIcon,
  MenuBook as CoursesIcon,
  Dashboard as DashboardIcon,
  Link as IntegrationsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const drawerWidth = 240;

interface NavItem {
  path: string
  labelKey: string
  icon: typeof DashboardIcon
  roles?: string[]
}

const navItems: NavItem[] = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: DashboardIcon },
  { path: '/certificates', labelKey: 'nav.certificates', icon: CertificatesIcon },
  { path: '/courses', labelKey: 'nav.courses', icon: CoursesIcon },
  { path: '/integrations', labelKey: 'nav.integrations', icon: IntegrationsIcon },
  { path: '/admin', labelKey: 'nav.admin', icon: AdminIcon, roles: ['admin', 'sysadmin'] },
  { path: '/sysadmin', labelKey: 'nav.sysadmin', icon: AdminIcon, roles: ['sysadmin'] },
];

const roleLabels: Record<string, string> = {
  estudiante: 'Estudiante',
  coordinador: 'Coordinador',
  admin: 'Admin',
  sysadmin: 'SysAdmin',
};

export function MainLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = localStorage.getItem('userRole') || 'estudiante';
  const userName = localStorage.getItem('userName') || '';
  const userEmail = (() => {
    const token = localStorage.getItem('token') || '';
    try {
      const payload = token.split('.')[1];
      return (JSON.parse(atob(payload)) as { email: string }).email;
    }
    catch {
      return '';
    }
  })();

  const filteredNavItems = navItems.filter((item) => {
    if (item.roles === undefined) { return true; }
    return item.roles.includes(userRole);
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    void navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: theme => theme.zIndex.drawer + 1 }} data-testid="app-bar">
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t('app.title')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2 }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }} data-testid="user-name">
              {userName}
              {' '}
              (
              {userEmail}
              )
            </Typography>
            <Chip
              label={roleLabels[userRole] || userRole}
              size="small"
              data-testid="user-role"
              sx={{
                color: '#fff',
                fontWeight: 600,
                bgcolor: userRole === 'sysadmin' ? 'error.main' : userRole === 'admin' ? 'warning.main' : 'info.main',
              }}
            />
          </Box>
          <IconButton color="inherit" onClick={handleLogout} title={t('nav.logout')} data-testid="logout-btn">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          'width': drawerWidth,
          'flexShrink': 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    data-testid={`nav-${item.labelKey.replace('nav.', '')}`}
                    onClick={() => { void navigate(item.path); }}
                    selected={isActive}
                    sx={{
                      '&.Mui-selected': {
                        'backgroundColor': 'primary.light',
                        '&:hover': { backgroundColor: 'primary.light' },
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Icon color={isActive ? 'primary' : 'inherit'} />
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
        data-testid="main-content"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
