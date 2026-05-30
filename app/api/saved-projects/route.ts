import { NextResponse } from "next/server";
import { getSavedProjectIds, setSavedProject } from "@/lib/project-repository";

export async function GET() {
  const savedProjectIds = await getSavedProjectIds();

  return NextResponse.json({ savedProjectIds });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    projectId?: string;
    isSaved?: boolean;
  };

  if (!body.projectId) {
    return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
  }

  const savedProjectIds = await setSavedProject(body.projectId, Boolean(body.isSaved));

  if (!savedProjectIds) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ savedProjectIds });
}
