import { keyframes } from '@emotion/react';
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
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

function FadeIn({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) { return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => { observer.disconnect(); };
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
      }}
    >
      {children}
    </Box>
  );
}

function StudentIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#E3F2FD" stroke="#1565C0" strokeWidth="2" />
      <path d="M32 16c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z" fill="#1565C0" />
      <path d="M20 44c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="#1565C0" />
      <path d="M38 36l-6-4-6 4" stroke="#E3F2FD" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function CoordinatorIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="2" />
      <path d="M24 20h16v4H24zM24 28h12v4H24zM24 36h14v4H24z" fill="#2E7D32" />
      <circle cx="46" cy="40" r="6" fill="#66BB6A" stroke="#2E7D32" strokeWidth="1.5" />
      <path d="M44 40l1.5 1.5 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#FFF3E0" stroke="#E65100" strokeWidth="2" />
      <rect x="20" y="22" width="24" height="20" rx="2" fill="#E65100" />
      <path d="M26 30h12M26 34h8" stroke="#FFF3E0" strokeWidth="2" strokeLinecap="round" />
      <rect x="28" y="18" width="8" height="6" rx="2" fill="#E65100" />
    </svg>
  );
}

function SyncSvg() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#E3F2FD" stroke="#1565C0" strokeWidth="2" />
      <path d="M16 18h16v-4l6 6-6 6v-4H16z" fill="#1565C0" />
      <path d="M32 30H16v4l-6-6 6-6v4h16z" fill="#1565C0" />
    </svg>
  );
}

function RuleEngineSvg() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="2" />
      <path d="M16 14h16l-8 20z" fill="#2E7D32" />
      <circle cx="24" cy="26" r="3" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="1.5" />
    </svg>
  );
}

function ProgressSvg() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#FFF3E0" stroke="#E65100" strokeWidth="2" />
      <path d="M24 12v24M12 36h24" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="14" y="32" width="6" height="6" rx="1" fill="#E65100" />
      <rect x="22" y="28" width="6" height="10" rx="1" fill="#FF9800" />
      <rect x="30" y="24" width="6" height="14" rx="1" fill="#E65100" />
    </svg>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 60%, ${theme.palette.primary.main} 100%)`,
        backgroundSize: '200% 200%',
        animation: `${gradientShift} 8s ease infinite`,
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
  icon: React.ComponentType
  title: string
  description: string
}

function FeatureCards() {
  const { t } = useTranslation();

  const cards: FeatureCard[] = [
    {
      icon: StudentIcon,
      title: t('landing.students_title'),
      description: t('landing.students_desc'),
    },
    {
      icon: CoordinatorIcon,
      title: t('landing.coordinators_title'),
      description: t('landing.coordinators_desc'),
    },
    {
      icon: AdminIcon,
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
                <FadeIn delay={idx * 0.15}>
                  <Card
                    sx={{
                      'height': '100%',
                      'transition': 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-6px) scale(1.02)',
                        boxShadow: 8,
                      },
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 4 }}>
                      <Box sx={{ mb: 2, display: 'inline-block' }}>
                        <Icon />
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        {card.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {card.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </FadeIn>
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
    { icon: SyncSvg, title: t('landing.moodle_sync'), desc: t('landing.moodle_sync_desc') },
    { icon: RuleEngineSvg, title: t('landing.rule_engine'), desc: t('landing.rule_engine_desc') },
    { icon: ProgressSvg, title: t('landing.progress'), desc: t('landing.progress_desc') },
  ];

  return (
    <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <FadeIn>
          <Typography variant="h3" textAlign="center" sx={{ mb: 1, fontWeight: 600 }}>
            {t('landing.features_title')}
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            {t('landing.features_subtitle')}
          </Typography>
        </FadeIn>
        <Grid container spacing={4}>
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                <FadeIn delay={idx * 0.15}>
                  <Box
                    sx={{
                      'textAlign': 'center',
                      'px': 2,
                      'py': 2,
                      'transition': 'transform 0.3s',
                      '&:hover': { transform: 'scale(1.05)' },
                    }}
                  >
                    <Box sx={{ mb: 1, display: 'inline-block' }}>
                      <Icon />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {feat.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feat.desc}
                    </Typography>
                  </Box>
                </FadeIn>
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
  const { t } = useTranslation();
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
              {t('landing.footer_unc')}
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
