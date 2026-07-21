import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session-user", () => ({
  getSessionUserId: vi.fn()
}));

vi.mock("@/lib/project-repository", () => ({
  createProject: vi.fn(),
  getProjects: vi.fn()
}));

import { POST } from "./route";
import { createProject } from "@/lib/project-repository";
import { getSessionUserId } from "@/lib/session-user";

function postRequest(body) {
  return new Request("http://localhost/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    const response = await POST(postRequest({}));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toContain("sign in");
  });

  it("returns 400 for invalid payload", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");

    const response = await POST(postRequest({ title: "short" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Project title");
  });

  it("creates a project for valid payloads", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");
    vi.mocked(createProject).mockResolvedValue({ id: "project-1" });

    const response = await POST(
      postRequest({
        title: "Community Data Story Lab",
        description:
          "Build a collaborative storytelling dashboard that combines civic data with community narratives.",
        departments: ["Computer Science", "Media Studies"],
        category: "Civic Data",
        requiredSkills: ["TypeScript"],
        helpfulSkills: ["Design research"],
        commitment: "3-5 hrs/week",
        duration: "Semester",
        goals: ["Launch public prototype"]
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.project.id).toBe("project-1");
    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Community Data Story Lab",
        departments: ["Computer Science", "Media Studies"],
        requiredSkills: ["TypeScript"]
      }),
      "user-1"
    );
  });
});
