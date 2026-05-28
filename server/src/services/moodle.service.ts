import type { Certificate, CertificateProvider, ProviderHealth } from '../providers/certificate.provider';
import { supabaseAdmin } from '../db/supabase';

export interface MoodleCertificate {
  id: string
  studentId: string
  courseId: string
  courseName: string
  issueDate: string
  qualification?: number
}

export interface MoodleService {
  syncCertificates: () => Promise<MoodleCertificate[]>
  getStudentProgress: (studentId: string) => Promise<unknown>
  getCourseInfo: (courseId: string) => Promise<unknown>
}

class MoodleServiceImpl implements MoodleService, CertificateProvider {
  readonly providerName = 'moodle';
  private apiUrl: string;
  private apiToken: string;

  constructor() {
    this.apiUrl = process.env.MOODLE_API_URL || 'https://moodle.unc.edu.ar';
    this.apiToken = process.env.MOODLE_API_TOKEN || 'placeholder-token';
  }

  async fetchCertificates(studentId: string): Promise<Certificate[]> {
    const { data: certs, error } = await supabaseAdmin
      .from('certificates')
      .select(`
        id,
        student_id,
        course_id,
        issue_date,
        qualification,
        moodle_certificate_id,
        courses!inner (
          name
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'approved');

    if (error) {
      console.error(`[MoodleService] DB error fetching certificates for ${studentId}:`, error.message);
      return [];
    }

    return (certs || []).map(row => ({
      id: row.id,
      studentId: row.student_id,
      courseId: row.course_id,
      courseName: Array.isArray(row.courses) ? row.courses[0]?.name || '' : (row.courses as unknown as { name: string })?.name || '',
      issueDate: row.issue_date,
      qualification: row.qualification ?? undefined,
      externalId: row.moodle_certificate_id ?? undefined,
    }));
  }

  async validateCertificate(externalId: string): Promise<boolean> {
    if (!externalId) { return false; }
    const { data } = await supabaseAdmin
      .from('certificates')
      .select('id')
      .eq('moodle_certificate_id', externalId)
      .eq('status', 'approved')
      .maybeSingle();
    return data !== null;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const startedAt = Date.now();

    const dbOk = await supabaseAdmin
      .from('certificates')
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
      const response = await fetch(
        `${this.apiUrl}/webservice/rest/server.php?wstoken=${this.apiToken}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`,
        { signal: AbortSignal.timeout(10000) },
      );

      if (!response.ok) {
        return {
          status: 'degraded',
          latencyMs: Date.now() - startedAt,
          message: `External Moodle HTTPS ${response.status} — using local DB fallback`,
          lastChecked: new Date().toISOString(),
        };
      }

      const data = await response.json() as { sitename?: string };
      return {
        status: data.sitename ? 'connected' : 'degraded',
        latencyMs: Date.now() - startedAt,
        message: data.sitename ? undefined : 'No sitename — using local DB fallback',
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

  async syncCertificates(): Promise<MoodleCertificate[]> {
    const { data: students, error: studentsErr } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('is_active', true)
      .eq('role', 'estudiante');

    if (studentsErr || !students?.length) {
      console.error('[MoodleService] No active students found');
      return [];
    }

    const results: MoodleCertificate[] = [];

    for (const student of students) {
      const certs = await this.fetchCertificates(student.id);
      for (const cert of certs) {
        results.push({
          id: cert.id,
          studentId: cert.studentId,
          courseId: cert.courseId,
          courseName: cert.courseName,
          issueDate: cert.issueDate,
          qualification: cert.qualification,
        });
      }
    }

    return results;
  }

  async getStudentProgress(studentId: string): Promise<unknown> {
    const { data: certs } = await supabaseAdmin
      .from('certificates')
      .select('id, course_id, status, qualification, issue_date')
      .eq('student_id', studentId);

    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        course_id,
        status,
        qualification,
        courses!inner (
          name
        )
      `)
      .eq('student_id', studentId);

    return {
      studentId,
      certificates: certs || [],
      enrollments: enrollments || [],
      completedCourses: (certs || []).filter(c => c.status === 'approved').length,
      totalCourses: (certs || []).length,
    };
  }

  async getCourseInfo(courseId: string): Promise<unknown> {
    const { data } = await supabaseAdmin
      .from('courses')
      .select('id, name, code, credits, order_index, is_active')
      .eq('id', courseId)
      .maybeSingle();

    return data || {};
  }
}

export const moodleService = new MoodleServiceImpl();
