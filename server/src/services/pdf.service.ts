import type { Browser } from 'puppeteer';
import type { DiplomaTemplateData } from './templates/diploma-template';
import puppeteer from 'puppeteer';
import { supabaseAdmin } from '../db/supabase';
import { logAudit } from './audit-log';
import { renderDiplomaHtml } from './templates/diploma-template';

export interface DiplomaResult {
  enrollmentId: string
  status: 'generated' | 'error'
  filePath?: string
  errorMessage?: string
}

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      executablePath: process.env.CHROMIUM_PATH || undefined,
    });
  }
  return browser;
}

export async function generateDiplomaPdf(data: DiplomaTemplateData): Promise<Buffer> {
  const html = renderDiplomaHtml(data);
  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.setContent(html, { waitUntil: 'load' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    });

    return Buffer.from(pdf);
  }
  finally {
    await page.close();
  }
}

function getDiplomaDb() {
  return supabaseAdmin.from('diploma_files' as never) as never;
}

interface DiplomaRecord {
  enrollment_id: string
  status: string
  file_path?: string
  reference_code?: string
  generated_at?: string
  error_message?: string
}

export async function generateDiplomaForEnrollment(
  enrollmentId: string,
  userId?: string,
): Promise<DiplomaResult> {
  try {
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .select('student_id, track_id, qualification, completion_date, exam_status')
      .eq('id', enrollmentId)
      .single();

    if (enrollError || !enrollment) {
      return { enrollmentId, status: 'error', errorMessage: 'Enrollment not found' };
    }

    if (enrollment.exam_status !== 'aprobado') {
      return { enrollmentId, status: 'error', errorMessage: 'Exam not approved' };
    }

    const [studentRes, trackRes] = await Promise.all([
      supabaseAdmin.from('students').select('name, dni').eq('id', enrollment.student_id).single(),
      supabaseAdmin.from('tracks').select('name').eq('id', enrollment.track_id).single(),
    ]);

    if (studentRes.error || trackRes.error) {
      return { enrollmentId, status: 'error', errorMessage: 'Student or track not found' };
    }

    const student = studentRes.data;
    const track = trackRes.data;
    const issueDate = enrollment.completion_date || new Date().toISOString().split('T')[0];
    const referenceCode = generateReferenceCode();

    const pdfBuffer = await generateDiplomaPdf({
      studentName: student.name,
      documentNumber: student.dni || '—',
      trackName: track.name,
      issueDate: formatDate(issueDate),
      grade: enrollment.qualification || 0,
      referenceCode,
    });

    const fileName = `diploma-${enrollmentId}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('diplomas')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      return { enrollmentId, status: 'error', errorMessage: uploadError.message };
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from('diplomas')
      .getPublicUrl(fileName);

    const db = getDiplomaDb();
    await (db as any).upsert({
      enrollment_id: enrollmentId,
      status: 'generated',
      file_path: fileName,
      reference_code: referenceCode,
      generated_at: new Date().toISOString(),
    });

    await logAudit({
      userId,
      action: 'grade_recorded' as any,
      entityType: 'diploma',
      entityId: enrollmentId,
      details: {
        status: 'generated',
        student_id: enrollment.student_id,
        track_id: enrollment.track_id,
      },
    });

    return { enrollmentId, status: 'generated', filePath: publicUrl.publicUrl };
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PDF] Generation failed:', message);

    const db = getDiplomaDb() as any;
    await db.upsert({
      enrollment_id: enrollmentId,
      status: 'error',
      error_message: message,
    });

    return { enrollmentId, status: 'error', errorMessage: message };
  }
}

export async function getDiplomaStatus(enrollmentId: string) {
  const db = getDiplomaDb() as any;
  const { data } = await db
    .select('status, file_path, reference_code, generated_at, error_message')
    .eq('enrollment_id', enrollmentId)
    .single();

  if (!data) {
    return { status: 'pending' };
  }

  return {
    status: data.status,
    ...(data.status === 'generated'
      ? {
          generatedAt: data.generated_at,
          referenceCode: data.reference_code,
        }
      : {}),
    ...(data.status === 'error'
      ? {
          errorMessage: data.error_message,
        }
      : {}),
  };
}

export async function shutdownPdfBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

function generateReferenceCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'DTS-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
