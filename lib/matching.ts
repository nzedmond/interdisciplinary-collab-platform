// Pure matching logic: how project and profile text is built, and how semantic
// similarity and skill overlap combine into an explainable match score.
// No model or database access here, so it can be unit-tested directly.

export type MatchableProject = {
  title: string;
  description: string;
  category: string;
  departments: string[];
  goals: string[];
  requiredSkills: string[];
  helpfulSkills: string[];
};

export type MatchableProfile = {
  majorOrTitle?: string | null;
  department?: string | null;
  bio?: string | null;
  experience?: string | null;
  coursework?: string | null;
  skills: string[];
  interests: string[];
};

export type MatchResult = {
  // Shown to users: semantic and keyword evidence combined, 0-100.
  matchScore: number;
  // Kept separately so the two methods can be compared (research question:
  // do embeddings beat keyword matching?). semanticScore is null when the
  // model was unavailable or the profile has no text to compare.
  semanticScore: number | null;
  keywordScore: number;
  matchMethod: "hybrid" | "keyword";
  recommendationReason: string;
};

// Weight of semantic similarity in the combined score; the rest is exact skill overlap.
export const SEMANTIC_WEIGHT = 0.7;

// all-MiniLM-L6-v2 cosine similarities for unrelated text sit near 0 and strong
// topical matches around 0.5-0.6, so that range is stretched onto 0-100.
const SIMILARITY_FLOOR = 0.05;
const SIMILARITY_CEILING = 0.6;

// A single skill/interest counts as "related" to a project above this similarity.
export const RELATED_TAG_THRESHOLD = 0.3;

export function projectText(project: MatchableProject) {
  return [
    project.title,
    project.description,
    `Category: ${project.category}.`,
    `Departments: ${project.departments.join(", ")}.`,
    `Skills needed: ${[...project.requiredSkills, ...project.helpfulSkills].join(", ")}.`,
    project.goals.length > 0 ? `Goals: ${project.goals.join("; ")}.` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

// Returns "" when the profile has nothing to compare (no semantic score then).
export function profileText(profile: MatchableProfile) {
  return [
    profile.majorOrTitle,
    profile.department ? `Department: ${profile.department}.` : "",
    profile.bio,
    profile.experience ? `Experience: ${profile.experience}` : "",
    profile.coursework ? `Coursework: ${profile.coursework}` : "",
    profile.skills.length > 0 ? `Skills: ${profile.skills.join(", ")}.` : "",
    profile.interests.length > 0 ? `Interests: ${profile.interests.join(", ")}.` : ""
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join("\n");
}

// Vectors from the embedding model are already normalized, so the dot product is the cosine.
export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  return normA === 0 || normB === 0 ? 0 : dot / Math.sqrt(normA * normB);
}

export function similarityToScore(similarity: number) {
  const scaled = (similarity - SIMILARITY_FLOOR) / (SIMILARITY_CEILING - SIMILARITY_FLOOR);
  return Math.round(100 * Math.min(1, Math.max(0, scaled)));
}

function joinNatural(items: string[]) {
  if (items.length <= 1) {
    return items.join("");
  }
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function scoreMatch(input: {
  project: MatchableProject;
  profile: MatchableProfile;
  // Cosine similarity between the profile and project embeddings (null = unavailable).
  similarity: number | null;
  // Similarity of each of the viewer's skills/interests to the project (for the reason).
  tagSimilarities?: { tag: string; kind: "skill" | "interest"; similarity: number }[];
}): MatchResult {
  const { project, profile, similarity } = input;
  const viewerSkills = new Set(profile.skills.map((skill) => skill.toLowerCase()));
  const projectSkills = [...project.requiredSkills, ...project.helpfulSkills];
  const matchedSkills = projectSkills.filter((skill) => viewerSkills.has(skill.toLowerCase()));
  const keywordScore = projectSkills.length > 0 ? Math.round((100 * matchedSkills.length) / projectSkills.length) : 0;

  const semanticScore = similarity === null ? null : similarityToScore(similarity);
  const matchScore =
    semanticScore === null
      ? keywordScore
      : Math.round(SEMANTIC_WEIGHT * semanticScore + (1 - SEMANTIC_WEIGHT) * keywordScore);

  const matchedLower = new Set(matchedSkills.map((skill) => skill.toLowerCase()));
  const relatedTags = (input.tagSimilarities ?? [])
    .filter((entry) => entry.similarity >= RELATED_TAG_THRESHOLD && !matchedLower.has(entry.tag.toLowerCase()))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 2);

  return {
    matchScore,
    semanticScore,
    keywordScore,
    matchMethod: semanticScore === null ? "keyword" : "hybrid",
    recommendationReason: explain({ profile, matchedSkills, relatedTags, semanticScore })
  };
}

function explain(input: {
  profile: MatchableProfile;
  matchedSkills: string[];
  relatedTags: { tag: string; kind: "skill" | "interest" }[];
  semanticScore: number | null;
}) {
  const { profile, matchedSkills, relatedTags, semanticScore } = input;

  if (profile.skills.length === 0 && profile.interests.length === 0 && !profileText(profile)) {
    return "Add skills and interests to your profile to get personalized matches.";
  }

  const parts: string[] = [];

  if (matchedSkills.length > 0) {
    parts.push(`it uses your ${joinNatural(matchedSkills.slice(0, 3))} skill${matchedSkills.length === 1 ? "" : "s"}`);
  }

  const relatedInterests = relatedTags.filter((tag) => tag.kind === "interest").map((tag) => tag.tag);
  const relatedSkills = relatedTags.filter((tag) => tag.kind === "skill").map((tag) => tag.tag);

  if (relatedInterests.length > 0) {
    parts.push(`it relates to your interest in ${joinNatural(relatedInterests)}`);
  }

  if (relatedSkills.length > 0) {
    parts.push(`your ${joinNatural(relatedSkills)} experience carries over`);
  }

  if (parts.length > 0) {
    return `Recommended because ${joinNatural(parts)}.`;
  }

  if (semanticScore !== null && semanticScore >= 50) {
    return "Recommended because it's similar to the work described in your profile.";
  }

  return "A step outside your current profile: a chance to work across disciplines.";
}
