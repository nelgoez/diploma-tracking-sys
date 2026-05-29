import type {
  AcademicProvider,
  AcademicStudent,
} from '../providers/academic.provider';
import type { ProviderHealth } from '../providers/certificate.provider';
import { supabaseAdmin } from '../db/supabase';

export interface GuaraniStudent {
  id: string
  nombre: string
  email: string
  dni: string
  carrera: string
}

export interface DiplomaPushResult {
  success: boolean
  studentId: string
  trackId: string
  grade: number
  pushedAt: string
  guaraniReference: string
}

export interface GuaraniService {
  syncStudents: () => Promise<GuaraniStudent[]>
  syncAcademicStatus: (studentId: string) => Promise<unknown>
  pushDiploma: (
    studentId: string,
    diplomaData: {
      trackId: string
      grade: number
      courseName: string
    },
  ) => Promise<DiplomaPushResult>
}

const MOCK_STUDENT_POOL: Array<{
  firstName: string
  lastName: string
  dni: string
}> = [
  { firstName: 'María Laura', lastName: 'Fernández', dni: '28456789' },
  { firstName: 'Carlos Alberto', lastName: 'Rodríguez', dni: '31234567' },
  { firstName: 'Ana Belén', lastName: 'Martínez', dni: '35678901' },
  { firstName: 'Juan Pablo', lastName: 'González', dni: '27456123' },
  { firstName: 'Lucía Victoria', lastName: 'Sánchez', dni: '39876543' },
  { firstName: 'Federico Andrés', lastName: 'López', dni: '33456987' },
  { firstName: 'Valentina Sofía', lastName: 'Díaz', dni: '40789123' },
  { firstName: 'Martín Nicolás', lastName: 'Pérez', dni: '29876541' },
  { firstName: 'Camila Andrea', lastName: 'Romero', dni: '38123456' },
  { firstName: 'Santiago Javier', lastName: 'Torres', dni: '31567890' },
];

class GuaraniServiceImpl implements GuaraniService, AcademicProvider {
  readonly providerName = 'guarani';
  private apiUrl: string;
  private apiToken: string;

  constructor() {
    this.apiUrl = process.env.GUARANI_API_URL || 'https://guarani.unc.edu.ar';
    this.apiToken = process.env.GUARANI_API_TOKEN || 'placeholder-token';
  }

  async fetchStudents(): Promise<AcademicStudent[]> {
    return MOCK_STUDENT_POOL.map(m => ({
      id: `guarani-${m.dni}`,
      firstName: m.firstName,
      lastName: m.lastName,
      email: `${m.firstName.toLowerCase().replace(/\s+/g, '.')}.${m.lastName.toLowerCase()}@mi.unc.edu.ar`,
      documentNumber: m.dni,
    }));
  }

  async fetchStudent(id: string): Promise<AcademicStudent | null> {
    const mock = MOCK_STUDENT_POOL.find(
      m => `guarani-${m.dni}` === id,
    );
    if (!mock) { return null; }

    return {
      id,
      firstName: mock.firstName,
      lastName: mock.lastName,
      email: `${mock.firstName.toLowerCase().replace(/\s+/g, '.')}.${mock.lastName.toLowerCase()}@mi.unc.edu.ar`,
      documentNumber: mock.dni,
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
        message: response.ok
          ? undefined
          : `External HTTP ${response.status} — using mock data`,
        lastChecked: new Date().toISOString(),
      };
    }
    catch (err) {
      return {
        status: 'degraded',
        latencyMs: Date.now() - startedAt,
        message: `Guaraní API unreachable — using mock data (${err instanceof Error ? err.message : 'Unknown error'})`,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async syncStudents(): Promise<GuaraniStudent[]> {
    const allApiStudents = await this.fetchStudents();

    const rows = allApiStudents.map(s => ({
      name: `${s.firstName} ${s.lastName}`,
      email: s.email,
      dni: s.documentNumber,
      guarani_id: s.id,
      role: 'estudiante' as const,
      is_active: true,
    }));

    const { error } = await supabaseAdmin
      .from('students')
      .upsert(rows, {
        onConflict: 'email',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('[GuaraniService] Failed to upsert students:', error.message);
    }

    return allApiStudents.map(s => ({
      id: s.id,
      nombre: `${s.firstName} ${s.lastName}`,
      email: s.email,
      dni: s.documentNumber,
      carrera: 'Diplomatura Universitaria',
    }));
  }

  async syncAcademicStatus(studentId: string): Promise<unknown> {
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select(
        `
        id,
        status,
        qualification,
        exam_status,
        course_id,
        courses!inner (
          name
        )
      `,
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
      completedCourses:
        (enrollments || []).filter(e => e.status === 'completed').length,
      hasPassedExam: (enrollments || []).some(
        e => e.exam_status === 'aprobado',
      ),
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
        note: 'Mock push — real Guaraní API pending DTI credentials',
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
