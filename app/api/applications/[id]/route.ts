import { NextResponse } from "next/server";
import {
  getApplicationAuthorizationContext,
  updateOwnedProjectApplicationStatus
} from "@/lib/project-repository";
import { errorResponse, parseJsonBody, requireTrimmedString } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionUserId } from "@/lib/session-user";
import type { Application } from "@/lib/types";

type ApplicationRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const validStatuses = new Set<Application["status"]>(["submitted", "interview", "accepted", "declined"]);

function isApplicationStatus(value: string): value is Application["status"] {
  return validStatuses.has(value as Application["status"]);
}

export async function PATCH(request: Request, { params }: ApplicationRouteContext) {
  const rateLimitResult = enforceRateLimit(request, {
    bucket: "applications-patch",
    limit: 50,
    windowMs: 60_000
  });
  if (!rateLimitResult.allowed) {
    return errorResponse(429, `Too many requests. Try again in ${rateLimitResult.retryAfterSeconds} seconds.`);
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return errorResponse(401, "Please sign in to update applications.");
  }

  const { id } = await params;
  const applicationContext = await getApplicationAuthorizationContext(id);

  if (!applicationContext) {
    return errorResponse(404, "Application not found.");
  }

  if (applicationContext.project.ownerId !== userId) {
    return errorResponse(403, "You do not have permission to update this application.");
  }

  const parsedBody = await parseJsonBody<{ status?: unknown }>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const statusResult = requireTrimmedString(parsedBody.data.status, "Application status", {
    maxLength: 24
  });
  if (!statusResult.ok) {
    return errorResponse(400, statusResult.error);
  }
  if (!isApplicationStatus(statusResult.value)) {
    return errorResponse(400, "Choose a valid application status.");
  }

  const application = await updateOwnedProjectApplicationStatus(id, statusResult.value, userId);

  if (!application) {
    return errorResponse(404, "Application not found.");
  }

  return NextResponse.json({ application });
}
