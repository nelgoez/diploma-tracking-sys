// Placeholder service for Guaraní integration
// TODO: Implement actual Guaraní API integration

export interface GuaraniStudent {
  id: string;
  nombre: string;
  email: string;
  dni: string;
  carrera: string;
}

export interface GuaraniService {
  syncStudents(): Promise<GuaraniStudent[]>;
  syncAcademicStatus(studentId: string): Promise<unknown>;
  pushDiploma(studentId: string, diplomaData: unknown): Promise<boolean>;
}

class GuaraniServiceImpl implements GuaraniService {
  private apiUrl: string;
  private apiToken: string;

  constructor() {
    this.apiUrl = process.env.GUARANI_API_URL || "https://guarani.unc.edu.ar";
    this.apiToken = process.env.GUARANI_API_TOKEN || "placeholder-token";
  }

  async syncStudents(): Promise<GuaraniStudent[]> {
    console.log("[GuaraniService] Sync students - placeholder");
    // TODO: Implement actual Guaraní API call
    // GET /api/alumnos
    return [];
  }

  async syncAcademicStatus(studentId: string): Promise<unknown> {
    console.log(`[GuaraniService] Sync academic status for ${studentId} - placeholder`);
    // TODO: Implement actual Guaraní API call
    return {};
  }

  async pushDiploma(studentId: string, diplomaData: unknown): Promise<boolean> {
    console.log(`[GuaraniService] Push diploma for ${studentId} - placeholder`);
    // TODO: Implement actual Guaraní API call
    // POST /api/diplomas
    return true;
  }
}

export const guaraniService = new GuaraniServiceImpl();