import type { Dirent } from 'node:fs';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dir, '..');
const OUTPUT_DIR = resolve(REPO_ROOT, 'traceability-out');
const JIRA_URL = process.env.JIRA_URL || 'https://diplo-track-sys.atlassian.net';

const ATC_RE = /@atc\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*\{([^}]+)\}\s*)?\)/g;

interface RawAtc {
  testId: string
  file: string
  story?: string
  feature?: string
  label?: string
}

function parseMetaBlock(raw: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const propRe = /(\w+)\s*:\s*['"]([^'"]+)['"]/g;
  let m = propRe.exec(raw);
  while (m !== null) {
    meta[m[1]] = m[2];
    m = propRe.exec(raw);
  }
  return meta;
}

function collectAtcs(dir: string, baseDir: string): RawAtc[] {
  const results: RawAtc[] = [];
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  }
  catch {
    return results;
  }
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('node_modules') && !entry.name.startsWith('dist') && !entry.name.startsWith('.git')) {
      results.push(...collectAtcs(full, baseDir));
    }
    else if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) {
      const content = readFileSync(full, 'utf-8');
      let m = ATC_RE.exec(content);
      while (m !== null) {
        const testId = m[1];
        const meta = m[2] ? parseMetaBlock(m[2]) : {};
        results.push({
          testId,
          file: relative(baseDir, full),
          story: meta.story,
          feature: meta.feature,
          label: meta.label,
        });
        m = ATC_RE.exec(content);
      }
    }
  }
  return results;
}

function generateMarkdown(atcs: RawAtc[]): string {
  const lines: string[] = [
    '# Traceability Matrix — ATC to Jira Mapping',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Jira: ${JIRA_URL}`,
    `Total ATCs: ${atcs.length}`,
    '',
    '| Test ID | File | Story | Feature | Label |',
    '|---------|------|-------|---------|-------|',
  ];
  for (const atc of atcs) {
    const storyLink = atc.story ? `[${atc.story}](${JIRA_URL}/browse/${atc.story})` : '-';
    lines.push(`| ${atc.testId} | ${atc.file} | ${storyLink} | ${atc.feature || '-'} | ${atc.label || '-'} |`);
  }
  return lines.join('\n');
}

function main() {
  const atcs = collectAtcs(REPO_ROOT, REPO_ROOT);

  if (!existsSync(OUTPUT_DIR)) { mkdirSync(OUTPUT_DIR, { recursive: true }); }

  const md = generateMarkdown(atcs);
  writeFileSync(resolve(OUTPUT_DIR, 'traceability-matrix.md'), md, 'utf-8');

  const json = JSON.stringify(atcs, null, 2);
  writeFileSync(resolve(OUTPUT_DIR, 'traceability-matrix.json'), json, 'utf-8');

  console.log('\nTraceability matrix generated:');
  console.log(`  ATCs found: ${atcs.length}`);
  console.log('  Markdown: traceability-out/traceability-matrix.md');
  console.log('  JSON:     traceability-out/traceability-matrix.json');
}

main();
