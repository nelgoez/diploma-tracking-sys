import type { ProviderHealth } from './certificate.provider';

export interface AcademicStudent {
  id: string
  firstName: string
  lastName: string
  email: string
  documentNumber: string
}

export interface AcademicProvider {
  /** Fetch all students from the academic registry system */
  fetchStudents: () => Promise<AcademicStudent[]>

  /** Fetch a single student by their external ID */
  fetchStudent: (id: string) => Promise<AcademicStudent | null>

  /** Check if the provider is reachable */
  healthCheck: () => Promise<ProviderHealth>

  /** Provider identifier for logging */
  readonly providerName: string
}
