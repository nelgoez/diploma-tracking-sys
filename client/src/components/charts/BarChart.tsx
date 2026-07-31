import { Box, Typography, useTheme } from '@mui/material';

interface BarItem {
  label: string
  value: number
  secondary?: string
}

interface BarChartProps {
  items: BarItem[]
  title?: string
  height?: number
}

export function BarChart({ items, title, height = 220 }: BarChartProps) {
  const theme = useTheme();
  const maxVal = Math.max(...items.map(i => i.value), 1);
  const barH = 28;
  const gap = 8;
  const labelW = 140;
  const chartH = items.length * (barH + gap) + 20;

  const displayH = Math.min(chartH, height);

  return (
    <Box>
      {title && (
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
      )}
      <svg viewBox={`0 0 500 ${chartH}`} style={{ width: '100%', height: 'auto', maxHeight: displayH }}>
        {items.map((item, i) => {
          const y = i * (barH + gap) + 10;
          const barW = (item.value / maxVal) * (500 - labelW - 60);
          return (
            <g key={i}>
              <text
                x={labelW - 6}
                y={y + barH / 2 + 4}
                textAnchor="end"
                fontSize={11}
                fill={theme.palette.text.secondary}
              >
                {item.label}
              </text>
              <rect
                x={labelW}
                y={y}
                width={Math.max(barW, 6)}
                height={barH}
                rx={4}
                ry={4}
                fill={theme.palette.primary.main}
              />
              <text
                x={labelW + barW + 6}
                y={y + barH / 2 + 4}
                fontSize={11}
                fill={theme.palette.text.primary}
              >
                {item.value}
                {item.secondary && (
                  <tspan fill={theme.palette.text.disabled} fontSize={10}>
                    {' '}
                    {item.secondary}
                  </tspan>
                )}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
}
