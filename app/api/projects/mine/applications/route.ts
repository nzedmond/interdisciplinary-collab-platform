import { NextResponse } from "next/server";
import { getApplicationsForOwnedProjects } from "@/lib/project-repository";
import { getSessionUserId } from "@/lib/session-user";

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Please sign in to view project applicants." }, { status: 401 });
  }

  const applications = await getApplicationsForOwnedProjects(userId);

  return NextResponse.json({ applications });
}
