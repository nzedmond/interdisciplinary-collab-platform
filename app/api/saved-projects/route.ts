import { NextResponse } from "next/server";
import { getSavedProjectIds, setSavedProject } from "@/lib/project-repository";
import { errorResponse, parseJsonBody, requireBoolean, requireTrimmedString } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionUserId } from "@/lib/session-user";

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return errorResponse(401, "Please sign in to manage saved projects.");
  }

  const savedProjectIds = await getSavedProjectIds(userId);

  return NextResponse.json({ savedProjectIds });
}

export async function PUT(request: Request) {
  const rateLimitResult = enforceRateLimit(request, {
    bucket: "saved-projects-put",
    limit: 80,
    windowMs: 60_000
  });
  if (!rateLimitResult.allowed) {
    return errorResponse(429, `Too many requests. Try again in ${rateLimitResult.retryAfterSeconds} seconds.`);
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return errorResponse(401, "Please sign in to save projects.");
  }

  const parsedBody = await parseJsonBody<{ projectId?: unknown; isSaved?: unknown }>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const projectId = requireTrimmedString(parsedBody.data.projectId, "Project ID", { maxLength: 80 });
  if (!projectId.ok) {
    return errorResponse(400, projectId.error);
  }

  const isSaved = requireBoolean(parsedBody.data.isSaved, "isSaved");
  if (!isSaved.ok) {
    return errorResponse(400, isSaved.error);
  }

  const savedProjectIds = await setSavedProject(projectId.value, isSaved.value, userId);

  if (!savedProjectIds) {
    return errorResponse(404, "Project not found.");
  }

  return NextResponse.json({ savedProjectIds });
}
