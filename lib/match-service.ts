import { embedTexts } from "@/lib/embeddings";
import {
  cosineSimilarity,
  profileText,
  projectText,
  scoreMatch,
  type MatchableProfile,
  type MatchableProject,
  type MatchResult
} from "@/lib/matching";

let hasWarnedAboutEmbeddings = false;

// Scores projects for one person. Uses the local embedding model when available and
// falls back to keyword (exact skill) matching if it can't load, so callers never break.
// Results are in the same order as `projects`.
export async function scoreProjectsForProfile(
  profile: MatchableProfile,
  projects: MatchableProject[]
): Promise<MatchResult[]> {
  const viewerText = profileText(profile);
  const tags = [
    ...profile.skills.map((tag) => ({ tag, kind: "skill" as const })),
    ...profile.interests.map((tag) => ({ tag, kind: "interest" as const }))
  ];
  let vectors: Map<string, number[]> | null = null;

  if (viewerText && projects.length > 0) {
    try {
      vectors = await embedTexts([viewerText, ...tags.map(({ tag }) => tag), ...projects.map(projectText)]);
    } catch (error) {
      if (!hasWarnedAboutEmbeddings) {
        hasWarnedAboutEmbeddings = true;
        console.warn("[matching] embedding model unavailable; using keyword matching instead.", error);
      }
    }
  }

  const viewerVector = vectors?.get(viewerText);

  return projects.map((project) => {
    const projectVector = vectors?.get(projectText(project));
    const canUseEmbeddings = Boolean(viewerVector && projectVector);

    return scoreMatch({
      project,
      profile,
      similarity: canUseEmbeddings ? cosineSimilarity(viewerVector!, projectVector!) : null,
      tagSimilarities: canUseEmbeddings
        ? tags.flatMap(({ tag, kind }) => {
            const tagVector = vectors!.get(tag);
            return tagVector ? [{ tag, kind, similarity: cosineSimilarity(tagVector, projectVector!) }] : [];
          })
        : []
    });
  });
}
