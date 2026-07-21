import { keyframes } from '@emotion/react';
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
  GlobalStyles,
  Grid,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { motion, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';

const reducedMotionCss = {
  '@media (prefers-reduced-motion: reduce)': {
    '*, *::before, *::after': {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important',
    },
  },
};

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

function HeroSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`,
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
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          style={{ display: 'inline-block' }}
        >
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
              'transition': 'box-shadow 200ms',
              '&:hover': {
                bgcolor: '#e8e8e8',
                boxShadow: `0 0 24px ${theme.palette.primary.light}80`,
              },
            }}
          >
            {t('login.submit')}
          </Button>
        </motion.div>
      </Container>
    </Box>
  );
}

interface FeatureCard {
  icon: typeof SchoolIcon
  title: string
  description: string
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

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
                <motion.div
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                >
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
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}

function AnimatedCounter({ target, suffix = '' }: { target: number, suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) { return; }
    if (target === 0) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    const duration = 1500;
    let raf: number;

    function step(timestamp: number) {
      if (!startTime) { startTime = timestamp; }
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function StatsCounters() {
  const { t } = useTranslation();

  const stats = [
    { value: 5000, label: t('landing.stat_students'), suffix: '+' },
    { value: 150, label: t('landing.stat_tracks'), suffix: '+' },
    { value: 12000, label: t('landing.stat_certificates'), suffix: '+' },
  ];

  return (
    <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'primary.main', color: '#fff' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {stats.map((stat, idx) => (
            <Grid size={{ xs: 12, md: 4 }} key={idx}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ fontWeight: 700, fontSize: { xs: '2.5rem', md: '3.5rem' }, lineHeight: 1.2 }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.85, mt: 1 }}>
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
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
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Box sx={{ textAlign: 'center', px: 2 }}>
                    <Icon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {feat.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feat.desc}
                    </Typography>
                  </Box>
                </motion.div>
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
      <GlobalStyles styles={reducedMotionCss} />
      {!isMobile && (
        <AppBar position="static" color="transparent" elevation={0} sx={{ bgcolor: 'transparent' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', color: 'text.primary', fontWeight: 600 }}>
              {t('landing.footer_unc')}
            </Typography>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <Button color="primary" onClick={() => { window.location.href = '/login'; }}>
                Iniciar sesión
              </Button>
            </motion.div>
          </Toolbar>
        </AppBar>
      )}
      <HeroSection />
      <FeatureCards />
      <StatsCounters />
      <SystemFeatures />
      <Footer />
    </Box>
  );
}
