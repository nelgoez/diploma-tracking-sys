import type { AtcMeta } from './decorators';
import { getAllAtcs } from './decorators';

export interface TraceabilityRow {
  testId: string
  story: string
  feature: string
  label: string
  vcr: string
}

export function buildTraceabilityMatrix(): TraceabilityRow[] {
  return getAllAtcs().map((atc: AtcMeta) => ({
    testId: atc.testId,
    story: atc.story || '-',
    feature: atc.feature || '-',
    label: atc.label || '-',
    vcr: atc.vcr ? `${atc.vcr.value}/${atc.vcr.confidence}/${atc.vcr.risk}` : '-',
  }));
}

export function generateTraceabilityMarkdown(jiraUrl: string): string {
  const rows = buildTraceabilityMatrix();
  const lines: string[] = [
    '# Traceability Matrix',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Jira: ${jiraUrl}`,
    '',
    '| Test ID | Story | Feature | Label | VCR |',
    '|---------|-------|---------|-------|-----|',
  ];
  for (const row of rows) {
    const storyLink = row.story !== '-' ? `[${row.story}](${jiraUrl}/browse/${row.story})` : '-';
    lines.push(`| ${row.testId} | ${storyLink} | ${row.feature} | ${row.label} | ${row.vcr} |`);
  }
  lines.push('', `--- Total ATCs: ${rows.length} ---`);
  return lines.join('\n');
}

export function generateTraceabilityJson(): string {
  return JSON.stringify(buildTraceabilityMatrix(), null, 2);
}
