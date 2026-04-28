import { Hono } from "hono";
import { supabase } from "../db/supabase";
import { authenticate, requireRole } from "../middleware/auth";

const admin = new Hono();

admin.use("/*", authenticate);
admin.use("/*", requireRole("admin", "sysadmin"));

admin.get("/dashboard-stats", async (c) => {
  // Total students
  const { count: totalStudents } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true });

  // Active students (accessed in last 30 days - placeholder)
  const { count: activeStudents } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Completed diplomas
  const { count: completedCount } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  // Pending enrollments
  const { count: pendingEnrollments } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Certificates issued
  const { count: certificatesIssued } = await supabase
    .from("certificates")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  return c.json({
    total_students: totalStudents || 0,
    active_students: activeStudents || 0,
    completion_rate: totalStudents ? Math.round((completedCount || 0) / totalStudents * 100) : 0,
    avg_progress: 0, // TODO: Calculate actual average
    at_risk_students: 0, // TODO: Calculate based on last access
    pending_enrollments: pendingEnrollments || 0,
    certificates_issued: certificatesIssued || 0,
  });
});

admin.get("/students", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;
  const search = c.req.query("search") || "";
  const status = c.req.query("status");

  let query = supabase
    .from("students")
    .select(`
      *,
      certificates:certificates(count),
      enrollments:enrollments(count)
    `, { count: "exact" })
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

admin.get("/courses", async (c) => {
  const { data, error } = await supabase
    .from("courses")
    .select(`
      *,
      track:tracks(id, name),
      certificates:certificates(count),
      enrollments:enrollments(count)
    `)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (error) {
    return c.json({ error: "Failed to fetch courses" }, 500);
  }

  return c.json(data || []);
});

admin.get("/tracks", async (c) => {
  const { data, error } = await supabase
    .from("tracks")
    .select(`
      *,
      courses:courses(count)
    `)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return c.json({ error: "Failed to fetch tracks" }, 500);
  }

  return c.json(data || []);
});

export { admin as adminRoutes };