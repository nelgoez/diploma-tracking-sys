import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { supabase } from "../db/supabase";

const auth = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refresh_token: z.string(),
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  // TODO: Implement actual login with Supabase Auth
  // Placeholder response
  return c.json({
    access_token: "placeholder-access-token",
    refresh_token: "placeholder-refresh-token",
    user: {
      id: "placeholder-id",
      email,
      name: "Usuario Placeholder",
      role: "estudiante",
    },
  });
});

auth.post("/refresh", zValidator("json", refreshSchema), async (c) => {
  const { refresh_token } = c.req.valid("json");
  
  // TODO: Implement token refresh with Supabase Auth
  return c.json({
    access_token: "placeholder-access-token",
    refresh_token: "placeholder-refresh-token",
  });
});

auth.post("/logout", async (c) => {
  // TODO: Implement logout with Supabase Auth
  return c.json({ success: true });
});

auth.get("/me", async (c) => {
  // TODO: Get current user from token
  return c.json({
    id: "placeholder-id",
    email: "placeholder@example.com",
    name: "Usuario Placeholder",
    role: "estudiante",
  });
});

export { auth as authRoutes };