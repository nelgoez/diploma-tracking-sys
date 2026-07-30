import { getAllAtcs } from './decorators';

const JIRA_URL = process.env.JIRA_URL || 'https://diplo-track-sys.atlassian.net';

export function linkAtcsToAllure(): void {
  const atcs = getAllAtcs();
  for (const atc of atcs) {
    if (atc.story) {
      try {
        // eslint-disable-next-line ts/no-explicit-any
        const a = (globalThis as any).allure;
        if (a) {
          a.tms(atc.story, `${JIRA_URL}/browse/${atc.story}`);
          a.label('story', atc.story);
          if (atc.feature) { a.label('feature', atc.feature); }
          if (atc.label) { a.label('testLabel', atc.label); }
        }
      }
      catch {
        /* allure not available */
      }
    }
  }
}
