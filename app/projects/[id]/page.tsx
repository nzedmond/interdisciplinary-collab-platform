import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  Users
} from "lucide-react";
import { SaveProjectButton } from "@/components/save-project-button";
import { getProjectById } from "@/lib/projects";
import { cn } from "@/lib/utils";

type ProjectDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const statusStyles = {
  open: "bg-moss/10 text-moss",
  reviewing: "bg-gold/20 text-ink",
  filled: "bg-ink/10 text-ink"
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const project = getProjectById(id);

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>

      <section className="mt-5 rounded-lg border border-ink/10 bg-white/90 p-6 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusStyles[project.status])}>
                {project.status === "open" ? "Open" : project.status === "reviewing" ? "Reviewing" : "Filled"}
              </span>
              <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-semibold text-blue">
                {project.category}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-normal text-ink">{project.title}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">{project.description}</p>
          </div>
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg border border-moss/20 bg-moss/5">
            <span className="text-2xl font-bold text-moss">{project.matchScore}</span>
            <span className="text-xs font-semibold uppercase text-moss/80">match</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 text-sm text-ink/75 md:grid-cols-2 xl:grid-cols-4">
          <span className="flex items-center gap-2 rounded-lg border border-ink/10 bg-paper p-3">
            <GraduationCap className="h-4 w-4 text-coral" />
            {project.owner}
          </span>
          <span className="flex items-center gap-2 rounded-lg border border-ink/10 bg-paper p-3">
            <BriefcaseBusiness className="h-4 w-4 text-coral" />
            {project.departments.join(", ")}
          </span>
          <span className="flex items-center gap-2 rounded-lg border border-ink/10 bg-paper p-3">
            <Clock className="h-4 w-4 text-coral" />
            {project.commitment}
          </span>
          <span className="flex items-center gap-2 rounded-lg border border-ink/10 bg-paper p-3">
            <CalendarDays className="h-4 w-4 text-coral" />
            {project.duration}
          </span>
        </div>

        <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 p-4">
          <p className="flex gap-2 text-sm leading-6 text-ink/75">
            <Sparkles className="mt-1 h-4 w-4 shrink-0 text-gold" />
            {project.recommendationReason}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/projects/${project.id}/apply`}
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
          >
            <Sparkles className="h-4 w-4" />
            Apply
          </Link>
          <SaveProjectButton projectId={project.id} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Collaboration goals</h2>
          <div className="mt-4 space-y-3">
            {project.goals.map((goal) => (
              <p key={goal} className="flex gap-3 text-sm leading-6 text-ink/70">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-moss" />
                {goal}
              </p>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Skills needed</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.requiredSkills.map((skill) => (
                <span key={skill} className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Helpful skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.helpfulSkills.map((skill) => (
                <span key={skill} className="rounded-full border border-ink/10 px-3 py-1 text-xs font-medium text-ink/75">
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Interest</h2>
            <p className="mt-3 flex items-center gap-2 text-sm text-ink/70">
              <Users className="h-4 w-4 text-coral" />
              {project.applicants} applicants are already interested.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
