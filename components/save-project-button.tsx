"use client";

import { Bookmark } from "lucide-react";
import { useSavedProjects } from "@/lib/use-saved-projects";
import { cn } from "@/lib/utils";

type SaveProjectButtonProps = {
  projectId: string;
};

export function SaveProjectButton({ projectId }: SaveProjectButtonProps) {
  const { savedProjectIds, toggleSavedProject } = useSavedProjects();
  const isSaved = savedProjectIds.includes(projectId);

  return (
    <button
      type="button"
      onClick={() => toggleSavedProject(projectId)}
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
  );
}
