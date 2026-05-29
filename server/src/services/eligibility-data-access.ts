import { supabaseAdmin } from '../db/supabase';

export function createEligibilityDataAccess() {
  return {
    getRulesForTrack: async (trackId: string) => {
      const { data } = await supabaseAdmin
        .from('prerequisite_rules')
        .select('*')
        .eq('target_course_id', trackId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      return data || [];
    },
    getSourcesForRules: async (ruleIds: string[]) => {
      const { data } = await supabaseAdmin
        .from('prerequisite_sources')
        .select('*')
        .in('rule_id', ruleIds);
      return data || [];
    },
    getStudentCertificates: async (studentId: string) => {
      const { data } = await supabaseAdmin
        .from('certificates')
        .select('course_id')
        .eq('student_id', studentId)
        .eq('status', 'approved')
        .eq('is_valid', true);
      return (data || []).map(cert => cert.course_id);
    },
    getActiveOverrides: async (studentId: string) => {
      const { data } = await supabaseAdmin
        .from('manual_overrides')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'active');
      return data || [];
    },
  };
}
