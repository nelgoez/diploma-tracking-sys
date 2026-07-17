import type { AcademicProvider, AcademicStudent } from './academic.provider';
import type { ProviderHealth } from './certificate.provider';
import { supabaseAdmin } from '../db/supabase';

interface MoodleUser {
  id: number
  username: string
  email: string
  firstname: string
  lastname: string
}

async function moodleFetch<T>(
  functionName: string,
  params: Record<string, string> = {},
): Promise<T> {
  const base = process.env.MOODLE_API_URL || 'https://campus.aulavirtual.unc.edu.ar';
  const token = process.env.MOODLE_API_TOKEN;

  if (!token) {
    throw new Error('MOODLE_API_TOKEN not configured for academic provider');
  }

  const qs = new URLSearchParams({
    wstoken: token,
    wsfunction: functionName,
    moodlewsrestformat: 'json',
    ...params,
  }).toString();

  const res = await fetch(`${base}/webservice/rest/server.php?${qs}`, {
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Moodle HTTP ${res.status}`);
  }

  const json = await res.json() as Record<string, unknown>;
  const err = json as { exception?: string, errorcode?: string, message?: string };
  if (err?.exception || err?.errorcode) {
    throw new Error(`Moodle API: ${err.message || err.exception || err.errorcode}`);
  }

  return json as T;
}

function isMockMode(): boolean {
  return process.env.MOCK_MODE === 'true';
}

export class MoodleAcademicProvider implements AcademicProvider {
  readonly providerName = 'moodle-academic';

  async fetchStudents(): Promise<AcademicStudent[]> {
    if (isMockMode()) {
      return [
        { id: 'mock-1', firstName: 'Juan', lastName: 'Pérez', email: 'juan.perez@mi.unc.edu.ar', documentNumber: '40123456' },
        { id: 'mock-2', firstName: 'María', lastName: 'García', email: 'maria.garcia@mi.unc.edu.ar', documentNumber: '40234567' },
        { id: 'mock-3', firstName: 'Carlos', lastName: 'López', email: 'carlos.lopez@mi.unc.edu.ar', documentNumber: '40345678' },
      ];
    }

    const { data: existing } = await supabaseAdmin
      .from('students')
      .select('email')
      .limit(500);

    const emails = (existing || []).map(r => (r as Record<string, unknown>).email as string).filter(Boolean);
    const students: AcademicStudent[] = [];

    for (let i = 0; i < emails.length; i += 5) {
      const batch = emails.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(email => this.fetchStudentByEmail(email)),
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          students.push(result.value);
        }
      }
    }

    return students;
  }

  async fetchStudent(id: string): Promise<AcademicStudent | null> {
    if (isMockMode()) {
      return { id, firstName: 'Juan', lastName: 'Pérez', email: 'juan.perez@mi.unc.edu.ar', documentNumber: '40123456' };
    }

    const { data } = await supabaseAdmin
      .from('students')
      .select('email')
      .eq('id', id)
      .single();

    if (!data) { return null; }

    return this.fetchStudentByEmail((data as Record<string, unknown>).email as string);
  }

  private async fetchStudentByEmail(email: string): Promise<AcademicStudent | null> {
    try {
      const data = await moodleFetch<{ users: MoodleUser[] }>(
        'core_user_get_users_by_field',
        { 'field': 'email', 'values[0]': email },
      );

      const user = data.users?.[0];
      if (!user) { return null; }

      return {
        id: String(user.id),
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.email,
        documentNumber: user.username,
      };
    }
    catch {
      return null;
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    const startedAt = Date.now();

    if (isMockMode()) {
      return {
        status: 'connected',
        latencyMs: Date.now() - startedAt,
        message: 'Moodle Academic Provider (mock mode)',
        lastChecked: new Date().toISOString(),
      };
    }

    try {
      await moodleFetch<{ sitename?: string }>('core_webservice_get_site_info');
      return {
        status: 'connected',
        latencyMs: Date.now() - startedAt,
        message: 'Campus Virtual UNC (academic data via Moodle)',
        lastChecked: new Date().toISOString(),
      };
    }
    catch (err) {
      return {
        status: 'disconnected',
        latencyMs: Date.now() - startedAt,
        message: err instanceof Error ? err.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  }
}
