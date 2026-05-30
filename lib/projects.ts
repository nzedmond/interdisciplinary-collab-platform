import { getProjectById as getProjectByIdFromDatabase, getProjects as getProjectsFromDatabase } from "@/lib/project-repository";

export function getProjects() {
  return getProjectsFromDatabase();
}

export function getProjectById(id: string) {
  return getProjectByIdFromDatabase(id);
}
