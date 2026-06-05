import {
  BarChart as AnalyticsIcon,
  MenuBook as CoursesIcon,
  School as SchoolIcon,
  Security as SecurityIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';

function HeroSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`,
        color: '#fff',
        pt: { xs: 8, md: 12 },
        pb: { xs: 6, md: 10 },
        textAlign: 'center',
      }}
    >
      <Container maxWidth="md">
        <Typography
          variant="h1"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '2rem', md: '3rem' },
            mb: 2,
          }}
        >
          {t('app.title')}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 400,
            opacity: 0.9,
            mb: 4,
            fontSize: { xs: '1rem', md: '1.25rem' },
            lineHeight: 1.7,
          }}
        >
          {t('app.subtitle')}
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => { void navigate('/login'); }}
          sx={{
            'bgcolor': '#fff',
            'color': theme.palette.primary.dark,
            'fontWeight': 600,
            'px': 5,
            'py': 1.5,
            'fontSize': '1.1rem',
            '&:hover': { bgcolor: '#e8e8e8' },
          }}
        >
          {t('login.submit')}
        </Button>
      </Container>
    </Box>
  );
}

interface FeatureCard {
  icon: typeof SchoolIcon
  title: string
  description: string
}

function FeatureCards() {
  const { t } = useTranslation();

  const cards: FeatureCard[] = [
    {
      icon: SchoolIcon,
      title: t('landing.students_title'),
      description: t('landing.students_desc'),
    },
    {
      icon: SecurityIcon,
      title: t('landing.coordinators_title'),
      description: t('landing.coordinators_desc'),
    },
    {
      icon: CoursesIcon,
      title: t('landing.admin_title'),
      description: t('landing.admin_desc'),
    },
  ];

  return (
    <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" textAlign="center" sx={{ mb: 6, fontWeight: 600 }}>
          {t('landing.who_is_for')}
        </Typography>
        <Grid container spacing={4}>
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Grid size={{ xs: 12, md: 4 }} key={idx}>
                <Card
                  sx={{
                    'height': '100%',
                    'transition': 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 4 }}>
                    <Icon
                      sx={{
                        fontSize: 48,
                        color: 'primary.main',
                        mb: 2,
                      }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {card.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}

function SystemFeatures() {
  const { t } = useTranslation();

  const features = [
    { icon: SyncIcon, title: t('landing.moodle_sync'), desc: t('landing.moodle_sync_desc') },
    { icon: AnalyticsIcon, title: t('landing.rule_engine'), desc: t('landing.rule_engine_desc') },
    { icon: SchoolIcon, title: t('landing.progress'), desc: t('landing.progress_desc') },
  ];

  return (
    <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" textAlign="center" sx={{ mb: 1, fontWeight: 600 }}>
          {t('landing.features_title')}
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          {t('landing.features_subtitle')}
        </Typography>
        <Grid container spacing={4}>
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                <Box sx={{ textAlign: 'center', px: 2 }}>
                  <Icon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {feat.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feat.desc}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}

function Footer() {
  const { t } = useTranslation();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'grey.900',
        color: 'grey.400',
        py: 4,
        textAlign: 'center',
      }}
    >
      <Container maxWidth="md">
        <Typography variant="body2" sx={{ mb: 1 }}>
          {t('landing.footer_unc')}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {t('landing.footer_built')}
        </Typography>
      </Container>
    </Box>
  );
}

export function LandingPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isAuthenticated = localStorage.getItem('token') !== null;
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {!isMobile && (
        <AppBar position="static" color="transparent" elevation={0} sx={{ bgcolor: 'transparent' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', color: 'text.primary', fontWeight: 600 }}>
              Sistema de Gestión de Diplomas
            </Typography>
            <Button color="primary" onClick={() => { window.location.href = '/login'; }}>
              Iniciar sesión
            </Button>
          </Toolbar>
        </AppBar>
      )}
      <HeroSection />
      <FeatureCards />
      <SystemFeatures />
      <Footer />
    </Box>
  );
}
