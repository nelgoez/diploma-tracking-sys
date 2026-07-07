import type { Page } from '@playwright/test';

export interface A11yResult {
  violations: Array<{ id: string, impact: string, description: string, helpUrl: string }>
  passes: number
}

export async function checkA11y(page: Page): Promise<A11yResult> {
  const axe = await import('@axe-core/playwright');
  const results = await new axe.AxeBuilder({ page }).analyze();
  return {
    violations: results.violations.map(v => ({
      id: v.id,
      impact: v.impact ?? 'unknown',
      description: v.description,
      helpUrl: v.helpUrl,
    })),
    passes: results.passes.length,
  };
}

export function annotateStory(storyKey: string): void {
  // Inline — called at test top-level to attach Jira story link
}
