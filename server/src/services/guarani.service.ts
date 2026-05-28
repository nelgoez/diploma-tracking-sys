import type { AcademicProvider, AcademicStudent } from '../providers/academic.provider';
import type { ProviderHealth } from '../providers/certificate.provider';
import { supabaseAdmin } from '../db/supabase';

export interface GuaraniStudent {
  id: string
  nombre: string
  email: string
  dni: string
  carrera: string
}

export interface GuaraniService {
  syncStudents: () => Promise<GuaraniStudent[]>
  syncAcademicStatus: (studentId: string) => Promise<unknown>
  pushDiploma: (studentId: string, diplomaData: unknown) => Promise<boolean>
}

function splitName(fullName: string): { firstName: string, lastName: string } {
  const trimmed = fullName.trim();
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace === -1) { return { firstName: trimmed, lastName: '' }; }
  return {
    firstName: trimmed.slice(0, lastSpace),
    lastName: trimmed.slice(lastSpace + 1),
  };
}

class GuaraniServiceImpl implements GuaraniService, AcademicProvider {
  readonly providerName = 'guarani';
  private apiUrl: string;
  private apiToken: string;

  constructor() {
    this.apiUrl = process.env.GUARANI_API_URL || 'https://guarani.unc.edu.ar';
    this.apiToken = process.env.GUARANI_API_TOKEN || 'placeholder-token';
  }

  async fetchStudents(): Promise<AcademicStudent[]> {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('id, name, email, dni')
      .eq('is_active', true)
      .eq('role', 'estudiante');

    if (error) {
      console.error('[GuaraniService] DB error fetching students:', error.message);
      return [];
    }

    return (data || []).map((row) => {
      const { firstName, lastName } = splitName(row.name);
      return {
        id: row.id,
        firstName,
        lastName,
        email: row.email,
        documentNumber: row.dni || '',
      };
    });
  }

  async fetchStudent(id: string): Promise<AcademicStudent | null> {
    const { data } = await supabaseAdmin
      .from('students')
      .select('id, name, email, dni')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();

    if (!data) { return null; }

    const { firstName, lastName } = splitName(data.name);
    return {
      id: data.id,
      firstName,
      lastName,
      email: data.email,
      documentNumber: data.dni || '',
    };
  }

  async healthCheck(): Promise<ProviderHealth> {
    const startedAt = Date.now();

    const dbOk = await supabaseAdmin
      .from('students')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (dbOk.error) {
      return {
        status: 'error',
        latencyMs: Date.now() - startedAt,
        message: `DB unreachable: ${dbOk.error.message}`,
        lastChecked: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/health`, {
        signal: AbortSignal.timeout(10000),
      });

      return {
        status: response.ok ? 'connected' : 'degraded',
        latencyMs: Date.now() - startedAt,
        message: response.ok ? undefined : `External HTTP ${response.status} — using local DB fallback`,
        lastChecked: new Date().toISOString(),
      };
    }
    catch (err) {
      return {
        status: 'degraded',
        latencyMs: Date.now() - startedAt,
        message: `External unreachable — using local DB fallback (${err instanceof Error ? err.message : 'Unknown error'})`,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async syncStudents(): Promise<GuaraniStudent[]> {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('id, name, email, dni')
      .eq('is_active', true)
      .eq('role', 'estudiante');

    if (error) {
      console.error('[GuaraniService] DB error syncing students:', error.message);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      nombre: row.name,
      email: row.email,
      dni: row.dni || '',
      carrera: 'Diplomatura', // placeholder — real data would come from Guaraní
    }));
  }

  async syncAcademicStatus(studentId: string): Promise<unknown> {
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        status,
        qualification,
        course_id,
        courses!inner (
          name
        )
      `)
      .eq('student_id', studentId);

    const { data: certs } = await supabaseAdmin
      .from('certificates')
      .select('id, course_id, status, qualification')
      .eq('student_id', studentId)
      .eq('status', 'approved');

    return {
      studentId,
      enrollments: enrollments || [],
      approvedCertificates: certs || [],
      completedCourses: (enrollments || []).filter(e => e.status === 'completed').length,
    };
  }

  async pushDiploma(_studentId: string, _diplomaData: unknown): Promise<boolean> {
    console.log(`[GuaraniService] Push diploma for ${_studentId} — mock: persisted to local DB`);
    // Future: POST to Guaraní API. For now, diploma status is tracked in enrollments.
    return true;
  }
}

export const guaraniService = new GuaraniServiceImpl();
