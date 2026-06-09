/* qa-guide-snapshot
   stack=react18+vite6+mui7+hono+jose+jwt|db=postgres(supabase)|auth=jwt-login|lang=es
   generated=2026-06-08
   credentials-source=https://diplo-track-sys.atlassian.net/browse/DTS-42
   decisions=q1:jira-epic|q2:qa_inspector_ro|q3:/qa|q4:skip|q5:es
*/
export type AgentKey = 'claude' | 'opencode';

export interface QaConfig {
  lang: 'es'
  project: {
    name: string
    reposShape: 'mono'
    backendRepo: string | null
    frontendRepo: string | null
  }
  stack: {
    framework: string
    ui: string
    db: string
    orm: string | null
    auth: string[]
  }
  credentialsSource: { label: string, url: string } | null
  docs: { ui: 'scalar', route: string, specUrl: string }
  api: {
    baseUrl: string
    loginEndpoint: string
    tokenShape: string
    loginHelper: string | null
    authMethods: { id: string, label: string, snippet: string }[]
  }
  db: { engine: 'postgres', tomlPath: string, uriScheme: string }
  mcp: {
    agents: AgentKey[]
    dbhub: Record<AgentKey, string>
    openapi: Record<AgentKey, string>
    postman: Record<AgentKey, string>
    playwright: Record<AgentKey, string>
  }
  env: {
    strategy: 'expansion'
    activation: ('wrapper' | 'direnv')[]
    slots: string[]
  }
  demoUsers: { email: string, passwordHint: string, role: string, capabilities: string }[]
}

