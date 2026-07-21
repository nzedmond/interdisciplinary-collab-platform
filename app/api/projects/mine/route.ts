import { NextResponse } from "next/server";
import { getOwnedProjects } from "@/lib/project-repository";
import { getSessionUserId } from "@/lib/session-user";

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Please sign in to view your projects." }, { status: 401 });
  }

  const projects = await getOwnedProjects(userId);

  return NextResponse.json({ projects });
}
