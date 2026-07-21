import { NextResponse } from "next/server";
import { createProject, getProjects } from "@/lib/project-repository";
import {
  errorResponse,
  parseJsonBody,
  requireStringArray,
  requireTrimmedString
} from "@/lib/api";
import { getSessionUserId } from "@/lib/session-user";
import type { Project } from "@/lib/types";

type CreateProjectRequest = Partial<Project>;

export async function GET() {
  const projects = await getProjects();

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return errorResponse(401, "Please sign in to post a project.");
  }

  const parsedBody = await parseJsonBody<CreateProjectRequest>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const title = requireTrimmedString(parsedBody.data.title, "Project title", {
    minLength: 6,
    maxLength: 120
  });
  if (!title.ok) {
    return errorResponse(400, title.error);
  }

  const description = requireTrimmedString(parsedBody.data.description, "Project description", {
    minLength: 40,
    maxLength: 4000
  });
  if (!description.ok) {
    return errorResponse(400, description.error);
  }

  const departments = requireStringArray(parsedBody.data.departments, "Departments", {
    minItems: 1,
    maxItems: 5,
    maxItemLength: 80
  });
  if (!departments.ok) {
    return errorResponse(400, departments.error);
  }

  const requiredSkills = requireStringArray(parsedBody.data.requiredSkills, "Required skills", {
    minItems: 1,
    maxItems: 20,
    maxItemLength: 60
  });
  if (!requiredSkills.ok) {
    return errorResponse(400, requiredSkills.error);
  }

  const helpfulSkills = requireStringArray(parsedBody.data.helpfulSkills ?? [], "Helpful skills", {
    maxItems: 20,
    maxItemLength: 60
  });
  if (!helpfulSkills.ok) {
    return errorResponse(400, helpfulSkills.error);
  }

  const category = requireTrimmedString(parsedBody.data.category ?? "Research + Public Scholarship", "Category", {
    maxLength: 120
  });
  if (!category.ok) {
    return errorResponse(400, category.error);
  }

  const commitment = requireTrimmedString(parsedBody.data.commitment ?? "3-5 hrs/week", "Time commitment", {
    maxLength: 120
  });
  if (!commitment.ok) {
    return errorResponse(400, commitment.error);
  }

  const duration = requireTrimmedString(parsedBody.data.duration ?? "Semester", "Duration", {
    maxLength: 120
  });
  if (!duration.ok) {
    return errorResponse(400, duration.error);
  }

  const rawGoals =
    Array.isArray(parsedBody.data.goals) && parsedBody.data.goals.length > 0
      ? parsedBody.data.goals
      : ["Recruit collaborators"];
  const goals = requireStringArray(rawGoals, "Collaboration goals", {
    minItems: 1,
    maxItems: 10,
    maxItemLength: 160
  });
  if (!goals.ok) {
    return errorResponse(400, goals.error);
  }

  const project = await createProject(
    {
      title: title.value,
      description: description.value,
      departments: departments.value,
      category: category.value,
      requiredSkills: requiredSkills.value,
      helpfulSkills: helpfulSkills.value,
      commitment: commitment.value,
      duration: duration.value,
      goals: goals.value
    },
    userId
  );

  return NextResponse.json({ project }, { status: 201 });
}