export const qaConfig: QaConfig = {
  lang: 'es',
  project: {
    name: 'Diploma Tracking System',
    reposShape: 'mono',
    backendRepo: 'https://github.com/nelgoez/diploma-tracking-sys',
    frontendRepo: 'https://github.com/nelgoez/diploma-tracking-sys',
  },
  stack: {
    framework: 'React 18 + Vite 6',
    ui: 'MUI v7',
    db: 'PostgreSQL (Supabase)',
    orm: null,
    auth: ['JWT (jose/HS256)', 'Supabase Auth'],
  },
  credentialsSource: { label: 'Jira Epic', url: 'https://diplo-track-sys.atlassian.net/browse/DTS-42' },
  docs: {
    ui: 'scalar' as const,
    route: '/api/v1/docs',
    specUrl: '/api/v1/api-spec',
  },
  api: {
    baseUrl: 'https://server-git-main-nelgoezs-projects.vercel.app/api/v1',
    loginEndpoint: '/api/v1/auth/login',
    tokenShape: '{ access_token, refresh_token, user: { id, email, role } }',
    loginHelper: null,
    authMethods: [
      {
        id: 'bearer',
        label: 'Bearer JWT',
        snippet: `# 1) Obtener el access token
curl -X POST '<API_BASE_URL>/auth/login' \\
  -H 'Content-Type: application/json' \\
  -d '{"email":"<ver credenciales>","password":"<ver credenciales>"}'
# → { "access_token": "eyJ...", "refresh_token": "...", "user": {...} }

# 2) Usarlo en cada request
curl '<API_BASE_URL>/me' -H 'Authorization: Bearer <ACCESS_TOKEN>'

# 3) Refrescar cuando expire (access_token dura 24h por defecto)
curl -X POST '<API_BASE_URL>/auth/refresh' \\
  -H 'Content-Type: application/json' \\
  -d '{"refresh_token":"<REFRESH_TOKEN>"}'`,
      },
    ],
  },
  db: {
    engine: 'postgres' as const,
    tomlPath: 'dbhub.toml',
    uriScheme: 'postgresql',
  },
  mcp: {
    agents: ['claude', 'opencode'],
    dbhub: {
      claude: `// Claude Code → .mcp.json
"sql": {
  "command": "bunx",
  "args": ["-y", "@bytebase/dbhub@latest", "--config", "dbhub.toml"]
}`,
      opencode: `// OpenCode → opencode.jsonc
"sql": {
  "type": "local",
  "command": ["bunx", "-y", "@bytebase/dbhub@latest", "--config", "dbhub.toml"],
  "enabled": true
}`,
    },
    openapi: {
      claude: `// Claude Code → .mcp.json
"openapi": {
  "command": "bunx",
  "args": ["-y", "@ivotoby/openapi-mcp-server", "--tools", "dynamic"],
  "env": {
    "API_BASE_URL": "\${API_BASE_URL}",
    "OPENAPI_SPEC_PATH": "\${OPENAPI_SPEC_PATH}",
    "API_HEADERS": "Authorization:Bearer \${API_BEARER_TOKEN}"
  }
}`,
      opencode: `// OpenCode → opencode.jsonc
"openapi": {
  "type": "local",
  "command": ["bunx", "-y", "@ivotoby/openapi-mcp-server", "--tools", "dynamic"],
  "environment": {
    "API_BASE_URL": "{env:API_BASE_URL}",
    "OPENAPI_SPEC_PATH": "{env:OPENAPI_SPEC_PATH}",
    "API_HEADERS": "Authorization:Bearer {env:API_BEARER_TOKEN}"
  },
  "enabled": true
}`,
    },
    postman: {
      claude: `// Claude Code → .mcp.json
"postman": {
  "type": "http",
  "url": "https://mcp.postman.com/mcp",
  "headers": { "Authorization": "Bearer \${POSTMAN_API_KEY}" }
}`,
      opencode: `// OpenCode → opencode.jsonc
"postman": {
  "type": "remote",
  "url": "https://mcp.postman.com/mcp",
  "headers": { "Authorization": "Bearer {env:POSTMAN_API_KEY}" },
  "enabled": true
}`,
    },
    playwright: {
      claude: `// Claude Code → .mcp.json
"playwright": {
  "command": "bunx",
  "args": ["@playwright/mcp@latest", "--caps", "vision,pdf,testing,tracing,tabs",
           "--timeout-action", "10000", "--timeout-navigation", "30000",
           "--viewport-size", "1920x1080"]
}`,
      opencode: `// OpenCode → opencode.jsonc
"playwright": {
  "type": "local",
  "command": ["bunx", "@playwright/mcp@latest", "--caps", "vision,pdf,testing,tracing,tabs",
              "--timeout-action", "10000", "--timeout-navigation", "30000",
              "--viewport-size", "1920x1080"],
  "enabled": true
}`,
    },
  },
  env: {
    strategy: 'expansion' as const,
    activation: ['wrapper', 'direnv'],
    slots: [
      'DBHUB_TYPE',
      'DBHUB_HOST',
      'DBHUB_PORT',
      'DBHUB_DATABASE',
      'DBHUB_USER',
      'DBHUB_PASSWORD',
      'API_BASE_URL',
      'OPENAPI_SPEC_PATH',
      'API_BEARER_TOKEN',
      'POSTMAN_API_KEY',
      'SUPABASE_ACCESS_TOKEN',
      'SUPABASE_PROJECT_URL',
    ],
  },
  demoUsers: [
    {
      email: 'admin@dts.unc.edu.ar',
      passwordHint: 'Disponible en credenciales',
      role: 'admin',
      capabilities: 'CRUD completo, gestión de usuarios, dashboard stats, control de sync',
    },
    {
      email: 'coordinador@dts.unc.edu.ar',
      passwordHint: 'Bajo pedido',
      role: 'coordinador',
      capabilities: 'Inscribir estudiantes, gestionar overrides, calificar exámenes, batch operations',
    },
    {
      email: 'estudiante@dts.unc.edu.ar',
      passwordHint: 'Disponible en credenciales',
      role: 'estudiante',
      capabilities: 'Ver progreso, certificados, elegibilidad, inscribirse a examen',
    },
  ],
};
