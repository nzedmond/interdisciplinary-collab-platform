import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { ProfileView } from "@/components/profile-view";
import { getUserProfile } from "@/lib/project-repository";
import { getSessionUserId } from "@/lib/session-user";

export default async function ProfilePage() {
  const userId = await getSessionUserId();
  const profile = userId ? await getUserProfile(userId) : null;

  if (!profile) {
    redirect("/login?callbackUrl=%2Fprofile");
  }

  const isIncomplete = profile.skills.length === 0 || !profile.bio;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/profile/edit"
          className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
        >
          <Pencil className="h-4 w-4" />
          Edit profile
        </Link>
      </div>

      {isIncomplete ? (
        <p className="mb-5 rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm leading-6 text-ink/75">
          Project owners see this profile when you apply, and your skills drive your match scores.{" "}
          <Link href="/profile/edit" className="font-semibold text-moss hover:underline">
            Complete your profile
          </Link>{" "}
          to get better recommendations.
        </p>
      ) : null}

      <ProfileView profile={profile} emptyHint="Not added yet." />
    </main>
  );
}
