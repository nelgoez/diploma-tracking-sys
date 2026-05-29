import type {
  Certificate,
  CertificateProvider,
  ProviderHealth,
} from '../providers/certificate.provider';
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

interface MoodleUser {
  id: number
  username: string
  email: string
  firstname: string
  lastname: string
}

interface MoodleCourse {
  id: number
  shortname: string
  fullname: string
  idnumber: string
  progress: number | null
  completed: boolean
}

function moodleApiUrl(functionName: string, params: Record<string, string> = {}): string {
  const base = process.env.MOODLE_API_URL || 'https://campus.aulavirtual.unc.edu.ar';
  const token = process.env.MOODLE_API_TOKEN || 'placeholder-token';
  const qs = new URLSearchParams({
    wstoken: token,
    wsfunction: functionName,
    moodlewsrestformat: 'json',
    ...params,
  });
  return `${base}/webservice/rest/server.php?${qs.toString()}`;
}

async function moodleFetch<T>(
  functionName: string,
  params: Record<string, string> = {},
  retries = 0,
): Promise<T> {
  const maxRetries = 3;
  const retryDelays = [1000, 4000, 9000];

  try {
    const url = moodleApiUrl(functionName, params);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Moodle HTTPS ${response.status}`);
    }

    const json = (await response.json()) as T;

    const err = json as { exception?: string, errorcode?: string, message?: string };
    if (err?.exception || err?.errorcode) {
      throw new Error(`Moodle API: ${err.message || err.exception || err.errorcode}`);
    }

    return json;
  }
  catch (err) {
    if (retries < maxRetries) {
      await new Promise(r => setTimeout(r, retryDelays[retries]));
      return moodleFetch<T>(functionName, params, retries + 1);
    }
    throw err;
  }
}

async function findMoodleUserByEmail(email: string): Promise<MoodleUser | null> {
  const data = await moodleFetch<{ users: MoodleUser[] }>(
    'core_user_get_users_by_field',
    { 'field': 'email', 'values[0]': email },
  );
  return data.users?.[0] ?? null;
}

async function getMoodleUserCourses(userId: number): Promise<MoodleCourse[]> {
  const data = await moodleFetch<MoodleCourse[]>(
    'core_enrol_get_users_courses',
    { userid: String(userId) },
  );
  return Array.isArray(data) ? data : [];
}

async function getCourseCompletionStatus(
  userId: number,
  courseId: number,
): Promise<{ completed: boolean, timecompleted: number | null }> {
  const data = await moodleFetch<{
    completionstatus: { completed: boolean, timecompleted: number | null }
  }>(
    'core_completion_get_course_completion_status',
    { userid: String(userId), courseid: String(courseId) },
  );
  return data.completionstatus ?? { completed: false, timecompleted: null };
}

class MoodleServiceImpl implements MoodleService, CertificateProvider {
  readonly providerName = 'moodle';
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.MOODLE_API_URL || 'https://campus.aulavirtual.unc.edu.ar';
  }

  async fetchCertificates(studentId: string): Promise<Certificate[]> {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('email, name')
      .eq('id', studentId)
      .single();

    if (!student?.email) {
      console.warn(`[MoodleService] No email for student ${studentId}`);
      return [];
    }

    let moodleUser: MoodleUser | null = null;
    try {
      moodleUser = await findMoodleUserByEmail(student.email);
    }
    catch (err) {
      console.error(
        `[MoodleService] Failed to find Moodle user for ${student.email}:`,
        (err as Error).message,
      );
      throw err;
    }

    if (!moodleUser) {
      console.warn(`[MoodleService] No Moodle account for ${student.email}`);
      return [];
    }

    let courses: MoodleCourse[] = [];
    try {
      courses = await getMoodleUserCourses(moodleUser.id);
    }
    catch (err) {
      console.error(
        `[MoodleService] Failed to fetch courses for Moodle user ${moodleUser.id}:`,
        (err as Error).message,
      );
      throw err;
    }

    const certificates: Certificate[] = [];

    for (const course of courses) {
      try {
        const completion = await getCourseCompletionStatus(moodleUser.id, course.id);
        if (completion.completed) {
          const completedAt = completion.timecompleted
            ? new Date(completion.timecompleted * 1000).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

          certificates.push({
            id: crypto.randomUUID(),
            studentId,
            courseId: String(course.id),
            courseName: course.fullname,
            issueDate: completedAt,
            externalId: `moodle-${course.id}-${moodleUser.id}`,
            metadata: {
              moodleCourseId: course.id,
              moodleShortname: course.shortname,
              moodleIdnumber: course.idnumber,
            },
          });
        }
      }
      catch (err) {
        console.error(
          `[MoodleService] Failed to check completion for course ${course.id}:`,
          (err as Error).message,
        );
        // per-course error isolation — continue with next course
      }
    }

    return certificates;
  }

  async validateCertificate(externalId: string): Promise<boolean> {
    if (!externalId) { return false; }

    try {
      await moodleFetch('core_webservice_get_site_info');
      return true;
    }
    catch {
      return false;
    }
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
      const data = await moodleFetch<{ sitename?: string }>('core_webservice_get_site_info');

      return {
        status: data.sitename ? 'connected' : 'degraded',
        latencyMs: Date.now() - startedAt,
        message: data.sitename ?? undefined,
        lastChecked: new Date().toISOString(),
      };
    }
    catch (err) {
      return {
        status: 'degraded',
        latencyMs: Date.now() - startedAt,
        message: `External unreachable — ${(err as Error).message}`,
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
    const BATCH_SIZE = 50;
    let totalProcessed = 0;
    let totalErrors = 0;

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);

      for (const student of batch) {
        try {
          const certs = await this.fetchCertificates(student.id);
          totalProcessed++;

          if (certs.length === 0) { continue; }

          const certRows = certs.map(cert => ({
            student_id: cert.studentId,
            course_id: cert.courseId,
            moodle_certificate_id: cert.externalId ?? null,
            issue_date: cert.issueDate,
            status: 'approved' as const,
            qualification: cert.qualification ?? null,
            is_valid: true,
          }));

          const { data: upserted } = await supabaseAdmin
            .from('certificates')
            .upsert(certRows, {
              onConflict: 'student_id,course_id',
              ignoreDuplicates: false,
            })
            .select('id, student_id, course_id, issue_date, qualification');

          if (!upserted) { continue; }

          const courseIds = [...new Set(upserted.map(c => c.course_id))];
          const { data: courseData } = await supabaseAdmin
            .from('courses')
            .select('id, name')
            .in('id', courseIds);

          const courseMap = new Map<string, string>();
          for (const c of courseData || []) {
            courseMap.set(c.id, c.name);
          }

          for (const cert of upserted) {
            results.push({
              id: cert.id,
              studentId: cert.student_id,
              courseId: cert.course_id,
              courseName: courseMap.get(cert.course_id) || '',
              issueDate: cert.issue_date,
              qualification: cert.qualification ?? undefined,
            });
          }
        }
        catch (err) {
          totalErrors++;
          console.error(
            `[MoodleService] Error syncing student ${student.id}:`,
            (err as Error).message,
          );
          // per-student error isolation — continue with next student
        }
      }
    }

    console.log(
      `[MoodleService] Sync complete: ${totalProcessed} students processed, ${totalErrors} errors, ${results.length} certificates upserted`,
    );

    return results;
  }

  async getStudentProgress(studentId: string): Promise<unknown> {
    const { data: certs } = await supabaseAdmin
      .from('certificates')
      .select('id, course_id, status, qualification, issue_date')
      .eq('student_id', studentId);

    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select(
        `
        id,
        course_id,
        status,
        qualification,
        courses!inner (
          name
        )
      `,
      )
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
