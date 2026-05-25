import Link from "next/link";
import { ArrowLeft, Lightbulb, ShieldCheck } from "lucide-react";
import { ProjectForm } from "@/components/project-form";

export default function NewProjectPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-lg border border-ink/10 bg-white/90 p-6 shadow-soft">
          <p className="text-sm font-semibold text-moss">Project posting</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink">Post a collaboration opportunity</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">
            Describe the project, the collaborators you need, and what a successful contribution looks like.
          </p>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-gold/30 bg-gold/10 p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <Lightbulb className="h-4 w-4 text-gold" />
              Strong postings
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              Name the work clearly, list concrete skills, and explain the outcome collaborators will help create.
            </p>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <ShieldCheck className="h-4 w-4 text-moss" />
              MVP note
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              This form validates and submits a draft. Database persistence comes in the next backend milestone.
            </p>
          </section>
        </aside>
      </div>

      <div className="mt-6">
        <ProjectForm />
      </div>
    </main>
  );
}
