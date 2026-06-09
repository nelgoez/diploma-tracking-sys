import type { QaConfig } from './qaConfig';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import { CodeBlock } from './CodeBlock';

export function AuthMethods({ config }: { config: QaConfig }) {
  const methods = config.api.authMethods;
  const [tab, setTab] = useState(methods[0]?.id ?? '');

  if (!methods.length) {
    return <Typography variant="body2" color="text.secondary">Auth no detectado — preguntá a tu lead.</Typography>;
  }

  return (
    <Box data-testid="qa-auth-methods">
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 36, mb: 1 }}>
        {methods.map(m => (
          <Tab
            key={m.id}
            value={m.id}
            label={m.label}
            data-testid={`qa-auth-tab-${m.id}`}
            sx={{ minHeight: 36, py: 0.5, textTransform: 'none', fontSize: '0.8125rem' }}
          />
        ))}
      </Tabs>
      {methods.map(m => (
        <Box key={m.id} role="tabpanel" hidden={tab !== m.id}>
          {tab === m.id && <CodeBlock language="bash" code={m.snippet} />}
        </Box>
      ))}
    </Box>
  );
}
