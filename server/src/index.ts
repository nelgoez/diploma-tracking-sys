import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import { authRoutes } from "./routes/auth";
import { studentsRoutes } from "./routes/students";
import { coursesRoutes } from "./routes/courses";
import { certificatesRoutes } from "./routes/certificates";
import { enrollmentsRoutes } from "./routes/enrollments";
import { rulesRoutes } from "./routes/rules";
import { integrationsRoutes } from "./routes/integrations";
import { adminRoutes } from "./routes/admin";
import { errorHandler, notFoundHandler } from "./middleware/error";

const app = new Hono();

app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/students", studentsRoutes);
app.route("/api/v1/courses", coursesRoutes);
app.route("/api/v1/certificates", certificatesRoutes);
app.route("/api/v1/enrollments", enrollmentsRoutes);
app.route("/api/v1/rules", rulesRoutes);
app.route("/api/v1/integrations", integrationsRoutes);
app.route("/api/v1/admin", adminRoutes);

app.onError(errorHandler);
app.notFound(notFoundHandler);

const port = parseInt(process.env.PORT || "3000");

console.log(`🚀 Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};