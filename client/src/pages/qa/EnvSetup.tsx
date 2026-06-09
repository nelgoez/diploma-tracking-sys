import type { QaConfig } from './qaConfig';
import { Warning as WarningIcon } from '@mui/icons-material';
import { Box, Chip, Typography } from '@mui/material';

export function EnvSetup({ config }: { config: QaConfig }) {
  return (
    <Box data-testid="qa-env-setup" sx={{ mt: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
        Archivos de config de los MCP
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Los archivos de config de los MCP están
        {' '}
        <strong>commiteados a git y no llevan secretos</strong>
        :
        referencian variables por expansión. Los valores reales viven en
        {' '}
        <code>.env</code>
        {' '}
        (gitignored).
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Slots que necesitás declarar en
        {' '}
        <code>.env</code>
        :
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
        {config.env.slots.map(s => (
          <Chip key={s} label={s} variant="outlined" size="small" sx={{ fontFamily: 'monospace' }} />
        ))}
      </Box>

      <Box
        sx={{
          borderLeft: '4px solid',
          borderColor: 'info.main',
          bgcolor: 'info.50',
          p: 2,
          borderRadius: 1,
          mb: 2,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Activar
          {' '}
          <code>.env</code>
          {' '}
          antes de lanzar el agente:
        </Typography>
        <Box component="ul" sx={{ 'm': 0, 'pl': 3, '& li': { fontSize: '0.8125rem', color: 'text.secondary', mb: 0.25 } }}>
          {config.env.activation.includes('wrapper') && (
            <li>
              <code>bun run claude</code>
              {' '}
              /
              <code>bun run opencode</code>
              {' '}
              (dotenv-cli, cross-platform)
            </li>
          )}
          {config.env.activation.includes('direnv') && (
            <li>
              <code>direnv</code>
              {' '}
              +
              <code>.envrc</code>
              {' '}
              (Mac/Linux;
              <code>direnv allow</code>
              )
            </li>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          borderLeft: '4px solid',
          borderColor: 'warning.main',
          bgcolor: 'warning.50',
          p: 2,
          borderRadius: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}
        >
          <WarningIcon sx={{ fontSize: 18 }} />
          Si una var no carga
        </Typography>
        <Typography variant="body2" color="text.secondary">
          El MCP da 401/403 (o DBHub: error críptico de auth porque sustituye literal
          {' '}
          <code>
            $
            {'{VAR}'}
          </code>
          ).
          Salí del agente, corregí
          {' '}
          <code>.env</code>
          , reentrá — las vars se leen una vez al spawnear el MCP.
          Verificá que se inyecten con
          {' '}
          <code>env | grep DBHUB</code>
          .
        </Typography>
      </Box>

      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 1,
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Session Pooler — qué puerto usar
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Conectá por el Session Pooler en el puerto
          {' '}
          <strong>5432</strong>
          {' '}
          (transacciones largas OK).
          NO uses el 6543 (transaction pooler, sin prepared statements).
          El usuario del pooler es punteado:
          {' '}
          <code>&lt;DBHUB_USER&gt;.&lt;project-ref&gt;</code>
          .
          Host, user y ref viven en el
          {' '}
          <code>.env</code>
          {' '}
          (DBHUB_HOST, DBHUB_USER), nunca en esta página.
        </Typography>
      </Box>
    </Box>
  );
}
