import type { QaConfig } from './qaConfig';
import { Api, Language, Storage } from '@mui/icons-material';
import { Box, Chip, Typography } from '@mui/material';

const GitBranchSvg = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="4" cy="5" r="2" />
    <circle cx="11" cy="11" r="2" />
    <circle cx="11" cy="5" r="2" />
    <path d="M4 7v4" />
    <path d="M6 5h3" />
    <path d="M11 7v2" />
  </svg>
);

function ArchBox({ Icon, label, sub, color }: { Icon: React.ElementType, label: string, sub: string, color: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 96,
          width: 128,
          borderRadius: 1,
          border: '2px solid',
          borderColor: `${color}.main`,
          bgcolor: `${color}.50`,
        }}
      >
        <Icon sx={{ fontSize: 32, color: `${color}.main` }} />
        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>{label}</Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>{sub}</Typography>
    </Box>
  );
}

const Arrow = () => (
  <>
    <Typography sx={{ display: { xs: 'none', md: 'block' }, fontSize: '1.5rem', color: 'text.secondary' }}>→</Typography>
    <Typography sx={{ display: { xs: 'block', md: 'none' }, fontSize: '1.5rem', color: 'text.secondary' }}>↓</Typography>
  </>
);

function RepoRow({ label, url }: { label: string, url: string | null }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, borderRadius: 1, bgcolor: 'action.hover', p: 1.5 }}>
      <Chip label={label} size="small" />
      {url
        ? (
            <Typography
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', textDecoration: 'underline' }}
            >
              {url}
            </Typography>
          )
        : (
            <Typography variant="body2" color="text.secondary">— preguntá a tu lead —</Typography>
          )}
    </Box>
  );
}

export function ArchDiagram({ config }: { config: QaConfig }) {
  return (
    <Box data-testid="qa-architecture-diagram" sx={{ py: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 1, md: 4 },
        }}
      >
        <ArchBox Icon={Language} label="Frontend" sub={config.stack.framework} color="primary" />
        <Arrow />
        <ArchBox Icon={Api} label="API" sub={config.stack.auth.join(' · ')} color="secondary" />
        <Arrow />
        <ArchBox Icon={Storage} label="Database" sub={config.stack.db} color="success" />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          mt: 4,
          pt: 3,
          borderTop: '1px dashed',
          borderColor: 'divider',
        }}
      >
        <Chip label="DBHub MCP → DB" variant="outlined" size="small" />
        <Chip label="OpenAPI / Postman MCP → API" variant="outlined" size="small" />
        <Chip label="Playwright MCP → UI" variant="outlined" size="small" />
      </Box>

      <Box
        data-testid="qa-repos"
        sx={{ mt: 4, pt: 3, borderTop: '1px dashed', borderColor: 'divider' }}
      >
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <GitBranchSvg />
          Repositorios
        </Typography>
        {config.project.reposShape === 'mono'
          ? (
              <RepoRow label="Monorepo" url={config.project.backendRepo ?? config.project.frontendRepo} />
            )
          : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 1 }}>
                <RepoRow label="Frontend" url={config.project.frontendRepo} />
                <RepoRow label="Backend" url={config.project.backendRepo} />
              </Box>
            )}
      </Box>
    </Box>
  );
}
