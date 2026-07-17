import type {
  Certificate,
  CertificateProvider,
  ProviderHealth,
} from '../providers/certificate.provider';
import { supabaseAdmin } from '../db/supabase';
import { getMockCertificatesForStudent } from './mock-data';

const isMockMode = (): boolean => process.env.MOCK_MODE === 'true';

export interface MoodleCertificate {
  id: string
  studentId: string
  courseId: string
  courseName: string
  issueDate: string
  qualification?: number
}

export interface StudentCertDetail {
  studentId: string
  newCount: number
  newCourseNames: string[]
}

export interface SyncCertificatesResult {
  certificates: MoodleCertificate[]
  certificatesNew: number
  certificatesUpdated: number
  affectedStudentIds: string[]
  studentCertDetails: StudentCertDetail[]
}

export interface MoodleService {
  syncCertificates: () => Promise<SyncCertificatesResult>
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

let cachedToken: string | null = null;

async function getMoodleToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const user = process.env.MOODLE_ADMIN_USER;
  const pass = process.env.MOODLE_ADMIN_PASS;
  const base = process.env.MOODLE_API_URL || 'https://campus.aulavirtual.unc.edu.ar';

  if (user && pass) {
    try {
      const url = `${base}/login/token.php?${new URLSearchParams({
        username: user,
        password: pass,
        service: 'moodle_mobile_app',
      }).toString()}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const json = await res.json() as { token?: string, error?: string };
      if (json.token) {
        cachedToken = json.token;
        return json.token;
      }
      console.warn('[Moodle] login/token.php failed:', json.error);
    }
    catch (err) {
      console.warn('[Moodle] login/token.php error:', (err as Error).message);
    }
  }

  const fallback = process.env.MOODLE_API_TOKEN;
  if (fallback) return fallback;

  throw new Error('No Moodle token available — set MOODLE_ADMIN_USER/PASS or MOODLE_API_TOKEN');
}

function moodleApiUrl(functionName: string, params: Record<string, string> = {}): string {
  const base = process.env.MOODLE_API_URL || 'https://campus.aulavirtual.unc.edu.ar';
  const qs = new URLSearchParams({
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
    let url: string;
    if (retries === 0) {
      const token = await getMoodleToken();
      url = moodleApiUrl(functionName, { ...params, wstoken: token });
    } else {
      // On retry, clear cached token (may have expired) and re-fetch
      cachedToken = null;
      const token = await getMoodleToken();
      url = moodleApiUrl(functionName, { ...params, wstoken: token });
    }
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
): Promise<{ completed: boolean, timecompleted: number | null, criteriaSet: boolean }> {
  try {
    const data = await moodleFetch<{
      completionstatus: { completed: boolean, timecompleted: number | null }
    }>(
      'core_completion_get_course_completion_status',
      { userid: String(userId), courseid: String(courseId) },
    );
    return {
      completed: data.completionstatus?.completed ?? false,
      timecompleted: data.completionstatus?.timecompleted ?? null,
      criteriaSet: true,
    };
  }
  catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('nocriteriaset')) {
      return { completed: false, timecompleted: null, criteriaSet: false };
    }
    throw err;
  }
}

async function getActivityCompletionForCourse(
  userId: number,
  courseId: number,
): Promise<{ totalActivities: number, completedActivities: number, isComplete: boolean }> {
  const data = await moodleFetch<{
    statuses: Array<{
      cmid: number
      state: number
      tracking: number
      hascompletion: boolean
      isoverallcomplete: boolean
    }>
  }>(
    'core_completion_get_activities_completion_status',
    { userid: String(userId), courseid: String(courseId) },
  );

  const tracked = (data.statuses || []).filter(s => s.hascompletion);
  const completed = tracked.filter(s => s.state === 1);

  return {
    totalActivities: tracked.length,
    completedActivities: completed.length,
    isComplete: tracked.length > 0 && completed.length === tracked.length,
  };
}

class MoodleServiceImpl implements MoodleService, CertificateProvider {
  readonly providerName = 'moodle';
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.MOODLE_API_URL || 'https://campus.aulavirtual.unc.edu.ar';
  }

  async fetchCertificates(studentId: string): Promise<Certificate[]> {
    if (isMockMode()) {
      console.log(`[MoodleService] Mock mode — returning demo certificates for student ${studentId}`);
      return getMockCertificatesForStudent(studentId);
    }

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
      console.warn(
        `[MoodleService] Failed to find Moodle user for ${student.email}: ${(err as Error).message}. Token may be student-scoped — admin token needed for multi-user sync.`,
      );
      return [];
    }

    if (!moodleUser) {
      console.warn(
        `[MoodleService] No Moodle account for ${student.email}. Token scope may restrict cross-user lookup.`,
      );
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
        let isComplete = completion.completed;

        if (!completion.criteriaSet && !isComplete) {
          const activities = await getActivityCompletionForCourse(moodleUser.id, course.id);
          isComplete = activities.isComplete;
          if (isComplete) {
            console.log(
              `[MoodleService] Course ${course.id} has no completion criteria but all ${activities.totalActivities} activities are done — inferring completion`,
            );
          }
        }

        if (isComplete) {
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
    if (isMockMode()) { return true; }
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

    if (isMockMode()) {
      return {
        status: 'connected',
        latencyMs: Date.now() - startedAt,
        message: 'Campus Virtual (mock mode — demo)',
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

  async syncCertificates(): Promise<SyncCertificatesResult> {
    const { data: students, error: studentsErr } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('is_active', true)
      .eq('role', 'estudiante');

    if (studentsErr || !students?.length) {
      console.error('[MoodleService] No active students found');
      return { certificates: [], certificatesNew: 0, certificatesUpdated: 0, affectedStudentIds: [], studentCertDetails: [] };
    }

    const { data: mappedCourses } = await supabaseAdmin
      .from('courses')
      .select('id, moodle_course_id')
      .not('moodle_course_id', 'is', null);
    const moodleToLocal = new Map<string, string>();
    for (const c of mappedCourses || []) {
      if (c.moodle_course_id) { moodleToLocal.set(c.moodle_course_id, c.id); }
    }

    if (isMockMode()) {
      const { data: allCourses } = await supabaseAdmin
        .from('courses')
        .select('id, code')
        .not('code', 'is', null);
      for (const c of allCourses || []) {
        if (c.code && !moodleToLocal.has(c.code)) {
          moodleToLocal.set(c.code, c.id);
        }
      }
      console.log(`[MoodleService] Mock mode — expanded course map to ${moodleToLocal.size} entries (by code)`);
    }

    const results: MoodleCertificate[] = [];
    const BATCH_SIZE = process.env.VERCEL ? 5 : 50;
    let totalProcessed = 0;
    let totalErrors = 0;
    let certificatesNew = 0;
    let certificatesUpdated = 0;
    const affectedStudentIds = new Set<string>();
    const studentDetailsMap = new Map<string, { newCount: number, newCourseNames: string[] }>();

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);

      for (const student of batch) {
        try {
          const { data: existingCerts } = await supabaseAdmin
            .from('certificates')
            .select('course_id')
            .eq('student_id', student.id);
          const existingCourseIds = new Set((existingCerts || []).map(c => c.course_id));

          const certs = await this.fetchCertificates(student.id);
          totalProcessed++;

          const mappedCerts = certs
            .map((cert) => {
              const moodleIdnumber = cert.metadata?.moodleIdnumber as string | undefined;
              const localCourseId = moodleIdnumber ? moodleToLocal.get(moodleIdnumber) : undefined;
              if (!localCourseId) {
                console.warn(`[MoodleService] No local course mapping for Moodle course idnumber="${moodleIdnumber || 'unknown'}" (${cert.courseName}). Add moodle_course_id to courses table.`);
                return null;
              }
              return { ...cert, courseId: localCourseId };
            })
            .filter((c): c is Certificate => c !== null);

          if (mappedCerts.length === 0) { continue; }

          const certRows = mappedCerts.map(cert => ({
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

          const studentNewCourseIds: string[] = [];
          for (const row of certRows) {
            if (existingCourseIds.has(row.course_id)) {
              certificatesUpdated++;
            }
            else {
              certificatesNew++;
              studentNewCourseIds.push(row.course_id);
            }
          }
          affectedStudentIds.add(student.id);

          const courseIds = [...new Set(upserted.map(c => c.course_id))];
          const { data: courseData } = await supabaseAdmin
            .from('courses')
            .select('id, name')
            .in('id', courseIds);

          const courseMap = new Map<string, string>();
          for (const c of courseData || []) {
            courseMap.set(c.id, c.name);
          }

          if (studentNewCourseIds.length > 0) {
            const names = studentNewCourseIds.map(cid => courseMap.get(cid) || cid);
            if (studentDetailsMap.has(student.id)) {
              const existing = studentDetailsMap.get(student.id)!;
              existing.newCount += studentNewCourseIds.length;
              existing.newCourseNames.push(...names);
            }
            else {
              studentDetailsMap.set(student.id, {
                newCount: studentNewCourseIds.length,
                newCourseNames: names,
              });
            }
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
        }
      }
    }

    console.log(
      `[MoodleService] Sync complete: ${totalProcessed} students processed, ${totalErrors} errors, ${results.length} certificates upserted (${certificatesNew} new, ${certificatesUpdated} updated)`,
    );

    return {
      certificates: results,
      certificatesNew,
      certificatesUpdated,
      affectedStudentIds: [...affectedStudentIds],
      studentCertDetails: [...studentDetailsMap.entries()].map(([studentId, details]) => ({
        studentId,
        ...details,
      })),
    };
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
