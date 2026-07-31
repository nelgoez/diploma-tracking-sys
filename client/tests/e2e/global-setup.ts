import type { FullConfig } from '@playwright/test';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) { throw new Error(`Missing required env var: ${name}`); }
  return val;
}

async function globalSetup(_config: FullConfig) {
  process.env.TEST_ADMIN_EMAIL = requireEnv('TEST_ADMIN_EMAIL');
  process.env.TEST_ADMIN_PASSWORD = requireEnv('TEST_ADMIN_PASSWORD');
  process.env.TEST_STUDENT_EMAIL = requireEnv('TEST_STUDENT_EMAIL');
  process.env.TEST_STUDENT_PASSWORD = requireEnv('TEST_STUDENT_PASSWORD');
}

export default globalSetup;
