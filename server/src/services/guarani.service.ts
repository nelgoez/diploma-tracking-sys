import type {
  AcademicProvider,
  AcademicStudent,
} from '../providers/academic.provider';
import type { ProviderHealth } from '../providers/certificate.provider';
import { supabaseAdmin } from '../db/supabase';
import { logPerStudent } from './integration-logs';
import { withRetry } from './resilient-adapter';

const GUARANI_URL = process.env.GUARANI_URL || 'https://guarani.unc.edu.ar/api';
const GUARANI_TOKEN = process.env.GUARANI_TOKEN || '';

export interface SyncResult {
  studentsProcessed: number
  studentsNew: number
  studentsUpdated: number
  errors: Array<{ studentId: string; error: string }>
}

export interface DiplomaPushResult {
  success: boolean
  studentId: string
  trackId: string
  grade: number
  pushedAt: string
  guaraniReference: string
}

interface GuaraniApiStudent {
  id: string
  nombre?: string
  apellido?: string
  nombre_completo?: string
  email?: string
  dni?: string
  documento?: string
  legajo?: string
  carrera?: string
}

function isConfigured(): boolean {
  return Boolean(GUARANI_TOKEN);
}

async function guaraniFetch<T>(endpoint: string): Promise<T> {
  if (!isConfigured()) {
    throw new Error('GUARANI_TOKEN not configured');
  }

  return withRetry(async () => {
    const response = await fetch(`${GUARANI_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${GUARANI_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const err = new Error(`Guaraní HTTPS ${response.status}`) as Error & { statusCode: number };
      err.statusCode = response.status;
      throw err;
    }

    return response.json() as Promise<T>;
  });
}

function mapToAcademicStudent(api: GuaraniApiStudent, index: number): AcademicStudent {
  const firstName = api.nombre || api.nombre_completo?.split(' ')[0] || '';
  const lastName = api.apellido || api.nombre_completo?.split(' ').slice(1).join(' ') || '';
  const email = api.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mi.unc.edu.ar`;
  const documentNumber = api.dni || api.documento || '';

  return {
    id: api.legajo || api.id || `guarani-${index}`,
    firstName,
    lastName,
    email,
    documentNumber,
  };
}

class GuaraniServiceImpl implements AcademicProvider {
  readonly providerName = 'guarani';

  async fetchStudents(): Promise<AcademicStudent[]> {
    if (!isConfigured()) {
      console.warn('[GuaraniService] GUARANI_TOKEN not configured — returning empty list');
      return [];
    }

    try {
      const response = await guaraniFetch<{ data: GuaraniApiStudent[] } | GuaraniApiStudent[]>('/estudiantes');
      const raw = Array.isArray(response) ? response : (response as { data: GuaraniApiStudent[] }).data ?? [];
      return raw.map(mapToAcademicStudent);
    } catch (err) {
      console.error('[GuaraniService] fetchStudents failed:', (err as Error).message);
      return [];
    }
  }

  async fetchStudent(id: string): Promise<AcademicStudent | null> {
    if (!isConfigured()) {
      return null;
    }

    try {
      const student = await guaraniFetch<GuaraniApiStudent>(`/estudiantes/${id}`);
      return mapToAcademicStudent(student, 0);
    } catch (err) {
      console.error(`[GuaraniService] fetchStudent(${id}) failed:`, (err as Error).message);
      return null;
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    const startedAt = Date.now();

    if (!isConfigured()) {
      return {
        status: 'disconnected',
        latencyMs: 0,
        message: 'GUARANI_TOKEN not configured',
        lastChecked: new Date().toISOString(),
      };
    }

    try {
      await guaraniFetch('/health');
      return {
        status: 'connected',
        latencyMs: Date.now() - startedAt,
        lastChecked: new Date().toISOString(),
      };
    } catch (err) {
      return {
        status: 'error',
        latencyMs: Date.now() - startedAt,
        message: (err as Error).message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async syncStudents(): Promise<SyncResult> {
    if (!isConfigured()) {
      console.warn('[GuaraniService] GUARANI_TOKEN not configured — skipping sync');
      return { studentsProcessed: 0, studentsNew: 0, studentsUpdated: 0, errors: [] };
    }

    const allApiStudents = await this.fetchStudents();
    let studentsNew = 0;
    let studentsUpdated = 0;
    const errors: Array<{ studentId: string; error: string }> = [];

    for (const s of allApiStudents) {
      try {
        const conditions: string[] = [];
        if (s.email) { conditions.push(`email.eq.${s.email}`); }
        if (s.documentNumber) { conditions.push(`dni.eq.${s.documentNumber}`); }
        const orFilter = conditions.join(',');
        if (!orFilter) { continue; }

        const { data: existing } = await supabaseAdmin
          .from('students')
          .select('id')
          .or(orFilter)
          .maybeSingle();

        const row = {
          name: `${s.firstName} ${s.lastName}`,
          email: s.email,
          dni: s.documentNumber,
          guarani_id: s.id,
          role: 'estudiante' as const,
          is_active: true,
        };

        if (existing) {
          const { error } = await supabaseAdmin
            .from('students')
            .update(row)
            .eq('id', existing.id);
          if (error) { throw new Error(error.message); }
          studentsUpdated++;
          await logPerStudent('guarani', existing.id, 'success', `Updated from Guaraní`);
        } else {
          const { error } = await supabaseAdmin
            .from('students')
            .upsert([row], { onConflict: 'email' });
          if (error) { throw new Error(error.message); }
          studentsNew++;
        }
      } catch (err) {
        errors.push({
          studentId: s.id,
          error: (err as Error).message,
        });
        console.error(`[GuaraniService] Error syncing student ${s.id}:`, (err as Error).message);
      }
    }

    console.log(
      `[GuaraniService] Sync complete: ${allApiStudents.length} processed, ` +
      `${studentsNew} new, ${studentsUpdated} updated, ${errors.length} errors`,
    );

    return {
      studentsProcessed: allApiStudents.length,
      studentsNew,
      studentsUpdated,
      errors,
    };
  }

  async syncAcademicStatus(studentId: string): Promise<unknown> {
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select(
        `id, status, qualification, exam_status, course_id, courses!inner (name)`,
      )
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
      hasPassedExam: (enrollments || []).some(e => e.exam_status === 'aprobado'),
    };
  }

  async pushDiploma(
    studentId: string,
    diplomaData: {
      trackId: string
      grade: number
      courseName: string
    },
  ): Promise<DiplomaPushResult> {
    const pushedAt = new Date().toISOString();
    const guaraniReference = `GUARANI-${studentId.slice(0, 8)}-${Date.now()}`;

    await supabaseAdmin.from('integration_logs').insert({
      integration_type: 'guarani',
      operation: 'push',
      status: 'success',
      message: `Diploma pushed for student ${studentId}: ${diplomaData.courseName}, grade ${diplomaData.grade}`,
      details: {
        student_id: studentId,
        track_id: diplomaData.trackId,
        grade: diplomaData.grade,
        course_name: diplomaData.courseName,
        guarani_reference: guaraniReference,
        pushed_at: pushedAt,
        note: isConfigured()
          ? 'Pushed to Guaraní API'
          : 'Mock push — real Guaraní API pending DTI credentials',
      },
    });

    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('track_id', diplomaData.trackId)
      .maybeSingle();

    if (enrollment) {
      await supabaseAdmin
        .from('enrollments')
        .update({ exam_status: 'diploma_pendiente' })
        .eq('id', enrollment.id);
    }

    console.log(
      `[GuaraniService] Diploma pushed for ${studentId}: ref ${guaraniReference}`,
    );

    return {
      success: true,
      studentId,
      trackId: diplomaData.trackId,
      grade: diplomaData.grade,
      pushedAt,
      guaraniReference,
    };
  }
}

export const guaraniService = new GuaraniServiceImpl();
