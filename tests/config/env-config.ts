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
      email: process.env.TEST_ADMIN_EMAIL || 'admin@dts.unc.edu.ar',
      password: process.env.TEST_ADMIN_PASSWORD || 'Admin123456!',
    },
    student: {
      email: process.env.TEST_STUDENT_EMAIL || 'nahuelgomez.cti@gmail.com',
      password: process.env.TEST_STUDENT_PASSWORD || 'Test123456!',
    },
  },
};
