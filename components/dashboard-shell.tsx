"use client";

import Link from "next/link";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Filter,
  LayoutDashboard,
  Plus,
  Search,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProjectCard } from "@/components/project-card";
import { applications, categories, currentUser, departments } from "@/lib/data";
import type { Project } from "@/lib/types";
import { useSavedProjects } from "@/lib/use-saved-projects";
import { statusLabel } from "@/lib/utils";

export function DashboardShell() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState(departments[0]);
  const [category, setCategory] = useState(categories[0]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const { savedProjectIds, toggleSavedProject } = useSavedProjects();

  useEffect(() => {
    const controller = new AbortController();

    async function loadProjects() {
      try {
        setIsLoadingProjects(true);
        setProjectError(null);

        const response = await fetch("/api/projects", {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Project list could not be loaded.");
        }

        const data = (await response.json()) as { projects: Project[] };
        setProjects(data.projects);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setProjectError("Project list could not be loaded.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingProjects(false);
        }
      }
    }

    loadProjects();

    return () => controller.abort();
  }, []);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          project.title,
          project.description,
          project.category,
          ...project.departments,
          ...project.requiredSkills,
          ...project.helpfulSkills
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesDepartment =
        department === "All departments" || project.departments.includes(department);
      const matchesCategory = category === "All categories" || project.category === category;

      return matchesQuery && matchesDepartment && matchesCategory;
    });
  }, [category, department, projects, query]);

  const openProjects = projects.filter((project) => project.status === "open").length;
  const averageMatch =
    projects.length > 0
      ? Math.round(projects.reduce((sum, project) => sum + project.matchScore, 0) / projects.length)
      : 0;

  return (
    <main className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:px-8">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-4 rounded-lg border border-ink/10 bg-white/85 p-4 shadow-soft backdrop-blur">
          <div className="flex items-center gap-3 border-b border-ink/10 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-moss text-sm font-bold text-white">
              CC
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Collab Commons</p>
              <p className="text-xs text-ink/60">Campus discovery</p>
            </div>
          </div>
          <nav className="mt-4 space-y-1">
            {[
              ["Dashboard", LayoutDashboard],
              ["Projects", Search],
              ["Applications", Bell],
              ["Admin", ShieldCheck],
              ["Analytics", BarChart3]
            ].map(([label, Icon]) => (
              <a
                key={label as string}
                href="#"
                className="focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-moss/10 hover:text-moss"
              >
                <Icon className="h-4 w-4" />
                {label as string}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="rounded-lg border border-ink/10 bg-white/90 p-5 shadow-soft backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-moss">Interdisciplinary project discovery</p>
              <h1 className="mt-1 text-3xl font-bold tracking-normal text-ink">Find campus collaborators</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/70">
                Browse open academic, creative, and technical projects matched to your skills, interests, and goals.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/projects/new"
                className="focus-ring inline-flex items-center gap-2 rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink"
              >
                <Plus className="h-4 w-4" />
                Post project
              </Link>
              <Link
                href="/projects/mine"
                className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                My projects
              </Link>
              <button className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss">
                <UserRound className="h-4 w-4" />
                Profile
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-ink/10 bg-paper p-4">
              <p className="text-xs font-semibold uppercase text-ink/50">Recommended match</p>
              <p className="mt-1 text-2xl font-bold text-ink">{averageMatch}%</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-paper p-4">
              <p className="text-xs font-semibold uppercase text-ink/50">Open projects</p>
              <p className="mt-1 text-2xl font-bold text-ink">{openProjects}</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-paper p-4">
              <p className="text-xs font-semibold uppercase text-ink/50">Saved projects</p>
              <p className="mt-1 text-2xl font-bold text-ink">{savedProjectIds.length}</p>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0 space-y-4">
            <section className="rounded-lg border border-ink/10 bg-white/90 p-4 shadow-soft">
              <div className="flex flex-wrap items-center gap-3">
                <label className="relative min-w-64 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
                  <span className="sr-only">Search projects</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="focus-ring w-full rounded-md border border-ink/15 bg-white py-2 pl-10 pr-3 text-sm text-ink"
                    placeholder="Search by skill, topic, or keyword"
                  />
                </label>
                <label className="flex min-w-52 items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2">
                  <Filter className="h-4 w-4 text-ink/50" />
                  <span className="sr-only">Department</span>
                  <select
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                    className="focus-ring w-full bg-transparent text-sm text-ink outline-none"
                  >
                    {departments.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="flex min-w-52 items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2">
                  <Filter className="h-4 w-4 text-ink/50" />
                  <span className="sr-only">Category</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="focus-ring w-full bg-transparent text-sm text-ink outline-none"
                  >
                    {categories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            {isLoadingProjects ? (
              <section className="rounded-lg border border-ink/10 bg-white p-8 text-center shadow-soft">
                <h2 className="text-lg font-semibold text-ink">Loading projects</h2>
                <p className="mt-2 text-sm text-ink/65">Fetching the latest open collaborations.</p>
              </section>
            ) : null}

            {projectError ? (
              <section className="rounded-lg border border-coral/30 bg-white p-8 text-center shadow-soft">
                <h2 className="text-lg font-semibold text-ink">Projects unavailable</h2>
                <p className="mt-2 text-sm text-ink/65">{projectError}</p>
              </section>
            ) : null}

            {!isLoadingProjects && !projectError
              ? filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isSaved={savedProjectIds.includes(project.id)}
                    onToggleSaved={toggleSavedProject}
                  />
                ))
              : null}

            {!isLoadingProjects && !projectError && filteredProjects.length === 0 ? (
              <section className="rounded-lg border border-ink/10 bg-white p-8 text-center shadow-soft">
                <h2 className="text-lg font-semibold text-ink">No matching projects</h2>
                <p className="mt-2 text-sm text-ink/65">Try a broader department, category, or keyword.</p>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-ink/10 bg-white/90 p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">{currentUser.name}</h2>
              <p className="mt-1 text-sm text-ink/65">{currentUser.majorOrTitle}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {currentUser.skills.slice(0, 5).map((skill) => (
                  <span key={skill} className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-ink/10 bg-white/90 p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Applications</h2>
              <div className="mt-4 space-y-3">
                {applications.map((application) => (
                  <div key={application.id} className="rounded-lg border border-ink/10 p-3">
                    <p className="text-sm font-semibold text-ink">{application.projectTitle}</p>
                    <p className="mt-1 text-xs text-ink/60">
                      {statusLabel(application.status)} · {application.submittedAt}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-ink/10 bg-white/90 p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">MVP coverage</h2>
              <div className="mt-4 space-y-3 text-sm text-ink/70">
                <p>Project browsing, search, filters, match explanations, saved/apply actions, profile snapshot, and application status.</p>
                <p>Next step is wiring these flows to Auth.js, Prisma, PostgreSQL, and embeddings.</p>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
