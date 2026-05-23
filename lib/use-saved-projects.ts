"use client";

import { useEffect, useState } from "react";

const savedProjectsKey = "collab-commons:saved-projects";

export function useSavedProjects() {
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [hasLoadedSavedProjects, setHasLoadedSavedProjects] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(savedProjectsKey);

    if (storedValue) {
      try {
        const parsedValue = JSON.parse(storedValue) as string[];
        setSavedProjectIds(Array.isArray(parsedValue) ? parsedValue : []);
      } catch {
        setSavedProjectIds([]);
      }
    }

    setHasLoadedSavedProjects(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedProjects) {
      return;
    }

    window.localStorage.setItem(savedProjectsKey, JSON.stringify(savedProjectIds));
  }, [hasLoadedSavedProjects, savedProjectIds]);

  function toggleSavedProject(projectId: string) {
    setSavedProjectIds((currentIds) =>
      currentIds.includes(projectId)
        ? currentIds.filter((currentId) => currentId !== projectId)
        : [...currentIds, projectId]
    );
  }

  return {
    savedProjectIds,
    toggleSavedProject
  };
}
