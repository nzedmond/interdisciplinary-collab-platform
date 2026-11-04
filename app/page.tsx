import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getUserProfile } from "@/lib/project-repository";
import { getSessionUserId } from "@/lib/session-user";

export default async function Home() {
  const userId = await getSessionUserId();
  const profile = userId ? await getUserProfile(userId) : null;

  // No session, or a session whose user no longer exists (e.g. after re-seeding).
  if (!profile) {
    redirect("/login");
  }

  return <DashboardShell profile={profile} />;
}
