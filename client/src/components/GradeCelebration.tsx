import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

interface GradeCelebrationProps {
  grade: number
  onComplete?: () => void
}

export function GradeCelebration({ grade, onComplete }: GradeCelebrationProps) {
  const [show, setShow] = useState(true);
  const passed = grade >= 4;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, passed ? 1900 : 1200);
    return () => clearTimeout(timer);
  }, [passed, onComplete]);

  if (!show) { return null; }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        py: 3,
      }}
    >
      {passed && (
        <Box
          className="dts-particle dts-particle-1"
          sx={{ top: 12, left: 'calc(50% - 36px)' }}
        />
      )}
      {passed && (
        <Box
          className="dts-particle dts-particle-2"
          sx={{ top: 6, left: 'calc(50% - 4px)' }}
        />
      )}
      {passed && (
        <Box
          className="dts-particle dts-particle-3"
          sx={{ top: 12, left: 'calc(50% + 28px)' }}
        />
      )}

      <Box
        className={`dts-badge-flip ${passed ? 'dts-pulse-green' : 'dts-pulse-coral'}`}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          px: 3,
          py: 1.5,
          borderRadius: 2,
          bgcolor: passed ? 'success.light' : 'error.light',
          color: passed ? 'success.dark' : 'error.dark',
          fontWeight: 700,
          fontSize: '1.125rem',
        }}
      >
        {passed ? '✓' : '✗'}
        <Typography
          variant="inherit"
          sx={{ fontWeight: 700, color: 'inherit' }}
        >
          {passed ? 'Aprobado' : 'Desaprobado'}
        </Typography>
      </Box>
    </Box>
  );
}
