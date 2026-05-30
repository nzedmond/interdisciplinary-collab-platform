"use client";

import Link from "next/link";
import { BriefcaseBusiness, Clock, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";

export function MyProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProjects() {
      try {
        setIsLoadingProjects(true);
        setProjectError(null);

        const response = await fetch("/api/projects/mine", {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Projects could not be loaded.");
        }

        const data = (await response.json()) as { projects: Project[] };
        setProjects(data.projects);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setProjectError("Your projects could not be loaded.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingProjects(false);
        }
      }
    }

    loadProjects();

    return () => controller.abort();
  }, []);

  if (isLoadingProjects) {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-8 text-center shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Loading projects</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/65">
          Fetching your posted projects from the database.
        </p>
      </section>
    );
  }

  if (projectError) {
    return (
      <section className="rounded-lg border border-coral/30 bg-white p-8 text-center shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Projects unavailable</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/65">{projectError}</p>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-8 text-center shadow-soft">
        <h2 className="text-lg font-semibold text-ink">No posted projects yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/65">
          Database-backed projects you post will appear here.
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
      {projects.map((project) => (
        <article key={project.id} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">Open</span>
                <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-semibold text-blue">
                  {project.category}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-ink">{project.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/70">{project.description}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-ink/75 sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4 text-coral" />
              {project.departments.join(", ")}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-coral" />
              {project.commitment}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {project.requiredSkills.map((skill) => (
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
