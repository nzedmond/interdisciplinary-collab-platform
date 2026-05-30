import { NextResponse } from "next/server";
import { getOwnedProjects } from "@/lib/project-repository";

export async function GET() {
  const projects = await getOwnedProjects();

  return NextResponse.json({ projects });
}
