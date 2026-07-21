import { NextResponse } from "next/server";
import {
  errorResponse,
  optionalInteger,
  optionalTrimmedString,
  parseJsonBody,
  requireStringArray,
  requireTrimmedString
} from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionUserId } from "@/lib/session-user";
import { getUserProfile, updateUserProfile } from "@/lib/project-repository";

type UpdateProfileRequest = {
  name?: unknown;
  department?: unknown;
  majorOrTitle?: unknown;
  graduationYear?: unknown;
  portfolioUrl?: unknown;
  githubUrl?: unknown;
  skills?: unknown;
  interests?: unknown;
};

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return errorResponse(401, "Please sign in to view your profile.");
  }

  const profile = await getUserProfile(userId);
  if (!profile) {
    return errorResponse(404, "Profile not found.");
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const rateLimitResult = enforceRateLimit(request, {
    bucket: "profile-patch",
    limit: 25,
    windowMs: 60_000
  });
  if (!rateLimitResult.allowed) {
    return errorResponse(429, `Too many requests. Try again in ${rateLimitResult.retryAfterSeconds} seconds.`);
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return errorResponse(401, "Please sign in to update your profile.");
  }

  const parsedBody = await parseJsonBody<UpdateProfileRequest>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const name = requireTrimmedString(parsedBody.data.name, "Name", {
    minLength: 2,
    maxLength: 120
  });
  if (!name.ok) {
    return errorResponse(400, name.error);
  }

  const department = requireTrimmedString(parsedBody.data.department, "Department", {
    minLength: 2,
    maxLength: 120
  });
  if (!department.ok) {
    return errorResponse(400, department.error);
  }

  const majorOrTitle = requireTrimmedString(parsedBody.data.majorOrTitle, "Major or title", {
    minLength: 2,
    maxLength: 160
  });
  if (!majorOrTitle.ok) {
    return errorResponse(400, majorOrTitle.error);
  }

  const graduationYear = optionalInteger(parsedBody.data.graduationYear, "Graduation year", {
    min: 2020,
    max: 2100
  });
  if (!graduationYear.ok) {
    return errorResponse(400, graduationYear.error);
  }

  const portfolioUrl = optionalTrimmedString(parsedBody.data.portfolioUrl, "Portfolio URL", {
    maxLength: 300
  });
  if (!portfolioUrl.ok) {
    return errorResponse(400, portfolioUrl.error);
  }

  const githubUrl = optionalTrimmedString(parsedBody.data.githubUrl, "GitHub URL", {
    maxLength: 300
  });
  if (!githubUrl.ok) {
    return errorResponse(400, githubUrl.error);
  }

  const skills = requireStringArray(parsedBody.data.skills ?? [], "Skills", {
    maxItems: 25,
    maxItemLength: 80
  });
  if (!skills.ok) {
    return errorResponse(400, skills.error);
  }

  const interests = requireStringArray(parsedBody.data.interests ?? [], "Interests", {
    maxItems: 25,
    maxItemLength: 80
  });
  if (!interests.ok) {
    return errorResponse(400, interests.error);
  }

  const profile = await updateUserProfile(userId, {
    name: name.value,
    department: department.value,
    majorOrTitle: majorOrTitle.value,
    graduationYear: graduationYear.value,
    portfolioUrl: portfolioUrl.value,
    githubUrl: githubUrl.value,
    skills: skills.value,
    interests: interests.value
  });

  if (!profile) {
    return errorResponse(404, "Profile not found.");
  }

  return NextResponse.json({ profile });
}
