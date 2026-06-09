import type { TypographyProps } from '@mui/material';
import type { ReactNode } from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const accentColors: Record<string, { border: string, bg: string }> = {
  amber: { border: '#f59e0b', bg: '#fffbeb' },
  slate: { border: '#64748b', bg: '#f8fafc' },
  cyan: { border: '#06b6d4', bg: '#ecfeff' },
  emerald: { border: '#10b981', bg: '#ecfdf5' },
  violet: { border: '#8b5cf6', bg: '#f5f3ff' },
  pink: { border: '#ec4899', bg: '#fdf2f8' },
  blue: { border: '#3b82f6', bg: '#eff6ff' },
};

export function Section({
  id,
  testid,
  icon,
  title,
  desc,
  accent,
  children,
}: {
  id: string
  testid: string
  icon?: ReactNode
  title: string
  desc?: string
  accent: string
  children: ReactNode
}) {
  const ac = accentColors[accent] ?? accentColors.slate;
  return (
    <Card
      id={id}
      data-testid={testid}
      sx={{ borderLeft: `4px solid ${ac.border}`, bgcolor: ac.bg }}
    >
      <CardContent sx={{ 'p': 3, '&:last-child': { pb: 3 } }}>
        <Typography
          variant={'h5' as TypographyProps['variant']}
          component="h2"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: desc ? 0.5 : 2 }}
        >
          {icon}
          {title}
        </Typography>
        {desc && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {desc}
          </Typography>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
