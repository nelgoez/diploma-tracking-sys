import type { Context, Next } from "hono";

export function errorHandler(c: Context, err: Error, next: Next) {
  console.error(`[ERROR] ${err.message}`, {
    path: c.req.path,
    method: c.req.method,
    stack: err.stack,
  });

  if (err.message.includes("Unauthorized")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (err.message.includes("Not found")) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({ error: "Internal server error" }, 500);
}

export function notFoundHandler(c: Context) {
  return c.json({ error: "Not found" }, 404);
}