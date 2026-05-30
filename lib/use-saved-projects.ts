"use client";

import { useEffect, useState } from "react";

export function useSavedProjects() {
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSavedProjects() {
      try {
        const response = await fetch("/api/saved-projects", {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Saved projects could not be loaded.");
        }

        const data = (await response.json()) as { savedProjectIds: string[] };
        setSavedProjectIds(data.savedProjectIds);
      } catch {
        setSavedProjectIds([]);
      }
    }

    loadSavedProjects();

    return () => controller.abort();
  }, []);

  async function toggleSavedProject(projectId: string) {
    const isSaved = savedProjectIds.includes(projectId);
    const nextSavedProjectIds = isSaved
      ? savedProjectIds.filter((currentId) => currentId !== projectId)
      : [...savedProjectIds, projectId];

    setSavedProjectIds(nextSavedProjectIds);

    try {
      const response = await fetch("/api/saved-projects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId,
          isSaved: !isSaved
        })
      });

      if (!response.ok) {
        throw new Error("Saved project could not be updated.");
      }

      const data = (await response.json()) as { savedProjectIds: string[] };
      setSavedProjectIds(data.savedProjectIds);
    } catch {
      setSavedProjectIds(savedProjectIds);
    }
  }

  return {
    savedProjectIds,
    toggleSavedProject
  };
}
