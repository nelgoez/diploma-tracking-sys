function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) { throw new Error(`Missing required env var: ${name}`); }
  return val;
}

export const config = {
  get apiUrl(): string {
    return process.env.TEST_API_URL || 'http://localhost:3000/api/v1';
  },
  get baseUrl(): string {
    return process.env.TEST_BASE_URL || 'http://localhost:5173';
  },
  get supabaseUrl(): string {
    return process.env.SUPABASE_URL || '';
  },
  get supabaseServiceRoleKey(): string {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  },
  get mockMode(): boolean {
    return process.env.MOCK_MODE === 'true';
  },
  credentials: {
    admin: {
      email: requireEnv('TEST_ADMIN_EMAIL'),
      password: requireEnv('TEST_ADMIN_PASSWORD'),
    },
    student: {
      email: requireEnv('TEST_STUDENT_EMAIL'),
      password: requireEnv('TEST_STUDENT_PASSWORD'),
    },
  },
};
