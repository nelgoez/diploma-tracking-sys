import type { FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  process.env.TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@dts.unc.edu.ar';
  process.env.TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Admin123456!';
  process.env.TEST_STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL || 'estudiante@dts.unc.edu.ar';
  process.env.TEST_STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD || 'Demo2024!';
}

export default globalSetup;
