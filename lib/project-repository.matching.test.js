import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session-user", () => ({ getSessionUserId: vi.fn(async () => "user-1") }));
vi.mock("@/lib/embeddings", () => ({ embedTexts: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async () => ({
        majorOrTitle: "Data Science major",
        department: "Computer Science",
        bio: "I make maps.",
        experience: null,
        coursework: null,
        skills: [{ skill: { name: "Python" } }],
        interests: [{ interest: { name: "Climate justice" } }]
      }))
    },
    project: {
      findMany: vi.fn(async () => [
        {
          id: "p-1",
          title: "Heat mapping",
          description: "Map heat islands.",
          category: "Research",
          departments: ["Environmental Studies"],
          goals: [],
          commitment: "3 hrs/week",
          duration: "Semester",
          status: "OPEN",
          verifiedAt: null,
          owner: { name: "Prof. A", role: "FACULTY", majorOrTitle: "Professor" },
          skills: [
            { required: true, skill: { name: "Python" } },
            { required: true, skill: { name: "GIS" } }
          ],
          _count: { applications: 0 }
        }
      ])
    }
  }
}));

import { embedTexts } from "@/lib/embeddings";
import { getProjects } from "@/lib/project-repository";

describe("getProjects matching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("falls back to keyword matching when the embedding model can't load", async () => {
    vi.mocked(embedTexts).mockRejectedValue(new Error("model download failed"));

    const [project] = await getProjects();

    expect(project.matchMethod).toBe("keyword");
    expect(project.semanticScore).toBeNull();
    expect(project.keywordScore).toBe(50);
    expect(project.matchScore).toBe(50);
    expect(project.recommendationReason).toContain("Python");
  });

  it("uses semantic similarity when embeddings are available", async () => {
    vi.mocked(embedTexts).mockImplementation(async (texts) => new Map(texts.map((text) => [text, [1, 0]])));

    const [project] = await getProjects();

    expect(project.matchMethod).toBe("hybrid");
    expect(project.semanticScore).toBe(100);
    expect(project.matchScore).toBe(Math.round(0.7 * 100 + 0.3 * 50));
  });
});
