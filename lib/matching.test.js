import { describe, expect, it } from "vitest";
import { cosineSimilarity, profileText, projectText, scoreMatch, similarityToScore } from "./matching";

const project = {
  title: "Mapping Urban Heat and Community Memory",
  description: "Interactive map pairing heat-island data with oral histories.",
  category: "Research + Public Scholarship",
  departments: ["Environmental Studies", "History"],
  goals: ["Prototype public map"],
  requiredSkills: ["GIS", "Python", "Interview research"],
  helpfulSkills: ["Data visualization"]
};

const profile = {
  majorOrTitle: "Data Science major",
  department: "Computer Science",
  bio: "I make maps of community stories.",
  skills: ["python", "React"],
  interests: ["Climate justice", "Music"]
};

describe("cosineSimilarity", () => {
  it("is 1 for identical direction, 0 for orthogonal, 0 for empty vectors", () => {
    expect(cosineSimilarity([1, 2], [2, 4])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe("similarityToScore", () => {
  it("maps the model's useful similarity range onto 0-100 and clamps", () => {
    expect(similarityToScore(-0.2)).toBe(0);
    expect(similarityToScore(0.05)).toBe(0);
    expect(similarityToScore(0.6)).toBe(100);
    expect(similarityToScore(0.9)).toBe(100);
    expect(similarityToScore(0.325)).toBe(50);
  });
});

describe("text builders", () => {
  it("include the fields that carry meaning", () => {
    expect(projectText(project)).toContain("oral histories");
    expect(projectText(project)).toContain("GIS, Python");
    expect(profileText(profile)).toContain("Climate justice");
  });

  it("returns empty text for an empty profile", () => {
    expect(profileText({ skills: [], interests: [] })).toBe("");
  });
});

describe("scoreMatch", () => {
  it("falls back to keyword-only scoring when no similarity is available", () => {
    const result = scoreMatch({ project, profile, similarity: null });

    expect(result.matchMethod).toBe("keyword");
    expect(result.semanticScore).toBeNull();
    // 1 of 4 project skills matched (python, case-insensitive).
    expect(result.keywordScore).toBe(25);
    expect(result.matchScore).toBe(25);
    expect(result.recommendationReason).toContain("Python");
  });

  it("blends semantic and keyword scores 70/30", () => {
    const result = scoreMatch({ project, profile, similarity: 0.6 });

    expect(result.matchMethod).toBe("hybrid");
    expect(result.semanticScore).toBe(100);
    expect(result.matchScore).toBe(Math.round(0.7 * 100 + 0.3 * 25));
  });

  it("explains with the most related interests, skipping unrelated ones and exact matches", () => {
    const result = scoreMatch({
      project,
      profile,
      similarity: 0.4,
      tagSimilarities: [
        { tag: "Climate justice", kind: "interest", similarity: 0.45 },
        { tag: "Music", kind: "interest", similarity: 0.02 },
        { tag: "python", kind: "skill", similarity: 0.5 },
        { tag: "React", kind: "skill", similarity: 0.1 }
      ]
    });

    expect(result.recommendationReason).toContain("interest in Climate justice");
    expect(result.recommendationReason).not.toContain("Music");
    expect(result.recommendationReason).not.toContain("React");
  });

  it("asks people with an empty profile to fill it in", () => {
    const result = scoreMatch({ project, profile: { skills: [], interests: [] }, similarity: null });

    expect(result.matchScore).toBe(0);
    expect(result.recommendationReason).toMatch(/Add skills and interests/);
  });
});
