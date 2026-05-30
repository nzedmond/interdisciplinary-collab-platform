import { NextResponse } from "next/server";
import { createProject, getProjects } from "@/lib/project-repository";
import type { Project } from "@/lib/types";

export async function GET() {
  const projects = await getProjects();

  return NextResponse.json({ projects });
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

  const project = await createProject({
    title: body.title.trim(),
    description: body.description.trim(),
    departments: body.departments,
    category: body.category?.trim() || "Research + Public Scholarship",
    requiredSkills: body.requiredSkills,
    helpfulSkills: body.helpfulSkills ?? [],
    commitment: body.commitment?.trim() || "3-5 hrs/week",
    duration: body.duration?.trim() || "Semester",
    goals: body.goals && body.goals.length > 0 ? body.goals : ["Recruit collaborators"]
  });

  return NextResponse.json({ project }, { status: 201 });
}
