import { NextResponse } from "next/server";
import { getProjects } from "@/lib/projects";
import type { Project } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ projects: getProjects() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Project>;

  if (!body.title || body.title.trim().length < 6) {
    return NextResponse.json({ error: "Project title must be at least 6 characters." }, { status: 400 });
  }

  if (!body.description || body.description.trim().length < 40) {
    return NextResponse.json(
      { error: "Project description must be at least 40 characters." },
      { status: 400 }
    );
  }

  if (!body.departments || body.departments.length === 0) {
    return NextResponse.json({ error: "Choose at least one department." }, { status: 400 });
  }

  if (!body.requiredSkills || body.requiredSkills.length === 0) {
    return NextResponse.json({ error: "Add at least one required skill." }, { status: 400 });
  }

  const project: Project = {
    id: `draft-${Date.now()}`,
    title: body.title.trim(),
    owner: body.owner?.trim() || "Maya Johnson",
    ownerRole: body.ownerRole ?? "Student",
    departments: body.departments,
    category: body.category?.trim() || "Research + Public Scholarship",
    description: body.description.trim(),
    requiredSkills: body.requiredSkills,
    helpfulSkills: body.helpfulSkills ?? [],
    commitment: body.commitment?.trim() || "3-5 hrs/week",
    duration: body.duration?.trim() || "Semester",
    goals: body.goals && body.goals.length > 0 ? body.goals : ["Recruit collaborators"],
    status: "open",
    applicants: 0,
    matchScore: 72,
    recommendationReason: "Newly posted project. Recommendations will improve once embeddings are connected."
  };

  return NextResponse.json({ project }, { status: 201 });
}
