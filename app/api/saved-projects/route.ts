import { NextResponse } from "next/server";
import { getSavedProjectIds, setSavedProject } from "@/lib/project-repository";
import { errorResponse, parseJsonBody, requireBoolean, requireTrimmedString } from "@/lib/api";
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
