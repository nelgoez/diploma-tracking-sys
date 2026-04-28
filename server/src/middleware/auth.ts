import type { MiddlewareHandler } from "hono";

export interface AuthContext {
  userId: string;
  role: "estudiante" | "coordinador" | "admin" | "sysadmin";
}

export const authenticate: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing authorization header" }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // TODO: Verify JWT token with Supabase or custom JWT library
    // Placeholder - in real implementation, verify with jose library
    const payload = { sub: "placeholder-user-id", role: "estudiante" };
    
    c.set("auth", {
      userId: payload.sub,
      role: payload.role as AuthContext["role"],
    } as AuthContext);

    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
};

export const requireRole = (...roles: AuthContext["role"][]): MiddlewareHandler => {
  return async (c, next) => {
    const auth = c.get("auth") as AuthContext | undefined;
    
    if (!auth) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (!roles.includes(auth.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  };
};