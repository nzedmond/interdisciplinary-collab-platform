import { NextResponse } from "next/server";
import { updateOwnedProjectApplicationStatus } from "@/lib/project-repository";
import type { Application } from "@/lib/types";

type ApplicationRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const validStatuses = new Set(["submitted", "interview", "accepted", "declined"]);

export async function PATCH(request: Request, { params }: ApplicationRouteContext) {
  const { id } = await params;
  const body = (await request.json()) as {
    status?: Application["status"];
  };

  if (!body.status || !validStatuses.has(body.status)) {
    return NextResponse.json({ error: "Choose a valid application status." }, { status: 400 });
  }

  const application = await updateOwnedProjectApplicationStatus(id, body.status);

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  return NextResponse.json({ application });
}
