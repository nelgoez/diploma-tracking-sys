import { Hono } from "hono";
import { supabase } from "../db/supabase";
import { authenticate, requireRole, type AuthContext } from "../middleware/auth";

const enrollments = new Hono();

enrollments.use("/*", authenticate);

enrollments.get("/", async (c) => {
  const studentId = c.req.query("student_id");
  const courseId = c.req.query("course_id");

  let query = supabase
    .from("enrollments")
    .select(`
      *,
      student:students(id, name, email),
      course:courses(id, name, code),
      track:tracks(id, name)
    `)
    .order("created_at", { ascending: false });

  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  if (courseId) {
    query = query.eq("course_id", courseId);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ error: "Failed to fetch enrollments" }, 500);
  }

  return c.json(data || []);
});

enrollments.get("/eligibility/:studentId", async (c) => {
  const { studentId } = c.req.param();

  // Get student
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();

  if (!student) {
    return c.json({ error: "Student not found" }, 404);
  }

  // Get manual override (if exists)
  const { data: override } = await supabase
    .from("manual_overrides")
    .select("*")
    .eq("student_id", studentId)
    .is("course_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (override) {
    return c.json({
      student_id: studentId,
      is_eligible: override.action === "enable",
      eligibility_type: "manual",
      manual_override: override,
      missing_prerequisites: [],
      reason: override.reason,
    });
  }

  // TODO: Implement actual eligibility check using rule engine
  // Placeholder response
  return c.json({
    student_id: studentId,
    is_eligible: false,
    eligibility_type: "automatic",
    manual_override: null,
    missing_prerequisites: ["course-1", "course-2"],
    reason: "Prerrequisitos no cumplidos",
  });
});

enrollments.post("/", async (c) => {
  const auth = c.get("auth") as AuthContext;
  const body = await c.req.json();

  // Verify student is enrolling themselves or is admin
  if (body.student_id !== auth.userId && !["admin", "sysadmin"].includes(auth.role)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // TODO: Verify eligibility before allowing enrollment
  // For now, create enrollment directly
  const { data, error } = await supabase
    .from("enrollments")
    .insert({
      student_id: body.student_id,
      course_id: body.course_id,
      track_id: body.track_id,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: "Failed to create enrollment" }, 500);
  }

  return c.json(data, 201);
});

enrollments.put("/:id/grade", requireRole("coordinador", "admin", "sysadmin"), async (c) => {
  const { id } = c.req.param();
  const auth = c.get("auth") as AuthContext;
  const body = await c.req.json();

  const updateData: Record<string, unknown> = {
    qualification: body.qualification,
    status: body.status,
    observations: body.observations,
  };

  if (body.status === "completed" || body.qualification >= 6) {
    updateData.completion_date = new Date().toISOString().split("T")[0];
  }

  const { data, error } = await supabase
    .from("enrollments")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return c.json({ error: "Failed to update enrollment" }, 500);
  }

  // TODO: Create certificate if approved
  // TODO: Notify student

  return c.json(data);
});

export { enrollments as enrollmentsRoutes };