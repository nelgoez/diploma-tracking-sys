/* eslint-disable ts/no-explicit-any */
import { supabaseAdmin } from './db/supabase';

const db = supabaseAdmin as any;

const TRACK = {
  name: 'Diplomatura en Ciencia de Datos',
  code: 'DIP-CD-2025',
  description: 'Diplomatura universitaria en Ciencia de Datos con módulos de Python, Estadística, Machine Learning y Proyecto Integrador.',
  is_active: true,
  credits_required: 20,
};

const COURSES = [
  { name: 'Fundamentos de Python para Datos', code: 'CD-101', credits: 4, order_index: 1 },
  { name: 'Estadística y Probabilidad Aplicada', code: 'CD-102', credits: 4, order_index: 2 },
  { name: 'Manipulación de Datos con Pandas', code: 'CD-103', credits: 3, order_index: 3 },
  { name: 'Visualización con Matplotlib y Seaborn', code: 'CD-104', credits: 3, order_index: 4 },
  { name: 'Machine Learning Supervisado', code: 'CD-201', credits: 4, order_index: 5 },
  { name: 'Módulo Integrador — Proyecto Final', code: 'CD-INT', credits: 2, order_index: 6 },
];

const STUDENTS = [
  { name: 'Nahuel Leonardo Elias Gomez', email: 'nahuelgomez.cti@gmail.com', dni: '36139752', guarani_id: 'guarani-36139752' },
  { name: 'María Laura Fernández', email: 'maria.laura.fernandez@mi.unc.edu.ar', dni: '28456789', guarani_id: 'guarani-28456789' },
  { name: 'Carlos Alberto Rodríguez', email: 'carlos.alberto.rodriguez@mi.unc.edu.ar', dni: '31234567', guarani_id: 'guarani-31234567' },
  { name: 'Ana Belén Martínez', email: 'ana.belen.martinez@mi.unc.edu.ar', dni: '35678901', guarani_id: 'guarani-35678901' },
  { name: 'Juan Pablo González', email: 'juan.pablo.gonzalez@mi.unc.edu.ar', dni: '27456123', guarani_id: 'guarani-27456123' },
];

async function seed() {
  console.log('🌱 Seeding DTS database...\n');

  const { data: existingTrack } = await db
    .from('tracks')
    .select('id')
    .eq('code', TRACK.code)
    .maybeSingle();

  let trackId: string;

  if (existingTrack) {
    trackId = existingTrack.id;
    console.log(`  Track exists: ${TRACK.code} (${trackId})`);
    await db.from('tracks').update(TRACK).eq('id', trackId);
  }
  else {
    const { data: track, error } = await db
      .from('tracks')
      .insert(TRACK)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create track:', error.message);
      process.exit(1);
    }
    trackId = track.id;
    console.log(`  Created track: ${TRACK.code} (${trackId})`);
  }

  const courseIds: string[] = [];
  for (const course of COURSES) {
    const { data: existing } = await db
      .from('courses')
      .select('id')
      .eq('code', course.code)
      .eq('track_id', trackId)
      .maybeSingle();

    if (existing) {
      courseIds.push(existing.id);
      await db.from('courses').update({ ...course, track_id: trackId, is_active: true }).eq('id', existing.id);
      continue;
    }

    const { data: created, error } = await db
      .from('courses')
      .insert({ ...course, track_id: trackId, is_active: true })
      .select('id')
      .single();

    if (error) {
      console.error(`Failed to create course ${course.code}:`, error.message);
      process.exit(1);
    }
    courseIds.push(created.id);
    console.log(`  Created course: ${course.code} (${created.id})`);
  }

  const integratorCourseId = courseIds[5];

  const { data: existingRules } = await db
    .from('prerequisite_rules')
    .select('id')
    .eq('target_course_id', integratorCourseId)
    .limit(1);

  if (!existingRules?.length) {
    const { data: rule, error: ruleErr } = await db
      .from('prerequisite_rules')
      .insert({
        target_course_id: integratorCourseId,
        condition: 'ALL',
        order_index: 0,
        is_active: true,
      })
      .select('id')
      .single();

    if (ruleErr) {
      console.error('Failed to create rule:', ruleErr.message);
    }
    else {
      const sourceRows = courseIds.slice(0, 5).map(courseId => ({
        rule_id: rule.id,
        source_course_id: courseId,
      }));

      const { error: insertErr } = await db
        .from('prerequisite_sources')
        .insert(sourceRows);

      if (insertErr) {
        console.error('Failed to create rule sources:', insertErr.message);
      }
      else {
        console.log('  Created prerequisite rule: ALL(5 courses) → Módulo Integrador');
      }
    }
  }
  else {
    console.log('  Prerequisite rule exists');
  }

  const studentIds = new Map<string, string>();
  for (const student of STUDENTS) {
    const { data: existing } = await db
      .from('students')
      .select('id')
      .eq('email', student.email)
      .maybeSingle();

    if (existing) {
      studentIds.set(student.email, existing.id);
      await db.from('students').update(student).eq('id', existing.id);
      continue;
    }

    const { data: created, error } = await db
      .from('students')
      .insert({ ...student, role: 'estudiante', is_active: true })
      .select('id')
      .single();

    if (error) {
      console.error(`Failed to create student ${student.email}:`, error.message);
      continue;
    }
    studentIds.set(student.email, created.id);
    console.log(`  Created student: ${student.name.split(' ')[0]}`);
  }

  for (const [email, studentId] of studentIds) {
    const { data: existing } = await db
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('track_id', trackId)
      .maybeSingle();

    if (existing) { continue; }

    await db.from('enrollments').insert({
      student_id: studentId,
      track_id: trackId,
      status: 'pending',
    });
    console.log(`  Enrolled: ${email.split('@')[0]}`);
  }

  const nahuelId = studentIds.get('nahuelgomez.cti@gmail.com');
  if (nahuelId) {
    for (let i = 0, len = Math.min(3, COURSES.length); i < len; i++) {
      await db.from('certificates').upsert(
        {
          student_id: nahuelId,
          course_id: courseIds[i],
          status: 'approved',
          issue_date: new Date(2026, 0, 15 + i).toISOString().split('T')[0],
          qualification: 7 + i,
          is_valid: true,
          provider: 'moodle',
        },
        { onConflict: 'student_id,course_id' },
      );
    }
    console.log('  Certificates (Nahuel): 3/5 → not eligible for exam');
  }

  console.log('\n✅ Seed complete!');
  console.log(`   Track: ${TRACK.code}`);
  console.log(`   Courses: ${COURSES.length}`);
  console.log(`   Students: ${studentIds.size}`);
  console.log('   Rule: ALL 5 courses → Integrador');
  console.log('   Certificates (Nahuel): 3/5 → not eligible');
}

seed().catch((err: Error) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
