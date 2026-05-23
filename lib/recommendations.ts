import type { Project, UserProfile } from "@/lib/types";

export function explainRecommendation(user: UserProfile, project: Project) {
  const userSignals = new Set([...user.skills, ...user.interests].map((item) => item.toLowerCase()));
  const projectSignals = [...project.requiredSkills, ...project.helpfulSkills, project.category];
  const overlaps = projectSignals.filter((signal) => userSignals.has(signal.toLowerCase()));

  if (overlaps.length === 0) {
    return "Recommended because it expands your profile into a nearby interdisciplinary area.";
  }

  return `Recommended because of your ${overlaps.slice(0, 3).join(", ")} experience.`;
}

export function keywordMatchScore(user: UserProfile, project: Project) {
  const userSignals = new Set([...user.skills, ...user.interests].map((item) => item.toLowerCase()));
  const projectSignals = [...project.requiredSkills, ...project.helpfulSkills, ...project.departments].map((item) =>
    item.toLowerCase()
  );
  const matches = projectSignals.filter((signal) => userSignals.has(signal)).length;

  return Math.min(98, 60 + matches * 8);
}
