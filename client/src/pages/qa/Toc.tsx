import { Box, Link, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

interface TocSection {
  id: string
  label: string
}

export const qaSections: TocSection[] = [
  { id: 'credenciales', label: '§1 Credenciales' },
  { id: 'arquitectura', label: '§2 Arquitectura' },
  { id: 'trifuerza', label: '§3 Trifuerza + Env' },
  { id: 'db', label: '§4 DB testing' },
  { id: 'api', label: '§5 API testing' },
  { id: 'ui', label: '§6 UI testing' },
  { id: 'referencia', label: '§7 Referencia' },
];

export function Toc() {
  const [active, setActive] = useState('credenciales');

  useEffect(() => {
    const handler = () => {
      const scrollY = window.scrollY + 120;
      const sections = qaSections.map(s => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].offsetTop <= scrollY) {
          setActive(qaSections[i].id);
          return;
        }
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <Box
      data-testid="qa-toc"
      component="nav"
      sx={{
        position: 'sticky',
        top: 80,
        borderLeft: '2px solid',
        borderColor: 'divider',
        pl: 2,
        py: 1,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
        En esta guía
      </Typography>
      {qaSections.map(s => (
        <Link
          key={s.id}
          href={`#${s.id}`}
          data-testid={`qa-toc-link-${s.id}`}
          underline="none"
          sx={{
            'display': 'block',
            'py': 0.25,
            'fontSize': '0.8125rem',
            'color': active === s.id ? 'primary.main' : 'text.secondary',
            'fontWeight': active === s.id ? 600 : 400,
            'borderLeft': active === s.id ? '2px solid' : '2px solid transparent',
            'borderColor': active === s.id ? 'primary.main' : 'transparent',
            'ml': '-10px',
            'pl': '10px',
            'transition': 'all 0.15s',
            '&:hover': { color: 'primary.main' },
          }}
        >
          {s.label}
        </Link>
      ))}
    </Box>
  );
}
