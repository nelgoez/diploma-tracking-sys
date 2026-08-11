import { describe, expect, it } from 'bun:test';
import { guaraniService } from './guarani.service';
import { getMockStudents } from './mock-data';

describe('GuaraniService — mock mode', () => {
  it('fetchStudents returns 10 mock students', async () => {
    const students = await guaraniService.fetchStudents();
    expect(students).toBeArray();
    expect(students.length).toBe(10);
    expect(students[0]).toHaveProperty('firstName');
    expect(students[0]).toHaveProperty('lastName');
    expect(students[0]).toHaveProperty('email');
    expect(students[0]).toHaveProperty('documentNumber');
    expect(students[0]).toHaveProperty('id');
  });

  it('fetchStudent returns correct student by ID', async () => {
    const students = getMockStudents();
    const target = students[0];
    const found = await guaraniService.fetchStudent(target.id);
    expect(found).not.toBeNull();
    expect(found!.email).toBe(target.email);
    expect(found!.firstName).toBe(target.firstName);
  });

  it('fetchStudent returns null for unknown ID', async () => {
    const found = await guaraniService.fetchStudent('nonexistent-id');
    expect(found).toBeNull();
  });

  it('healthCheck returns connected in mock mode', async () => {
    const health = await guaraniService.healthCheck();
    expect(health.status).toBe('connected');
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    expect(health.message).toInclude('mock');
    expect(health.lastChecked).toBeString();
    expect(() => new Date(health.lastChecked)).not.toThrow();
  });

  it('providerName is guarani', () => {
    expect(guaraniService.providerName).toBe('guarani');
  });
});

describe('GuaraniService — mock student diversity', () => {
  it('mock students cover diverse completion states', async () => {
    const students = await guaraniService.fetchStudents();

    const fullNames = students.map(s => `${s.firstName} ${s.lastName}`);
    expect(fullNames).toContain('Nahuel Leonardo Elias Gomez');
    expect(fullNames).toContain('María Laura Fernández');
    expect(fullNames).toContain('Carlos Alberto Rodríguez');
    expect(fullNames).toContain('Ana Belén Martínez');
    expect(fullNames).toContain('Juan Pablo González');
    expect(fullNames).toContain('Lucía Belén Sosa');
    expect(fullNames).toContain('Facundo Nicolás Pereyra');
    expect(fullNames).toContain('Camila Andrea Torres');
    expect(fullNames).toContain('Lautaro Ezequiel Díaz');
    expect(fullNames).toContain('Valentina Sol Romero');
  });

  it('all mock students have unique emails', async () => {
    const students = await guaraniService.fetchStudents();
    const emails = students.map(s => s.email);
    const unique = new Set(emails);
    expect(unique.size).toBe(students.length);
  });

  it('all mock students have unique document numbers', async () => {
    const students = await guaraniService.fetchStudents();
    const dnis = students.map(s => s.documentNumber);
    const unique = new Set(dnis);
    expect(unique.size).toBe(students.length);
  });

  it('all mock students have guarani_id prefix', async () => {
    const students = await guaraniService.fetchStudents();
    for (const s of students) {
      expect(s.id.startsWith('guarani-')).toBe(true);
    }
  });
});

describe('GuaraniService — pushDiploma integration', () => {
  it('pushDiploma generates valid guarani reference', async () => {
    const result = await guaraniService.pushDiploma('student-test-id', {
      trackId: 'track-test-id',
      grade: 8,
      courseName: 'Machine Learning Supervisado',
    });

    expect(result.success).toBe(true);
    expect(result.studentId).toBe('student-test-id');
    expect(result.trackId).toBe('track-test-id');
    expect(result.grade).toBe(8);
    expect(result.guaraniReference).toStartWith('GUARANI-');
    expect(result.guaraniReference).toInclude('-');
    expect(result.pushedAt).toBeString();
    expect(() => new Date(result.pushedAt)).not.toThrow();
  });

  it('pushDiploma result has populated fields', async () => {
    const result = await guaraniService.pushDiploma('s-1', {
      trackId: 't-1',
      grade: 10,
      courseName: 'Fundamentos de Python',
    });

    expect(result.success).toBe(true);
    expect(result.grade).toBe(10);
    expect(result.guaraniReference.length).toBeGreaterThan(10);
  });
});

describe('GuaraniService — syncStudents mock mode (DB required — skip in CI)', () => {
  it.skip('syncStudents returns summary with correct structure', async () => {
    const result = await guaraniService.syncStudents();

    expect(result).toHaveProperty('studentsProcessed');
    expect(result).toHaveProperty('studentsNew');
    expect(result).toHaveProperty('studentsUpdated');
    expect(result).toHaveProperty('errors');
    expect(result.studentsProcessed).toBe(10);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it.skip('syncStudents total = new + updated + errors', async () => {
    const result = await guaraniService.syncStudents();
    expect(result.studentsNew + result.studentsUpdated + result.errors.length).toBe(result.studentsProcessed);
  });
});
