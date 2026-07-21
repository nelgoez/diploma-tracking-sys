import type { ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';

interface PageHeaderProps {
  title: string
  description?: string
  action?: { label: string, icon?: ReactNode, onClick: () => void }
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        'position': 'relative',
        'background': 'linear-gradient(135deg, #4B9CD3 0%, #2B6DAE 50%, #1B4F8A 100%)',
        'borderRadius': 3,
        'px': { xs: 3, md: 4 },
        'py': { xs: 3, md: 4 },
        'mb': 3,
        'overflow': 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -2,
          left: 0,
          right: 0,
          height: 30,
          background: 'white',
          clipPath: 'polygon(0 0, 3% 100%, 6% 0, 9% 100%, 12% 0, 15% 100%, 18% 0, 21% 100%, 24% 0, 27% 100%, 30% 0, 33% 100%, 36% 0, 39% 100%, 42% 0, 45% 100%, 48% 0, 51% 100%, 54% 0, 57% 100%, 60% 0, 63% 100%, 66% 0, 69% 100%, 72% 0, 75% 100%, 78% 0, 81% 100%, 84% 0, 87% 100%, 90% 0, 93% 100%, 96% 0, 99% 100%, 100% 0)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 1.5, md: 0 },
          minHeight: { xs: 60, md: 40 },
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.85)',
                mt: 0.5,
                fontSize: { xs: '0.8125rem', md: '0.875rem' },
                maxWidth: 520,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
        {action && (
          <Button
            variant="contained"
            onClick={action.onClick}
            startIcon={action.icon}
            sx={{
              'bgcolor': 'rgba(255,255,255,0.2)',
              'color': '#fff',
              'fontWeight': 600,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
              'backdropFilter': 'blur(4px)',
              'whiteSpace': 'nowrap',
            }}
          >
            {action.label}
          </Button>
        )}
      </Box>
    </Box>
  );
}
