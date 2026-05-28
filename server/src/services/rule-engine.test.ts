import { describe, expect, it } from 'bun:test';
import { evaluateTrackEligibility } from './rule-engine';

interface RuleRow {
  id: string
  target_course_id: string
  parent_rule_id: string | null
  condition: 'ALL' | 'ANY'
  order_index: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

interface SourceRow { rule_id: string, source_course_id: string }

interface OverrideRow {
  id: string
  student_id: string
  rule_id: string | null
  reason: string
  status: 'active' | 'expired' | 'revoked'
  expires_at: string | null
  revoked_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

function r(id: string, target: string, cond: 'ALL' | 'ANY', parent: string | null = null, order = 0): RuleRow {
  return {
    id,
    target_course_id: target,
    parent_rule_id: parent,
    condition: cond,
    order_index: order,
    is_active: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function s(ruleId: string, courseId: string): SourceRow {
  return { rule_id: ruleId, source_course_id: courseId };
}

function override(overrides: Partial<OverrideRow> & { id: string, student_id: string }): OverrideRow {
  return {
    rule_id: null,
    reason: 'Test override',
    status: 'active',
    expires_at: null,
    revoked_at: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('evaluateTrackEligibility', () => {
  const studentId = 'student-1';
  const trackId = 'track-1';

  it('no rules → eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [],
      getSourcesForRules: async () => [],
      getStudentCertificates: async () => [],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(true);
    expect(result.rules).toHaveLength(0);
    expect(result.missingPrerequisites).toHaveLength(0);
  });

  it('ALL rule — all sources passed → eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [r('rule-1', 'course-target', 'ALL')],
      getSourcesForRules: async () => [s('rule-1', 'c1'), s('rule-1', 'c2')],
      getStudentCertificates: async () => ['c1', 'c2'],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(true);
    expect(result.rules[0].fulfilled).toBe(true);
  });

  it('ALL rule — one source missing → not eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [r('rule-1', 'course-target', 'ALL')],
      getSourcesForRules: async () => [s('rule-1', 'c1'), s('rule-1', 'c2')],
      getStudentCertificates: async () => ['c1'],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(false);
    expect(result.rules[0].fulfilled).toBe(false);
    expect(result.missingPrerequisites).toContain('c2');
  });

  it('ANY rule — at least one passed → eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [r('rule-1', 'course-target', 'ANY')],
      getSourcesForRules: async () => [s('rule-1', 'c1'), s('rule-1', 'c2')],
      getStudentCertificates: async () => ['c1'],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(true);
    expect(result.rules[0].fulfilled).toBe(true);
  });

  it('ANY rule — none passed → not eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [r('rule-1', 'course-target', 'ANY')],
      getSourcesForRules: async () => [s('rule-1', 'c1'), s('rule-1', 'c2')],
      getStudentCertificates: async () => [],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(false);
    expect(result.rules[0].fulfilled).toBe(false);
  });

  it('active override → eligible regardless of sources', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [r('rule-1', 'course-target', 'ALL')],
      getSourcesForRules: async () => [s('rule-1', 'c1'), s('rule-1', 'c2')],
      getStudentCertificates: async () => [],
      getActiveOverrides: async () => [override({ id: 'o1', student_id: studentId, rule_id: 'rule-1' })],
    });
    expect(result.eligible).toBe(true);
    expect(result.rules[0].fulfilled).toBe(true);
    expect(result.rules[0].overridden).toBe(true);
    expect(result.rules[0].overrideReason).toBe('Test override');
  });

  it('multiple root rules — all pass → eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [
        r('rule-1', 'course-target', 'ALL', null, 0),
        r('rule-2', 'course-target', 'ALL', null, 1),
      ],
      getSourcesForRules: async () => [
        s('rule-1', 'c1'),
        s('rule-2', 'c2'),
      ],
      getStudentCertificates: async () => ['c1', 'c2'],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(true);
    expect(result.rules).toHaveLength(2);
  });

  it('multiple root rules — one fails → not eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [
        r('rule-1', 'course-target', 'ALL', null, 0),
        r('rule-2', 'course-target', 'ALL', null, 1),
      ],
      getSourcesForRules: async () => [
        s('rule-1', 'c1'),
        s('rule-2', 'c2'),
      ],
      getStudentCertificates: async () => ['c1'],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(false);
    expect(result.rules[0].fulfilled).toBe(true);
    expect(result.rules[1].fulfilled).toBe(false);
  });

  it('nested: root ALL → child ALL → all pass → eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [
        r('parent', 'course-target', 'ALL', null, 0),
        r('child', 'course-target', 'ALL', 'parent', 0),
      ],
      getSourcesForRules: async () => [s('child', 'c1'), s('child', 'c2')],
      getStudentCertificates: async () => ['c1', 'c2'],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(true);
    expect(result.rules[0].fulfilled).toBe(true);
    expect(result.rules[0].children[0].fulfilled).toBe(true);
  });

  it('nested: root ALL → child ALL → child fails → not eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [
        r('parent', 'course-target', 'ALL', null, 0),
        r('child', 'course-target', 'ALL', 'parent', 0),
      ],
      getSourcesForRules: async () => [s('child', 'c1'), s('child', 'c2')],
      getStudentCertificates: async () => ['c1'],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(false);
    expect(result.rules[0].fulfilled).toBe(false);
    expect(result.rules[0].children[0].fulfilled).toBe(false);
  });

  it('nested: root ANY → children ALL + ANY, one child passes → eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [
        r('parent', 'course-target', 'ANY', null, 0),
        r('child-all', 'course-target', 'ALL', 'parent', 0),
        r('child-any', 'course-target', 'ANY', 'parent', 1),
      ],
      getSourcesForRules: async () => [
        s('child-all', 'c1'),
        s('child-all', 'c2'),
        s('child-any', 'c3'),
        s('child-any', 'c4'),
      ],
      getStudentCertificates: async () => ['c3'],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(true);
  });

  it('deep nesting: 3 levels, all pass → eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [
        r('l1', 'course-target', 'ALL', null, 0),
        r('l2', 'course-target', 'ALL', 'l1', 0),
        r('l3', 'course-target', 'ALL', 'l2', 0),
      ],
      getSourcesForRules: async () => [s('l3', 'c1')],
      getStudentCertificates: async () => ['c1'],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(true);
    expect(result.rules[0].fulfilled).toBe(true);
    expect(result.rules[0].children[0].fulfilled).toBe(true);
    expect(result.rules[0].children[0].children[0].fulfilled).toBe(true);
  });

  it('override on nested child → parent becomes eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [
        r('parent', 'course-target', 'ALL', null, 0),
        r('child', 'course-target', 'ALL', 'parent', 0),
      ],
      getSourcesForRules: async () => [s('child', 'c1')],
      getStudentCertificates: async () => [],
      getActiveOverrides: async () => [
        override({ id: 'o1', student_id: studentId, rule_id: 'child' }),
      ],
    });
    expect(result.eligible).toBe(true);
    expect(result.rules[0].fulfilled).toBe(true);
    expect(result.rules[0].children[0].fulfilled).toBe(true);
  });

  it('ALL rule with no sources, no children → eligible (vacuously true)', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [r('rule-1', 'course-target', 'ALL')],
      getSourcesForRules: async () => [],
      getStudentCertificates: async () => [],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(true);
  });

  it('ANY rule with no sources, no children → not eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [r('rule-1', 'course-target', 'ANY')],
      getSourcesForRules: async () => [],
      getStudentCertificates: async () => [],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(false);
  });

  it('ALL rule with sources AND children — all must pass', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [
        r('parent', 'course-target', 'ALL', null, 0),
        r('child', 'course-target', 'ALL', 'parent', 0),
      ],
      getSourcesForRules: async () => [
        s('parent', 'c1'),
        s('child', 'c2'),
      ],
      getStudentCertificates: async () => ['c1', 'c2'],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(true);
  });

  it('ALL rule — child passes but source fails → not eligible', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [
        r('parent', 'course-target', 'ALL', null, 0),
        r('child', 'course-target', 'ALL', 'parent', 0),
      ],
      getSourcesForRules: async () => [
        s('parent', 'c1'),
        s('child', 'c2'),
      ],
      getStudentCertificates: async () => ['c2'],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(false);
    expect(result.missingPrerequisites).toContain('c1');
  });

  it('revoked override does not apply', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [r('rule-1', 'course-target', 'ALL')],
      getSourcesForRules: async () => [s('rule-1', 'c1')],
      getStudentCertificates: async () => [],
      getActiveOverrides: async () => [
        override({ id: 'o1', student_id: studentId, rule_id: 'rule-1', status: 'revoked' }),
      ],
    });
    expect(result.eligible).toBe(false);
    expect(result.rules[0].overridden).toBe(false);
  });

  it('expired override does not apply', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [r('rule-1', 'course-target', 'ALL')],
      getSourcesForRules: async () => [s('rule-1', 'c1')],
      getStudentCertificates: async () => [],
      getActiveOverrides: async () => [
        override({ id: 'o1', student_id: studentId, rule_id: 'rule-1', status: 'expired' }),
      ],
    });
    expect(result.eligible).toBe(false);
    expect(result.rules[0].overridden).toBe(false);
  });

  it('missing prerequisites deduplicates', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [
        r('rule-1', 'course-target', 'ALL', null, 0),
        r('rule-2', 'course-target', 'ALL', null, 1),
      ],
      getSourcesForRules: async () => [
        s('rule-1', 'c1'),
        s('rule-2', 'c1'),
      ],
      getStudentCertificates: async () => [],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(false);
    expect(result.missingPrerequisites).toEqual(['c1']);
  });

  it('eligible with override on one rule, valid certs on another', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [
        r('rule-1', 'course-target', 'ALL', null, 0),
        r('rule-2', 'course-target', 'ALL', null, 1),
      ],
      getSourcesForRules: async () => [
        s('rule-1', 'c1'),
        s('rule-2', 'c2'),
      ],
      getStudentCertificates: async () => ['c2'],
      getActiveOverrides: async () => [
        override({ id: 'o1', student_id: studentId, rule_id: 'rule-1' }),
      ],
    });
    expect(result.eligible).toBe(true);
    expect(result.rules[0].overridden).toBe(true);
    expect(result.rules[1].overridden).toBe(false);
    expect(result.rules[1].fulfilled).toBe(true);
  });

  it('evaluatedAt is set to current ISO timestamp', async () => {
    const before = new Date().toISOString();
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [],
      getSourcesForRules: async () => [],
      getStudentCertificates: async () => [],
      getActiveOverrides: async () => [],
    });
    expect(result.evaluatedAt >= before).toBe(true);
  });

  it('missing prerequisites includes nested course IDs', async () => {
    const result = await evaluateTrackEligibility({
      studentId,
      trackId,
      getRulesForTrack: async () => [
        r('parent', 'course-target', 'ALL', null, 0),
        r('child', 'course-target', 'ALL', 'parent', 0),
      ],
      getSourcesForRules: async () => [
        s('parent', 'c1'),
        s('child', 'c2'),
      ],
      getStudentCertificates: async () => ['c1'],
      getActiveOverrides: async () => [],
    });
    expect(result.eligible).toBe(false);
    expect(result.missingPrerequisites).toContain('c2');
    expect(result.missingPrerequisites).not.toContain('c1');
  });
});
