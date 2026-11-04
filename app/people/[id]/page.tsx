import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Mail, MessageSquareText } from "lucide-react";
import { ApplicantDecision } from "@/components/applicant-decision";
import { ProfileView } from "@/components/profile-view";
import {
  canViewProfile,
  getApplicationsToOwnerFromApplicant,
  getUserProfile
} from "@/lib/project-repository";
import { getSessionUserId } from "@/lib/session-user";

type PersonPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  const viewerId = await getSessionUserId();

  if (!viewerId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/people/${id}`)}`);
  }

  if (viewerId === id) {
    redirect("/profile");
  }

  // Same response for "doesn't exist" and "not allowed", so profiles can't be probed.
  if (!(await canViewProfile(viewerId, id))) {
    notFound();
  }

  const [profile, applications] = await Promise.all([
    getUserProfile(id),
    getApplicationsToOwnerFromApplicant(viewerId, id)
  ]);

  if (!profile) {
    notFound();
  }

  const firstName = profile.name.split(" ")[0];
  const contactSubject = applications[0]
    ? `Your application to "${applications[0].projectTitle}"`
    : "Collab Commons";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/projects/mine"
          className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
        >
          <ArrowLeft className="h-4 w-4" />
          My projects
        </Link>
        {profile.email ? (
          <a
            href={`mailto:${profile.email}?subject=${encodeURIComponent(contactSubject)}`}
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
          >
            <Mail className="h-4 w-4" />
            Email {firstName}
          </a>
        ) : null}
      </div>

      {applications.length > 0 ? (
        <section className="mb-6 rounded-lg border border-moss/20 bg-white p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <MessageSquareText className="h-4 w-4 text-moss" />
            Applied to your projects
          </h2>
          <div className="mt-4 space-y-3">
            {applications.map((application) => (
              <div key={application.id} className="rounded-lg border border-ink/10 bg-paper p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/projects/${application.projectId}`}
                      className="text-sm font-semibold text-ink hover:text-moss hover:underline"
                    >
                      {application.projectTitle}
                    </Link>
                    <p className="mt-1 text-xs text-ink/60">Applied {application.submittedAt}</p>
                  </div>
                  <ApplicantDecision applicationId={application.id} initialStatus={application.status} />
                </div>
                {application.message ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink/75">{application.message}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ProfileView profile={profile} />
    </main>
  );
}
