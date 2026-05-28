import type { AcademicProvider, AcademicStudent } from '../providers/academic.provider';
import type { ProviderHealth } from '../providers/certificate.provider';

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

class GuaraniServiceImpl implements GuaraniService, AcademicProvider {
  readonly providerName = 'guarani';
  private apiUrl: string;
  private apiToken: string;

  constructor() {
    this.apiUrl = process.env.GUARANI_API_URL || 'https://guarani.unc.edu.ar';
    this.apiToken = process.env.GUARANI_API_TOKEN || 'placeholder-token';
  }

  async fetchStudents(): Promise<AcademicStudent[]> {
    console.log('[GuaraniService] Fetch students from registry');
    // TODO: Implement actual Guaraní API call
    return [];
  }

  async fetchStudent(id: string): Promise<AcademicStudent | null> {
    console.log(`[GuaraniService] Fetch student ${id}`);
    // TODO: Implement actual Guaraní API call
    return null;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const startedAt = Date.now();
    try {
      const response = await fetch(`${this.apiUrl}/api/health`, {
        signal: AbortSignal.timeout(10000),
      });

      return {
        status: response.ok ? 'connected' : 'error',
        latencyMs: Date.now() - startedAt,
        message: response.ok ? undefined : `HTTP ${response.status}`,
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

  async syncStudents(): Promise<GuaraniStudent[]> {
    console.log('[GuaraniService] Sync students');
    // TODO: Implement actual Guaraní API call
    return [];
  }

  async syncAcademicStatus(studentId: string): Promise<unknown> {
    console.log(`[GuaraniService] Sync academic status for ${studentId}`);
    // TODO: Implement actual Guaraní API call
    return {};
  }

  async pushDiploma(studentId: string, _diplomaData: unknown): Promise<boolean> {
    console.log(`[GuaraniService] Push diploma for ${studentId}`);
    // TODO: Implement actual Guaraní API call
    return true;
  }
}

export const guaraniService = new GuaraniServiceImpl();
