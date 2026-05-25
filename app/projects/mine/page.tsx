import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { MyProjectsList } from "@/components/my-projects-list";

export default function MyProjectsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/projects/new"
          className="focus-ring inline-flex items-center gap-2 rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink"
        >
          <Plus className="h-4 w-4" />
          Post project
        </Link>
      </div>

      <section className="mt-5 rounded-lg border border-ink/10 bg-white/90 p-6 shadow-soft">
        <p className="text-sm font-semibold text-moss">Project owner workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink">My projects</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">
          Review project drafts created during this MVP flow before database persistence is connected.
        </p>
      </section>

      <div className="mt-6">
        <MyProjectsList />
      </div>
    </main>
  );
}
