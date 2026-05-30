import { NextResponse } from "next/server";
import { getApplicationsForCurrentUser } from "@/lib/project-repository";

export async function GET() {
  const applications = await getApplicationsForCurrentUser();

  return NextResponse.json({ applications });
}
