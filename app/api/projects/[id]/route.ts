import { NextResponse } from "next/server";
import { errorResponse, parseJsonBody, requireTrimmedString } from "@/lib/api";
import { getProjectById } from "@/lib/projects";
import { updateOwnedProjectStatus } from "@/lib/project-repository";
import { getSessionUserId } from "@/lib/session-user";
import type { Project } from "@/lib/types";

type ProjectRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: ProjectRouteContext) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

const validProjectStatuses = new Set<Project["status"]>(["open", "reviewing", "filled"]);

function isProjectStatus(value: string): value is Project["status"] {
  return validProjectStatuses.has(value as Project["status"]);
}

export async function PATCH(request: Request, { params }: ProjectRouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return errorResponse(401, "Please sign in to update your project.");
  }

  const { id } = await params;
  const parsedBody = await parseJsonBody<{ status?: unknown }>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const statusResult = requireTrimmedString(parsedBody.data.status, "Project status", {
    maxLength: 24
  });
  if (!statusResult.ok) {
    return errorResponse(400, statusResult.error);
  }

  if (!isProjectStatus(statusResult.value)) {
    return errorResponse(400, "Choose a valid project status.");
  }

  const project = await updateOwnedProjectStatus(id, statusResult.value, userId);

  if (!project) {
    return errorResponse(404, "Project not found.");
  }

  return NextResponse.json({ project });
}
