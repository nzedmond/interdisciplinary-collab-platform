import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/projects";

type ApplicationRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: ApplicationRouteContext) {
  const { id } = await params;
  const project = getProjectById(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = (await request.json()) as {
    message?: string;
    availability?: string;
  };

  if (!body.message || body.message.trim().length < 20) {
    return NextResponse.json(
      { error: "Please include a short note about your interest." },
      { status: 400 }
    );
  }

  if (!body.availability) {
    return NextResponse.json(
      { error: "Please choose your weekly availability." },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      application: {
        id: `mock-${project.id}`,
        projectId: project.id,
        status: "submitted"
      }
    },
    { status: 201 }
  );
}
