import { NextResponse } from "next/server";
import {
  createApplication,
  getProjectAuthorizationContext
} from "@/lib/project-repository";
import { errorResponse, parseJsonBody, requireTrimmedString } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionUserId } from "@/lib/session-user";

type ApplicationRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CreateApplicationRequest = {
  message?: unknown;
  availability?: unknown;
};

const availabilityOptions = new Set(["1-3 hrs/week", "3-5 hrs/week", "5-7 hrs/week", "8+ hrs/week"]);

export async function POST(request: Request, { params }: ApplicationRouteContext) {
  const rateLimitResult = enforceRateLimit(request, {
    bucket: "project-applications-post",
    limit: 40,
    windowMs: 60_000
  });
  if (!rateLimitResult.allowed) {
    return errorResponse(429, `Too many requests. Try again in ${rateLimitResult.retryAfterSeconds} seconds.`);
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return errorResponse(401, "Please sign in to apply to projects.");
  }

  const { id } = await params;
  const projectContext = await getProjectAuthorizationContext(id);

  if (!projectContext) {
    return errorResponse(404, "Project not found.");
  }

  if (projectContext.ownerId === userId) {
    return errorResponse(403, "You cannot apply to your own project.");
  }

  if (projectContext.status !== "OPEN") {
    return errorResponse(409, "Applications are closed for this project.");
  }

  const parsedBody = await parseJsonBody<CreateApplicationRequest>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const message = requireTrimmedString(parsedBody.data.message, "Interest note", {
    minLength: 20,
    maxLength: 2000
  });
  if (!message.ok) {
    return errorResponse(400, message.error);
  }

  const availability = requireTrimmedString(parsedBody.data.availability, "Weekly availability", {
    maxLength: 20
  });
  if (!availability.ok) {
    return errorResponse(400, availability.error);
  }

  if (!availabilityOptions.has(availability.value)) {
    return errorResponse(400, "Weekly availability must match one of the allowed options.");
  }

  const application = await createApplication(
    {
      projectId: id,
      message: message.value,
      availability: availability.value
    },
    userId
  );

  if (!application) {
    return errorResponse(404, "Project not found.");
  }

  return NextResponse.json({ application }, { status: 201 });
}
