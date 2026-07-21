import { Box, Typography } from '@mui/material';

interface RingSegment {
  label: string
  value: number
  color: string
}

interface RingChartProps {
  segments: RingSegment[]
  title?: string
  size?: number
  centerLabel?: string
}

const SEGMENT_COLORS = [
  '#4B9CD3',
  '#2E7D5B',
  '#D4A843',
  '#C8434A',
  '#7BA384',
  '#E87A6A',
  '#2B6DAE',
  '#B8892E',
];

export function RingChart({ segments, title, size = 200, centerLabel }: RingChartProps) {
  const total = segments.reduce((s, i) => s + i.value, 0) || 1;
  const colored = segments.map((s, i) => ({
    ...s,
    color: s.color || SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    pct: (s.value / total) * 100,
  }));

  const conicStops = colored.reduce<string[]>((acc, seg, i) => {
    const start = i === 0 ? 0 : colored.slice(0, i).reduce((s, c) => s + c.pct, 0);
    const end = start + seg.pct;
    acc.push(`${seg.color} ${start}% ${end}%`);
    return acc;
  }, []);

  return (
    <Box>
      {title && (
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: `conic-gradient(${conicStops.join(', ')})`,
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: '25%',
              borderRadius: '50%',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {centerLabel && (
              <Typography variant="body2" fontWeight={600} color="text.primary" textAlign="center">
                {centerLabel}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {colored.map(s => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: s.color, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
                {s.label}
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {s.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
