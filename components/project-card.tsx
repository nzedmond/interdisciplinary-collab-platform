import Link from "next/link";
import { Bookmark, BriefcaseBusiness, Clock, GraduationCap, Sparkles, Users } from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
  isSaved: boolean;
  onToggleSaved: (projectId: string) => void;
};

const statusStyles = {
  open: "bg-moss/10 text-moss",
  reviewing: "bg-gold/20 text-ink",
  filled: "bg-ink/10 text-ink"
};

export function ProjectCard({ project, isSaved, onToggleSaved }: ProjectCardProps) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusStyles[project.status])}>
              {project.status === "open" ? "Open" : project.status === "reviewing" ? "Reviewing" : "Filled"}
            </span>
            <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-semibold text-blue">
              {project.category}
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-normal text-ink">{project.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/70">{project.description}</p>
        </div>
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-moss/20 bg-moss/5">
          <span className="text-xl font-bold text-moss">{project.matchScore}</span>
          <span className="text-[11px] font-semibold uppercase text-moss/80">match</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-ink/75 sm:grid-cols-2 lg:grid-cols-4">
        <span className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-coral" />
          {project.owner}
        </span>
        <span className="flex items-center gap-2">
          <BriefcaseBusiness className="h-4 w-4 text-coral" />
          {project.departments.join(", ")}
        </span>
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-coral" />
          {project.commitment}
        </span>
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 text-coral" />
          {project.applicants} applicants
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[...project.requiredSkills, ...project.helpfulSkills.slice(0, 2)].map((skill) => (
          <span key={skill} className="rounded-full border border-ink/10 px-3 py-1 text-xs font-medium text-ink/75">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-gold/30 bg-gold/10 p-3">
        <p className="flex gap-2 text-sm leading-6 text-ink/75">
          <Sparkles className="mt-1 h-4 w-4 shrink-0 text-gold" />
          {project.recommendationReason}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/projects/${project.id}`}
          className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
        >
          <Sparkles className="h-4 w-4" />
          View details
        </Link>
        <button
          type="button"
          onClick={() => onToggleSaved(project.id)}
          aria-pressed={isSaved}
          className={cn(
            "focus-ring inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition",
            isSaved
              ? "border-moss bg-moss/10 text-moss"
              : "border-ink/15 text-ink hover:border-moss hover:text-moss"
          )}
        >
          <Bookmark className={cn("h-4 w-4", isSaved ? "fill-moss" : "")} />
          {isSaved ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  );
}
