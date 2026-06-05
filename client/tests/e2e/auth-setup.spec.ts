import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from '@playwright/test';

const HUB_AUTH_DIR = join(
  process.cwd(),
  '..',
  '..',
  'agentic-diplo-track-sys',
  'demo-output',
  'auth',
);
mkdirSync(HUB_AUTH_DIR, { recursive: true });

const PROFILES = [
  { key: 'github', name: 'GitHub', url: 'https://github.com/nahuelX/agentic-diplo-track-sys/actions' },
  { key: 'vercel', name: 'Vercel', url: 'https://vercel.com/dashboard' },
  { key: 'supabase', name: 'Supabase', url: 'https://supabase.com/dashboard/project/vbjhxlezqhkmhpuypkvf' },
  { key: 'jira', name: 'Jira', url: 'https://diplo-track-sys.atlassian.net/jira/software/projects/UPEX/boards/1' },
];

test.describe.configure({ mode: 'serial', timeout: 600000 });

let i = 0;
for (const p of PROFILES) {
  test(`auth: ${p.name}`, async ({ browser }) => {
    i++;
    console.log('\n========================================');
    console.log(`  ${i}/4: ${p.name}`);
    console.log(`  ${p.url}`);
    console.log('========================================');
    console.log('  >> Browser opens. Log in.');
    console.log('  >> Click "Resume" in the Playwright Inspector when done.');

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    await page.goto(p.url, { waitUntil: 'load', timeout: 30000 });
    await page.pause();

    const storagePath = join(HUB_AUTH_DIR, `${p.key}.json`);
    await context.storageState({ path: storagePath });
    console.log(`  [save] ${storagePath}`);
    await context.close();
    console.log('  [done]\n');
  });
}
