import { NextResponse } from "next/server";
import { getApplicationsForOwnedProjects } from "@/lib/project-repository";

export async function GET() {
  const applications = await getApplicationsForOwnedProjects();

  return NextResponse.json({ applications });
}
