import { NextResponse } from "next/server";
import { getSessionAdminId, updateUserByAdmin, type AdminRole } from "@/lib/admin-repository";
import { errorResponse, parseJsonBody } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionUserId } from "@/lib/session-user";

type AdminUserRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateUserRequest = {
  role?: unknown;
  suspended?: unknown;
};

const roles = new Set<AdminRole>(["student", "faculty", "admin"]);

export async function PATCH(request: Request, { params }: AdminUserRouteContext) {
  const rateLimitResult = enforceRateLimit(request, {
    bucket: "admin-users-patch",
    limit: 60,
    windowMs: 60_000
  });
  if (!rateLimitResult.allowed) {
    return errorResponse(429, `Too many requests. Try again in ${rateLimitResult.retryAfterSeconds} seconds.`);
  }

  if (!(await getSessionUserId())) {
    return errorResponse(401, "Please sign in.");
  }

  const adminId = await getSessionAdminId();
  if (!adminId) {
    return errorResponse(403, "Admins only.");
  }

  const parsedBody = await parseJsonBody<UpdateUserRequest>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { role, suspended } = parsedBody.data;

  if (role === undefined && suspended === undefined) {
    return errorResponse(400, "Send role and/or suspended.");
  }

  if (role !== undefined && !roles.has(role as AdminRole)) {
    return errorResponse(400, "Role must be student, faculty, or admin.");
  }

  if (suspended !== undefined && typeof suspended !== "boolean") {
    return errorResponse(400, "suspended must be true or false.");
  }

  const { id } = await params;

  // Prevents an admin from locking themselves (and possibly everyone) out of admin tools.
  if (id === adminId && ((role !== undefined && role !== "admin") || suspended === true)) {
    return errorResponse(409, "You can't remove your own admin access or suspend yourself.");
  }

  const user = await updateUserByAdmin(id, {
    role: role as AdminRole | undefined,
    suspended: suspended as boolean | undefined
  });

  if (!user) {
    return errorResponse(404, "User not found.");
  }

  return NextResponse.json({ user });
}
