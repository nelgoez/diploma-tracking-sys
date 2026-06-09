import type { AgentKey } from './qaConfig';
import { Check as CheckIcon, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import { Box, IconButton, Tab, Tabs } from '@mui/material';
import { useState } from 'react';

function PreBlock({ code, language = 'bash' }: { code: string, language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Box
      data-testid="qa-code-block"
      sx={{
        'position': 'relative',
        '&:hover .qa-copy-btn': { opacity: 1 },
      }}
    >
      <Box
        component="pre"
        sx={{
          overflowX: 'auto',
          borderRadius: 1,
          bgcolor: '#0f172a',
          color: '#e2e8f0',
          p: 2,
          fontSize: '0.8125rem',
          fontFamily: 'monospace',
          lineHeight: 1.6,
          m: 0,
        }}
      >
        <code className={`language-${language}`}>{code}</code>
      </Box>
      <IconButton
        onClick={copy}
        aria-label="Copiar código"
        size="small"
        className="qa-copy-btn"
        data-testid="qa-copy-code-button"
        sx={{
          'position': 'absolute',
          'right': 8,
          'top': 8,
          'opacity': 0,
          'transition': 'opacity 0.2s',
          'color': '#94a3b8',
          '&:hover': { color: '#e2e8f0' },
        }}
      >
        {copied ? <CheckIcon sx={{ fontSize: 16, color: '#4ade80' }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
      </IconButton>
    </Box>
  );
}

export function CodeBlock({ code, language }: { code: string, language?: string }) {
  return <PreBlock code={code} language={language} />;
}

export function AgentCodeBlock({ blocks, agents }: { blocks: Record<string, string>, agents: AgentKey[] }) {
  const labels: Record<string, string> = { claude: 'Claude Code', opencode: 'OpenCode' };
  const langs: Record<string, string> = { claude: 'json', opencode: 'jsonc' };
  const [tab, setTab] = useState(agents[0]);

  return (
    <Box data-testid="qa-agent-tabs">
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ minHeight: 36, mb: 0.5 }}
      >
        {agents.map(a => (
          <Tab
            key={a}
            value={a}
            label={labels[a] ?? a}
            data-testid={`qa-agent-tab-${a}`}
            sx={{ minHeight: 36, py: 0.5, textTransform: 'none', fontSize: '0.8125rem' }}
          />
        ))}
      </Tabs>
      {agents.map(a => (
        <Box key={a} role="tabpanel" hidden={tab !== a}>
          {tab === a && <PreBlock code={blocks[a]} language={langs[a]} />}
        </Box>
      ))}
    </Box>
  );
}
