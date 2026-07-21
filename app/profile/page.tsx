import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/api/auth/signin?callbackUrl=%2Fprofile");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <section className="mt-5 rounded-lg border border-ink/10 bg-white/90 p-6 shadow-soft">
        <p className="text-sm font-semibold text-moss">Profile</p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink">Edit your collaboration profile</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">
          Keep your details, skills, and interests current so project recommendations and owner review are more accurate.
        </p>
      </section>

      <div className="mt-6">
        <ProfileForm />
      </div>
    </main>
  );
}
