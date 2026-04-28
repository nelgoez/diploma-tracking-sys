import { Hono } from "hono";
import { supabase } from "../db/supabase";
import { authenticate, requireRole, type AuthContext } from "../middleware/auth";

const rules = new Hono();

rules.use("/*", authenticate);

rules.get("/", requireRole("coordinador", "admin", "sysadmin"), async (c) => {
  const { data, error } = await supabase
    .from("prerequisite_rules")
    .select(`
      *,
      target_course:courses!target_course_id(id, name, code),
      sources:prerequisite_sources(source_course_id)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ error: "Failed to fetch rules" }, 500);
  }

  return c.json(data || []);
});

rules.post("/", requireRole("coordinador", "admin", "sysadmin"), async (c) => {
  const auth = c.get("auth") as AuthContext;
  const body = await c.req.json();

  // Create rule
  const { data: rule, error: ruleError } = await supabase
    .from("prerequisite_rules")
    .insert({
      target_course_id: body.target_course_id,
      condition: body.condition || "ALL",
      is_active: true,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (ruleError) {
    return c.json({ error: "Failed to create rule" }, 500);
  }

  // Insert source courses
  if (body.source_course_ids && body.source_course_ids.length > 0) {
    const sources = body.source_course_ids.map((sourceId: string) => ({
      rule_id: rule.id,
      source_course_id: sourceId,
    }));

    const { error: sourcesError } = await supabase
      .from("prerequisite_sources")
      .insert(sources);

    if (sourcesError) {
      // Rollback rule creation
      await supabase.from("prerequisite_rules").delete().eq("id", rule.id);
      return c.json({ error: "Failed to create rule sources" }, 500);
    }
  }

  return c.json(rule, 201);
});

rules.put("/:id", requireRole("coordinador", "admin", "sysadmin"), async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();

  // Update rule
  const { data: rule, error } = await supabase
    .from("prerequisite_rules")
    .update({
      target_course_id: body.target_course_id,
      condition: body.condition,
      is_active: body.is_active,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return c.json({ error: "Failed to update rule" }, 500);
  }

  // Update sources if provided
  if (body.source_course_ids) {
    // Delete existing sources
    await supabase.from("prerequisite_sources").delete().eq("rule_id", id);

    // Insert new sources
    const sources = body.source_course_ids.map((sourceId: string) => ({
      rule_id: id,
      source_course_id: sourceId,
    }));

    await supabase.from("prerequisite_sources").insert(sources);
  }

  return c.json(rule);
});

rules.delete("/:id", requireRole("admin", "sysadmin"), async (c) => {
  const { id } = c.req.param();

  // Delete sources first
  await supabase.from("prerequisite_sources").delete().eq("rule_id", id);

  // Delete rule
  const { error } = await supabase
    .from("prerequisite_rules")
    .delete()
    .eq("id", id);

  if (error) {
    return c.json({ error: "Failed to delete rule" }, 500);
  }

  return c.json({ success: true });
});

rules.post("/evaluate", async (c) => {
  const body = await c.req.json();
  const { student_id, target_course_id } = body;

  // Get student certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select("course_id")
    .eq("student_id", student_id)
    .eq("status", "approved")
    .eq("is_valid", true);

  const passedCourseIds = certificates?.map(c => c.course_id) || [];

  // Get rules for target course
  const { data: rules } = await supabase
    .from("prerequisite_rules")
    .select(`
      *,
      sources:prerequisite_sources(source_course_id)
    `)
    .eq("target_course_id", target_course_id)
    .eq("is_active", true);

  if (!rules || rules.length === 0) {
    return c.json({
      eligible: true,
      missing_prerequisites: [],
      reasons: [],
    });
  }

  const missingPrerequisites: string[] = [];

  for (const rule of rules) {
    const sourceIds = rule.sources?.map((s: { source_course_id: string }) => s.source_course_id) || [];

    if (rule.condition === "ALL") {
      for (const sourceId of sourceIds) {
        if (!passedCourseIds.includes(sourceId)) {
          missingPrerequisites.push(sourceId);
        }
      }
    } else if (rule.condition === "ANY") {
      const hasAny = sourceIds.some(id => passedCourseIds.includes(id));
      if (!hasAny && sourceIds.length > 0) {
        missingPrerequisites.push(...sourceIds);
      }
    }
  }

  return c.json({
    eligible: missingPrerequisites.length === 0,
    missing_prerequisites: [...new Set(missingPrerequisites)],
  });
});

export { rules as rulesRoutes };