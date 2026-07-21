import { NextResponse } from "next/server";
import { getApplicationsForCurrentUser } from "@/lib/project-repository";
import { getSessionUserId } from "@/lib/session-user";

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Please sign in to view your applications." }, { status: 401 });
  }

  const applications = await getApplicationsForCurrentUser(userId);

  return NextResponse.json({ applications });
}
