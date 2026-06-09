import type { QaConfig } from './qaConfig';
import { Box, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import { AgentCodeBlock, CodeBlock } from './CodeBlock';

export function TwoWayTabs({ config, domain }: { config: QaConfig, domain: 'db' | 'api' }) {
  if (domain === 'db') {
    const [tab, setTab] = useState('mcp');
    return (
      <Box data-testid="qa-db-ways">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 36, mb: 1 }}>
          <Tab value="mcp" label="DBHub MCP" sx={{ minHeight: 36, py: 0.5, textTransform: 'none', fontSize: '0.8125rem' }} />
          <Tab value="uri" label="URI (VSCode)" sx={{ minHeight: 36, py: 0.5, textTransform: 'none', fontSize: '0.8125rem' }} />
        </Tabs>
        <Box role="tabpanel" hidden={tab !== 'mcp'}>
          {tab === 'mcp' && <AgentCodeBlock agents={config.mcp.agents} blocks={config.mcp.dbhub} />}
        </Box>
        <Box role="tabpanel" hidden={tab !== 'uri'}>
          {tab === 'uri' && (
            <CodeBlock
              language="bash"
              code={`${config.db.uriScheme}://<DBHUB_USER>:<DBHUB_PASSWORD>@<DBHUB_HOST>:5432/<DBHUB_DATABASE>?sslmode=require`}
            />
          )}
        </Box>
      </Box>
    );
  }
  const [tab, setTab] = useState('openapi');
  return (
    <Box data-testid="qa-api-ways">
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 36, mb: 1 }}>
        <Tab value="openapi" label="OpenAPI MCP" sx={{ minHeight: 36, py: 0.5, textTransform: 'none', fontSize: '0.8125rem' }} />
        <Tab value="postman" label="Postman" sx={{ minHeight: 36, py: 0.5, textTransform: 'none', fontSize: '0.8125rem' }} />
      </Tabs>
      <Box role="tabpanel" hidden={tab !== 'openapi'}>
        {tab === 'openapi' && <AgentCodeBlock agents={config.mcp.agents} blocks={config.mcp.openapi} />}
      </Box>
      <Box role="tabpanel" hidden={tab !== 'postman'}>
        {tab === 'postman' && <AgentCodeBlock agents={config.mcp.agents} blocks={config.mcp.postman} />}
      </Box>
    </Box>
  );
}
