import { Hono } from "hono";
import { supabase } from "../db/supabase";
import { authenticate, requireRole } from "../middleware/auth";

const integrations = new Hono();

integrations.use("/*", authenticate);

integrations.get("/status", requireRole("admin", "sysadmin"), async (c) => {
  // Get last integration logs
  const { data: moodleLogs } = await supabase
    .from("integration_logs")
    .select("*")
    .eq("integration_type", "moodle")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: guaraniLogs } = await supabase
    .from("integration_logs")
    .select("*")
    .eq("integration_type", "guarani")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return c.json({
    moodle: {
      status: moodleLogs?.status || "unknown",
      last_sync: moodleLogs?.created_at || null,
      records_synced: moodleLogs?.details?.records_synced || 0,
      errors: moodleLogs?.status === "error" ? 1 : 0,
    },
    guarani: {
      status: guaraniLogs?.status || "unknown",
      last_sync: guaraniLogs?.created_at || null,
      records_synced: guaraniLogs?.details?.records_synced || 0,
      errors: guaraniLogs?.status === "error" ? 1 : 0,
    },
  });
});

integrations.post("/sync/moodle", requireRole("admin", "sysadmin"), async (c) => {
  // TODO: Implement actual Moodle sync
  // Placeholder - would call moodleService.sync()
  
  const logEntry = {
    integration_type: "moodle",
    operation: "sync",
    status: "pending",
  };

  await supabase.from("integration_logs").insert(logEntry);

  return c.json({
    success: true,
    message: "Moodle sync initiated (placeholder)",
  });
});

integrations.post("/sync/guarani", requireRole("admin", "sysadmin"), async (c) => {
  // TODO: Implement actual Guaraní sync
  // Placeholder - would call guaraniService.sync()
  
  const logEntry = {
    integration_type: "guarani",
    operation: "sync",
    status: "pending",
  };

  await supabase.from("integration_logs").insert(logEntry);

  return c.json({
    success: true,
    message: "Guaraní sync initiated (placeholder)",
  });
});

integrations.get("/logs", requireRole("admin", "sysadmin"), async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;
  const integrationType = c.req.query("type");

  let query = supabase
    .from("integration_logs")
    .select("*", { count: "exact" })
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (integrationType) {
    query = query.eq("integration_type", integrationType);
  }

  const { data, error, count } = await query;

  if (error) {
    return c.json({ error: "Failed to fetch logs" }, 500);
  }

  return c.json({
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
    },
  });
});

export { integrations as integrationsRoutes };