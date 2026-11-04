import { NextResponse } from "next/server";
import { getSessionAdminId, moderateProject } from "@/lib/admin-repository";
import { errorResponse, parseJsonBody } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionUserId } from "@/lib/session-user";

type AdminProjectRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ModerateProjectRequest = {
  verified?: unknown;
  archived?: unknown;
};

export async function PATCH(request: Request, { params }: AdminProjectRouteContext) {
  const rateLimitResult = enforceRateLimit(request, {
    bucket: "admin-projects-patch",
    limit: 60,
    windowMs: 60_000
  });
  if (!rateLimitResult.allowed) {
    return errorResponse(429, `Too many requests. Try again in ${rateLimitResult.retryAfterSeconds} seconds.`);
  }

  if (!(await getSessionUserId())) {
    return errorResponse(401, "Please sign in.");
  }

  if (!(await getSessionAdminId())) {
    return errorResponse(403, "Admins only.");
  }

  const parsedBody = await parseJsonBody<ModerateProjectRequest>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { verified, archived } = parsedBody.data;

  if (verified === undefined && archived === undefined) {
    return errorResponse(400, "Send verified and/or archived.");
  }

  if ((verified !== undefined && typeof verified !== "boolean") || (archived !== undefined && typeof archived !== "boolean")) {
    return errorResponse(400, "verified and archived must be true or false.");
  }

  const { id } = await params;
  const project = await moderateProject(id, { verified, archived });

  if (!project) {
    return errorResponse(404, "Project not found.");
  }

  return NextResponse.json({ project });
}
