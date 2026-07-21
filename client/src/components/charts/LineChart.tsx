import { Box, Typography, useTheme } from '@mui/material';

interface LineChartSeries {
  label: string
  values: number[]
  color: string
}

interface LineChartProps {
  labels: string[]
  series: LineChartSeries[]
  title?: string
  height?: number
}

export function LineChart({ labels, series, title, height = 250 }: LineChartProps) {
  const theme = useTheme();

  const allValues = series.flatMap(s => s.values);
  const maxVal = Math.max(...allValues, 1);
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = 600;
  const chartH = height;
  const plotW = chartW - padding.left - padding.right;
  const plotH = chartH - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (i / Math.max(labels.length - 1, 1)) * plotW;
  const yScale = (v: number) => padding.top + plotH - (v / maxVal) * plotH;

  const buildPath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(v)}`).join(' ');

  const buildArea = (vals: number[]) =>
    `${buildPath(vals)} L${xScale(vals.length - 1)},${padding.top + plotH} L${xScale(0)},${padding.top + plotH} Z`;

  const yTicks = 5;
  const yStep = Math.ceil(maxVal / yTicks);

  return (
    <Box>
      {title && (
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
      )}
      <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: 'auto' }}>
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = yStep * i;
          const y = yScale(val);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartW - padding.right}
                y2={y}
                stroke={theme.palette.divider}
                strokeWidth={1}
              />
              <text x={padding.left - 6} y={y + 4} textAnchor="end" fontSize={11} fill={theme.palette.text.secondary}>
                {val}
              </text>
            </g>
          );
        })}

        {labels.map((l, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={chartH - 5}
            textAnchor="middle"
            fontSize={10}
            fill={theme.palette.text.secondary}
          >
            {l}
          </text>
        ))}

        {series.map((s, si) => (
          <g key={si}>
            <path d={buildArea(s.values)} fill={s.color} fillOpacity={0.08} />
            <path d={buildPath(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
            {s.values.map((v, i) => (
              <circle key={i} cx={xScale(i)} cy={yScale(v)} r={3} fill={s.color} />
            ))}
          </g>
        ))}
      </svg>

      <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 1 }}>
        {series.map(s => (
          <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 3, borderRadius: 1, bgcolor: s.color }} />
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
