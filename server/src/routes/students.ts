import { Hono } from "hono";
import { supabase } from "../db/supabase";
import { authenticate, requireRole } from "../middleware/auth";

const students = new Hono();

students.use("/*", authenticate);

students.get("/", requireRole("admin", "sysadmin", "coordinador"), async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;
  const search = c.req.query("search") || "";
  const status = c.req.query("status");

  let query = supabase
    .from("students")
    .select("*", { count: "exact" })
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,dni.ilike.%${search}%`);
  }

  if (status) {
    query = query.eq("is_active", status === "active");
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[students] Error fetching:", error);
    return c.json({ error: "Failed to fetch students" }, 500);
  }

  return c.json({
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  });
});

students.get("/:id", async (c) => {
  const { id } = c.req.param();

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return c.json({ error: "Student not found" }, 404);
  }

  return c.json(data);
});

students.get("/:id/progress", async (c) => {
  const { id } = c.req.param();

  // Get student
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();

  if (!student) {
    return c.json({ error: "Student not found" }, 404);
  }

  // Get certificates count
  const { count: certificatesCount } = await supabase
    .from("certificates")
    .select("*", { count: "exact", head: true })
    .eq("student_id", id)
    .eq("status", "approved")
    .eq("is_valid", true);

  // TODO: Calculate progress based on track courses
  return c.json({
    student_id: id,
    courses_completed: certificatesCount || 0,
    courses_total: 5, // Placeholder
    credits_accumulated: (certificatesCount || 0) * 4, // Placeholder credits
    credits_required: 20, // Placeholder
    progress_percentage: Math.round(((certificatesCount || 0) / 5) * 100),
    status: "on_track", // TODO: Calculate actual status
  });
});

students.get("/:id/certificates", async (c) => {
  const { id } = c.req.param();

  const { data, error } = await supabase
    .from("certificates")
    .select(`
      *,
      course:courses(id, name, code, credits)
    `)
    .eq("student_id", id)
    .order("issue_date", { ascending: false });

  if (error) {
    return c.json({ error: "Failed to fetch certificates" }, 500);
  }

  return c.json(data || []);
});

export { students as studentsRoutes };