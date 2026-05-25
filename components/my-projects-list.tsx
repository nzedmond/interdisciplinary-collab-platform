"use client";

import Link from "next/link";
import { BriefcaseBusiness, Clock, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { getProjectDrafts } from "@/lib/project-drafts";
import type { Project } from "@/lib/types";

export function MyProjectsList() {
  const [drafts, setDrafts] = useState<Project[]>([]);

  useEffect(() => {
    setDrafts(getProjectDrafts());
  }, []);

  if (drafts.length === 0) {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-8 text-center shadow-soft">
        <h2 className="text-lg font-semibold text-ink">No draft projects yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/65">
          Posted projects will appear here while the MVP is using local draft storage.
        </p>
        <Link
          href="/projects/new"
          className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
        >
          <Plus className="h-4 w-4" />
          Post project
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {drafts.map((draft) => (
        <article key={draft.id} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">Draft</span>
                <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-semibold text-blue">
                  {draft.category}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-ink">{draft.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/70">{draft.description}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-ink/75 sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4 text-coral" />
              {draft.departments.join(", ")}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-coral" />
              {draft.commitment}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {draft.requiredSkills.map((skill) => (
              <span key={skill} className="rounded-full border border-ink/10 px-3 py-1 text-xs font-medium text-ink/75">
                {skill}
              </span>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
