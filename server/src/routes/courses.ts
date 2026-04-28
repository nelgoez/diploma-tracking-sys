import { Hono } from "hono";
import { supabase } from "../db/supabase";
import { authenticate, requireRole } from "../middleware/auth";

const courses = new Hono();

courses.use("/*", authenticate);

courses.get("/", async (c) => {
  const trackId = c.req.query("track_id");

  let query = supabase
    .from("courses")
    .select(`
      *,
      track:tracks(id, name, code)
    `)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (trackId) {
    query = query.eq("track_id", trackId);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ error: "Failed to fetch courses" }, 500);
  }

  return c.json(data || []);
});

courses.get("/:id", async (c) => {
  const { id } = c.req.param();

  const { data, error } = await supabase
    .from("courses")
    .select(`
      *,
      track:tracks(id, name, code)
    `)
    .eq("id", id)
    .single();

  if (error) {
    return c.json({ error: "Course not found" }, 404);
  }

  return c.json(data);
});

courses.get("/:id/prerequisites", async (c) => {
  const { id } = c.req.param();

  // Get prerequisite rules for this course
  const { data: rules } = await supabase
    .from("prerequisite_rules")
    .select(`
      *,
      sources:prerequisite_sources(source_course_id)
    `)
    .eq("target_course_id", id)
    .eq("is_active", true);

  // Get course details
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  // Get source courses
  const sourceIds = rules?.flatMap(r => r.sources?.map((s: { source_course_id: string }) => s.source_course_id)) || [];
  
  const { data: sourceCourses } = await supabase
    .from("courses")
    .select("id, name, code, credits")
    .in("id", sourceIds);

  return c.json({
    course,
    rules: rules || [],
    prerequisites: sourceCourses || [],
  });
});

export { courses as coursesRoutes };