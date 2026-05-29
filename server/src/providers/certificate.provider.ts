export interface Certificate {
  id: string
  studentId: string
  courseId: string
  courseName: string
  issueDate: string
  qualification?: number
  externalId?: string
  metadata?: Record<string, unknown>
}

export interface ProviderHealth {
  status: 'connected' | 'disconnected' | 'error' | 'unknown' | 'degraded'
  latencyMs: number
  message?: string
  lastChecked: string
}

export interface CertificateProvider {
  /** Fetch all certificates for a student from the external LMS */
  fetchCertificates: (studentId: string) => Promise<Certificate[]>

  /** Validate a specific certificate still exists/is valid in source */
  validateCertificate: (externalId: string) => Promise<boolean>

  /** Check if the provider is reachable and configured correctly */
  healthCheck: () => Promise<ProviderHealth>

  /** Provider identifier for logging */
  readonly providerName: string
}
