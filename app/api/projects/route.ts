import { NextResponse } from "next/server";
import { getProjects } from "@/lib/projects";

export async function GET() {
  return NextResponse.json({ projects: getProjects() });
}
