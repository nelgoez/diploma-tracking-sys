import type { AcademicProvider } from './academic.provider';
import type { CertificateProvider } from './certificate.provider';

export class ProviderRegistry {
  private certificateProviders = new Map<string, CertificateProvider>();
  private academicProviders = new Map<string, AcademicProvider>();
  private activeCertificateProvider: string | null = null;
  private activeAcademicProvider: string | null = null;

  registerCertificateProvider(name: string, provider: CertificateProvider): void {
    this.certificateProviders.set(name, provider);
    if (!this.activeCertificateProvider) {
      this.activeCertificateProvider = name;
    }
  }

  registerAcademicProvider(name: string, provider: AcademicProvider): void {
    this.academicProviders.set(name, provider);
    if (!this.activeAcademicProvider) {
      this.activeAcademicProvider = name;
    }
  }

  setActiveCertificateProvider(name: string): void {
    if (!this.certificateProviders.has(name)) {
      throw new Error(`Certificate provider "${name}" not registered`);
    }
    this.activeCertificateProvider = name;
  }

  setActiveAcademicProvider(name: string): void {
    if (!this.academicProviders.has(name)) {
      throw new Error(`Academic provider "${name}" not registered`);
    }
    this.activeAcademicProvider = name;
  }

  getCertificateProvider(): CertificateProvider {
    if (!this.activeCertificateProvider) {
      throw new Error('No certificate provider configured');
    }
    const provider = this.certificateProviders.get(this.activeCertificateProvider);
    if (!provider) {
      throw new Error(`Certificate provider "${this.activeCertificateProvider}" not found`);
    }
    return provider;
  }

  getAcademicProvider(): AcademicProvider {
    if (!this.activeAcademicProvider) {
      throw new Error('No academic provider configured');
    }
    const provider = this.academicProviders.get(this.activeAcademicProvider);
    if (!provider) {
      throw new Error(`Academic provider "${this.activeAcademicProvider}" not found`);
    }
    return provider;
  }

  getCertificateProviderNames(): string[] {
    return Array.from(this.certificateProviders.keys());
  }

  getAcademicProviderNames(): string[] {
    return Array.from(this.academicProviders.keys());
  }
}

export const providerRegistry = new ProviderRegistry();
