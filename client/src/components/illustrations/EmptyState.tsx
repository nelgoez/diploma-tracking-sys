import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface EmptyStateProps {
  illustration: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ illustration, title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          'width': { xs: 120, md: 200 },
          'height': { xs: 120, md: 200 },
          'mb': 2.5,
          '@keyframes emptyFloat': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-8px)' },
          },
          'animation': 'emptyFloat 3s ease-in-out infinite',
        }}
      >
        {illustration}
      </Box>
      <Typography
        variant="h6"
        sx={{
          color: 'text.secondary',
          fontWeight: 600,
          fontSize: { xs: '1rem', md: '1.125rem' },
          mb: description ? 0.5 : 0,
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.disabled"
          sx={{ maxWidth: 320 }}
        >
          {description}
        </Typography>
      )}
      {action && (
        <Box sx={{ mt: 2 }}>
          {action}
        </Box>
      )}
    </Box>
  );
}
