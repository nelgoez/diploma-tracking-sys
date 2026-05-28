import type { Certificate, CertificateProvider, ProviderHealth } from '../providers/certificate.provider';

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
    console.log(`[MoodleService] Fetch certificates for student ${studentId}`);
    // TODO: Implement actual Moodle API call
    // GET /webservice/rest/server.php?wstoken={token}&wsfunction=...
    // Map Moodle response to Certificate[]
    return [];
  }

  async validateCertificate(externalId: string): Promise<boolean> {
    console.log(`[MoodleService] Validate certificate ${externalId}`);
    // TODO: Check certificate still exists in Moodle
    return true;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const startedAt = Date.now();
    try {
      const response = await fetch(`${this.apiUrl}/webservice/rest/server.php?wstoken=${this.apiToken}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return {
          status: 'error',
          latencyMs: Date.now() - startedAt,
          message: `HTTP ${response.status}`,
          lastChecked: new Date().toISOString(),
        };
      }

      const data = await response.json() as { sitename?: string };
      return {
        status: data.sitename ? 'connected' : 'error',
        latencyMs: Date.now() - startedAt,
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

  async syncCertificates(): Promise<MoodleCertificate[]> {
    console.log('[MoodleService] Sync certificates');
    // TODO: Batch fetch all active students' certificates
    // Uses fetchCertificates() per student, upserts to DB
    return [];
  }

  async getStudentProgress(studentId: string): Promise<unknown> {
    console.log(`[MoodleService] Get progress for student ${studentId}`);
    // TODO: Implement actual Moodle API call
    return {};
  }

  async getCourseInfo(courseId: string): Promise<unknown> {
    console.log(`[MoodleService] Get course info ${courseId}`);
    // TODO: Implement actual Moodle API call
    return {};
  }
}

export const moodleService = new MoodleServiceImpl();
