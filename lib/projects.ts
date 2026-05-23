import { projects } from "@/lib/data";

export function getProjects() {
  return projects;
}

export function getProjectById(id: string) {
  return projects.find((project) => project.id === id);
}
