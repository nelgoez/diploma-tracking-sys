import type { AcademicStudent } from '../providers/academic.provider';
import type { Certificate } from '../providers/certificate.provider';

const MOCK_STUDENTS: AcademicStudent[] = [
  {
    id: 'guarani-36139752',
    firstName: 'Nahuel Leonardo Elias',
    lastName: 'Gomez',
    email: 'nahuelgomez.cti@gmail.com',
    documentNumber: '36139001',
  },
  {
    id: 'guarani-28456789',
    firstName: 'María Laura',
    lastName: 'Fernández',
    email: 'maria.laura.fernandez@mi.unc.edu.ar',
    documentNumber: '28456789',
  },
  {
    id: 'guarani-31234567',
    firstName: 'Carlos Alberto',
    lastName: 'Rodríguez',
    email: 'carlos.alberto.rodriguez@mi.unc.edu.ar',
    documentNumber: '31234567',
  },
  {
    id: 'guarani-35678901',
    firstName: 'Ana Belén',
    lastName: 'Martínez',
    email: 'ana.belen.martinez@mi.unc.edu.ar',
    documentNumber: '35678901',
  },
  {
    id: 'guarani-27456123',
    firstName: 'Juan Pablo',
    lastName: 'González',
    email: 'juan.pablo.gonzalez@mi.unc.edu.ar',
    documentNumber: '27456123',
  },
  {
    id: 'guarani-29555123',
    firstName: 'Lucía Belén',
    lastName: 'Sosa',
    email: 'lucia.belen.sosa@mi.unc.edu.ar',
    documentNumber: '29555123',
  },
  {
    id: 'guarani-33678012',
    firstName: 'Facundo Nicolás',
    lastName: 'Pereyra',
    email: 'facundo.nicolas.pereyra@mi.unc.edu.ar',
    documentNumber: '33678012',
  },
  {
    id: 'guarani-25890134',
    firstName: 'Camila Andrea',
    lastName: 'Torres',
    email: 'camila.andrea.torres@mi.unc.edu.ar',
    documentNumber: '25890134',
  },
  {
    id: 'guarani-37123456',
    firstName: 'Lautaro Ezequiel',
    lastName: 'Díaz',
    email: 'lautaro.ezequiel.diaz@mi.unc.edu.ar',
    documentNumber: '37123456',
  },
  {
    id: 'guarani-30567890',
    firstName: 'Valentina Sol',
    lastName: 'Romero',
    email: 'valentina.sol.romero@mi.unc.edu.ar',
    documentNumber: '30567890',
  },
];

const COURSE_NAMES: Record<string, string> = {
  'CD-101': 'Fundamentos de Python para Datos',
  'CD-102': 'Estadística y Probabilidad Aplicada',
  'CD-103': 'Manipulación de Datos con Pandas',
  'CD-104': 'Visualización con Matplotlib y Seaborn',
  'CD-201': 'Machine Learning Supervisado',
};

interface MockCertAssignment {
  studentIndex: number
  courseCodes: string[]
}

const MOCK_CERT_ASSIGNMENTS: MockCertAssignment[] = [
  { studentIndex: 0, courseCodes: ['CD-101', 'CD-102', 'CD-103'] },
  { studentIndex: 1, courseCodes: ['CD-101', 'CD-102', 'CD-103', 'CD-104', 'CD-201'] },
  { studentIndex: 2, courseCodes: ['CD-101', 'CD-102', 'CD-103', 'CD-104'] },
  { studentIndex: 3, courseCodes: ['CD-101', 'CD-102', 'CD-103', 'CD-104', 'CD-201'] },
  { studentIndex: 4, courseCodes: ['CD-101', 'CD-102', 'CD-103'] },
  { studentIndex: 5, courseCodes: ['CD-101', 'CD-102'] },
  { studentIndex: 6, courseCodes: ['CD-101', 'CD-102', 'CD-103', 'CD-104', 'CD-201'] },
  { studentIndex: 7, courseCodes: ['CD-101', 'CD-102', 'CD-103', 'CD-104'] },
  { studentIndex: 8, courseCodes: ['CD-101'] },
  { studentIndex: 9, courseCodes: ['CD-101', 'CD-102', 'CD-103', 'CD-104', 'CD-201'] },
];

function buildMockCertificates(studentId: string): Certificate[] {
  const student = MOCK_STUDENTS.find(s => s.email === studentId || s.id === studentId);
  if (!student) { return []; }

  const assignment = MOCK_CERT_ASSIGNMENTS.find(
    a => MOCK_STUDENTS[a.studentIndex].email === student.email,
  );
  if (!assignment) { return []; }

  return assignment.courseCodes.map((code, i) => ({
    id: crypto.randomUUID(),
    studentId: student.id,
    courseId: `mock-moodle-${code}`,
    courseName: COURSE_NAMES[code] || code,
    issueDate: new Date(2026, 0, 15 + i).toISOString().split('T')[0],
    qualification: 7 + (i % 4),
    externalId: `mock-moodle-${code}-${student.id}`,
    metadata: {
      moodleCourseId: `mock-${code}`,
      moodleShortname: code.toLowerCase(),
      moodleIdnumber: code,
    },
  }));
}

export function getMockStudents(): AcademicStudent[] {
  return [...MOCK_STUDENTS];
}

export function getMockCertificatesForStudent(studentId: string): Certificate[] {
  return buildMockCertificates(studentId);
}

export { COURSE_NAMES, MOCK_STUDENTS };
