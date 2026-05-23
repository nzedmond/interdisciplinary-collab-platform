import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Clock, Sparkles } from "lucide-react";
import { ApplicationForm } from "@/components/application-form";
import { getProjectById } from "@/lib/projects";

type ApplyPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { id } = await params;
  const project = getProjectById(id);

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={`/projects/${project.id}`}
        className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
      >
        <ArrowLeft className="h-4 w-4" />
        Project details
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-lg border border-ink/10 bg-white/90 p-6 shadow-soft">
          <p className="text-sm font-semibold text-moss">Project application</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink">{project.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">{project.description}</p>

          <div className="mt-5 grid gap-3 text-sm text-ink/75 sm:grid-cols-2">
            <span className="flex items-center gap-2 rounded-lg border border-ink/10 bg-paper p-3">
              <BriefcaseBusiness className="h-4 w-4 text-coral" />
              {project.departments.join(", ")}
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-ink/10 bg-paper p-3">
              <Clock className="h-4 w-4 text-coral" />
              {project.commitment}
            </span>
          </div>
        </section>

        <aside className="rounded-lg border border-gold/30 bg-gold/10 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-gold" />
            Match reason
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink/70">{project.recommendationReason}</p>
        </aside>
      </div>

      <div className="mt-6">
        <ApplicationForm projectId={project.id} />
      </div>
    </main>
  );
}
