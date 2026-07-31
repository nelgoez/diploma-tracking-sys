function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) { throw new Error(`Missing required env var: ${name}. Set in .env or CI secrets.`); }
  return val;
}

export const TEST_ADMIN_EMAIL = requireEnv('TEST_ADMIN_EMAIL');
export const TEST_ADMIN_PASSWORD = requireEnv('TEST_ADMIN_PASSWORD');
export const TEST_STUDENT_EMAIL = requireEnv('TEST_STUDENT_EMAIL');
export const TEST_STUDENT_PASSWORD = requireEnv('TEST_STUDENT_PASSWORD');

export const BASE = 'http://localhost:3000/api/v1';
