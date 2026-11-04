"use client";

import Link from "next/link";
import { Archive, ArchiveRestore, BadgeCheck, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminProject } from "@/lib/admin-repository";
import { cn } from "@/lib/utils";

type Filter = "attention" | "all" | "archived";

const filters: { value: Filter; label: string }[] = [
  { value: "attention", label: "Needs verification" },
  { value: "all", label: "All projects" },
  { value: "archived", label: "Archived" }
];

const statusStyles: Record<AdminProject["status"], string> = {
  open: "bg-moss/10 text-moss",
  reviewing: "bg-gold/20 text-ink",
  filled: "bg-ink/10 text-ink",
  archived: "bg-coral/10 text-coral"
};

const buttonClass =
  "focus-ring inline-flex items-center gap-1 rounded-md border border-ink/15 bg-white px-2 py-1 text-xs font-semibold text-ink/80 transition disabled:opacity-60";

export function AdminProjects({ initialProjects }: { initialProjects: AdminProject[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [filter, setFilter] = useState<Filter>("attention");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleProjects = useMemo(
    () =>
      projects.filter((project) =>
        filter === "archived"
          ? project.status === "archived"
          : filter === "attention"
            ? !project.verified && project.status !== "archived"
            : true
      ),
    [filter, projects]
  );

  async function moderate(projectId: string, change: { verified?: boolean; archived?: boolean }) {
    setPendingId(projectId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change)
      });
      const data = (await response.json()) as { project?: AdminProject; error?: string };

      if (!response.ok || !data.project) {
        throw new Error(data.error ?? "The project could not be updated.");
      }

      setProjects((current) => current.map((project) => (project.id === projectId ? data.project! : project)));
    } catch (moderateError) {
      setError(moderateError instanceof Error ? moderateError.message : "The project could not be updated.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Projects</h2>
        <div className="flex flex-wrap gap-1 rounded-md border border-ink/10 bg-paper p-1" role="tablist">
          {filters.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "focus-ring rounded px-3 py-1 text-xs font-semibold transition",
                filter === option.value ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
          {error}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {visibleProjects.length === 0 ? (
          <p className="rounded-lg border border-ink/10 bg-paper p-4 text-sm text-ink/60">
            {filter === "attention" ? "Every active project is verified." : "No projects here."}
          </p>
        ) : null}

        {visibleProjects.map((project) => {
          const isPending = pendingId === project.id;
          const isArchived = project.status === "archived";

          return (
            <div
              key={project.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-ink/10 bg-paper p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-sm font-semibold text-ink hover:text-moss hover:underline"
                  >
                    {project.title}
                  </Link>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", statusStyles[project.status])}>
                    {project.status}
                  </span>
                  {project.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-moss px-2 py-0.5 text-xs font-semibold text-white">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-ink/60">
                  {project.ownerName} ({project.ownerEmail}){project.ownerSuspended ? " · owner suspended" : ""} ·{" "}
                  {project.departments.join(", ")} · {project.applicants} applicant{project.applicants === 1 ? "" : "s"} ·
                  posted {project.createdAt}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {isArchived ? null : project.verified ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => moderate(project.id, { verified: false })}
                    className={cn(buttonClass, "hover:border-ink hover:text-ink")}
                  >
                    <Undo2 className="h-3 w-3" />
                    Unverify
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => moderate(project.id, { verified: true })}
                    className={cn(buttonClass, "hover:border-moss hover:text-moss")}
                  >
                    <BadgeCheck className="h-3 w-3" />
                    Verify
                  </button>
                )}
                {isArchived ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => moderate(project.id, { archived: false })}
                    className={cn(buttonClass, "hover:border-moss hover:text-moss")}
                  >
                    <ArchiveRestore className="h-3 w-3" />
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => moderate(project.id, { archived: true })}
                    className={cn(buttonClass, "hover:border-coral hover:text-coral")}
                  >
                    <Archive className="h-3 w-3" />
                    Archive
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
