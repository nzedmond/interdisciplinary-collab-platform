import type { Project } from "@/lib/types";

const projectDraftsKey = "collab-commons:project-drafts";

export function getProjectDrafts() {
  const storedValue = window.localStorage.getItem(projectDraftsKey);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Project[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

export function saveProjectDraft(project: Project) {
  const currentDrafts = getProjectDrafts();
  const nextDrafts = [project, ...currentDrafts.filter((draft) => draft.id !== project.id)];

  window.localStorage.setItem(projectDraftsKey, JSON.stringify(nextDrafts));
}
