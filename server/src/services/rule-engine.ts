import type { Database } from '../db/supabase';

type RuleRow = Database['public']['Tables']['prerequisite_rules']['Row'];
type SourceRow = Database['public']['Tables']['prerequisite_sources']['Row'];
type OverrideRow = Database['public']['Tables']['manual_overrides']['Row'];

interface RuleNode {
  rule: RuleRow
  sources: SourceRow[]
  children: RuleNode[]
}

interface SourceEval {
  sourceType: 'course'
  courseId: string
  fulfilled: boolean
}

export interface RuleEvalResult {
  ruleId: string
  type: string
  fulfilled: boolean
  overridden: boolean
  overrideReason: string | null
  sources: SourceEval[]
  children: RuleEvalResult[]
}

export interface EligibilityResult {
  studentId: string
  trackId: string
  eligible: boolean
  evaluatedAt: string
  rules: RuleEvalResult[]
  missingPrerequisites: string[]
}

export function buildRuleTree(
  rules: RuleRow[],
  sources: SourceRow[],
  parentId: string | null = null,
): RuleNode[] {
  const children = rules
    .filter(r => (parentId === null && !r.parent_rule_id) || r.parent_rule_id === parentId)
    .sort((a, b) => a.order_index - b.order_index);

  return children.map(rule => ({
    rule,
    sources: sources.filter(s => s.rule_id === rule.id),
    children: buildRuleTree(rules, sources, rule.id),
  }));
}

function evaluateNode(
  node: RuleNode,
  passedCourseIds: Set<string>,
  overrides: OverrideRow[],
): RuleEvalResult {
  const activeOverride = overrides.find(o => o.rule_id === node.rule.id && o.status === 'active');

  if (activeOverride) {
    return {
      ruleId: node.rule.id,
      type: node.rule.condition,
      fulfilled: true,
      overridden: true,
      overrideReason: activeOverride.reason,
      sources: node.sources.map(s => ({
        sourceType: 'course' as const,
        courseId: s.source_course_id,
        fulfilled: passedCourseIds.has(s.source_course_id),
      })),
      children: node.children.map(child => evaluateNode(child, passedCourseIds, overrides)),
    };
  }

  const sourceEvals: SourceEval[] = node.sources.map(s => ({
    sourceType: 'course' as const,
    courseId: s.source_course_id,
    fulfilled: passedCourseIds.has(s.source_course_id),
  }));

  const childEvals = node.children.map(child => evaluateNode(child, passedCourseIds, overrides));

  const allEvals = [
    ...sourceEvals.map(e => e.fulfilled),
    ...childEvals.map(e => e.fulfilled),
  ];

  const fulfilled = node.rule.condition === 'ALL'
    ? allEvals.every(Boolean)
    : allEvals.length > 0 && allEvals.some(Boolean);

  return {
    ruleId: node.rule.id,
    type: node.rule.condition,
    fulfilled,
    overridden: false,
    overrideReason: null,
    sources: sourceEvals,
    children: childEvals,
  };
}

function collectMissingCourses(node: RuleEvalResult): string[] {
  if (node.overridden || node.fulfilled) { return []; }

  const missing: string[] = [];

  for (const source of node.sources) {
    if (!source.fulfilled) {
      missing.push(source.courseId);
    }
  }

  for (const child of node.children) {
    missing.push(...collectMissingCourses(child));
  }

  return missing;
}

export function evaluateNodeWithData(
  node: RuleNode,
  passedCourseIds: Set<string>,
  overrides: OverrideRow[],
): RuleEvalResult {
  return evaluateNode(node, passedCourseIds, overrides);
}

export function collectMissingCoursesFromResult(node: RuleEvalResult): string[] {
  return collectMissingCourses(node);
}

export function evaluateEligibilityFromData(
  params: {
    studentId: string
    trackId: string
    rules: RuleRow[]
    sources: SourceRow[]
    passedCourseIds: string[]
    overrides: OverrideRow[]
  },
): EligibilityResult {
  const { studentId, trackId, rules, sources, passedCourseIds, overrides } = params;

  if (!rules || rules.length === 0) {
    return {
      studentId,
      trackId,
      eligible: true,
      evaluatedAt: new Date().toISOString(),
      rules: [],
      missingPrerequisites: [],
    };
  }

  const passedSet = new Set(passedCourseIds);
  const tree = buildRuleTree(rules, sources, null);

  const ruleResults = tree.map(node => evaluateNode(node, passedSet, overrides));

  const eligible = ruleResults.every(r => r.fulfilled);
  const missingPrerequisites: string[] = [];

  if (!eligible) {
    const allMissing: string[] = [];
    for (const result of ruleResults) {
      allMissing.push(...collectMissingCourses(result));
    }
    const uniqueMissing = [...new Set(allMissing)];
    missingPrerequisites.push(...uniqueMissing);
  }

  return {
    studentId,
    trackId,
    eligible,
    evaluatedAt: new Date().toISOString(),
    rules: ruleResults,
    missingPrerequisites,
  };
}

function collectAllCourseIds(node: RuleNode): string[] {
  const ids: string[] = node.sources.map(s => s.source_course_id);
  for (const child of node.children) {
    ids.push(...collectAllCourseIds(child));
  }
  return ids;
}

export async function evaluateTrackEligibility(
  params: {
    studentId: string
    trackId: string
    getRulesForTrack: (trackId: string) => Promise<RuleRow[]>
    getSourcesForRules: (ruleIds: string[]) => Promise<SourceRow[]>
    getStudentCertificates: (studentId: string) => Promise<string[]>
    getActiveOverrides: (studentId: string) => Promise<OverrideRow[]>
  },
): Promise<EligibilityResult> {
  const startedAt = Date.now();

  const [rules, passedCourseIds, overrides] = await Promise.all([
    params.getRulesForTrack(params.trackId),
    params.getStudentCertificates(params.studentId),
    params.getActiveOverrides(params.studentId),
  ]);

  if (!rules || rules.length === 0) {
    return {
      studentId: params.studentId,
      trackId: params.trackId,
      eligible: true,
      evaluatedAt: new Date().toISOString(),
      rules: [],
      missingPrerequisites: [],
    };
  }

  const ruleIds = rules.map(r => r.id);
  const sources = await params.getSourcesForRules(ruleIds);

  const passedSet = new Set(passedCourseIds);
  const tree = buildRuleTree(rules, sources, null);

  const ruleResults = tree.map(node => evaluateNode(node, passedSet, overrides));

  const eligible = ruleResults.every(r => r.fulfilled);
  const missingPrerequisites: string[] = [];

  if (!eligible) {
    const allMissing: string[] = [];
    for (const result of ruleResults) {
      allMissing.push(...collectMissingCourses(result));
    }

    const allCourseIds = new Set<string>();
    for (const node of tree) {
      for (const id of collectAllCourseIds(node)) {
        allCourseIds.add(id);
      }
    }

    const uniqueMissing = [...new Set(allMissing)];
    missingPrerequisites.push(...uniqueMissing);
  }

  const durationMs = Date.now() - startedAt;
  if (durationMs > 500) {
    console.warn(`[RuleEngine] Evaluation took ${durationMs}ms (threshold: 500ms)`);
  }

  return {
    studentId: params.studentId,
    trackId: params.trackId,
    eligible,
    evaluatedAt: new Date().toISOString(),
    rules: ruleResults,
    missingPrerequisites,
  };
}
