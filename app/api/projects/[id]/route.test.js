import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/projects", () => ({
  getProjectById: vi.fn()
}));

vi.mock("@/lib/session-user", () => ({
  getSessionUserId: vi.fn()
}));

vi.mock("@/lib/project-repository", () => ({
  updateOwnedProjectStatus: vi.fn()
}));

import { GET, PATCH } from "./route";
import { getProjectById } from "@/lib/projects";
import { getSessionUserId } from "@/lib/session-user";
import { updateOwnedProjectStatus } from "@/lib/project-repository";

const context = {
  params: Promise.resolve({
    id: "project-1"
  })
};

describe("GET /api/projects/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when project is missing", async () => {
    vi.mocked(getProjectById).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/projects/project-1"), context);
    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/projects/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/projects/project-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "reviewing" })
      }),
      context
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid status value", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("owner-1");

    const response = await PATCH(
      new Request("http://localhost/api/projects/project-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "archived" })
      }),
      context
    );

    expect(response.status).toBe(400);
  });

  it("updates status for owner", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("owner-1");
    vi.mocked(updateOwnedProjectStatus).mockResolvedValue({
      id: "project-1",
      status: "reviewing"
    });

    const response = await PATCH(
      new Request("http://localhost/api/projects/project-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "reviewing" })
      }),
      context
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.project.status).toBe("reviewing");
    expect(updateOwnedProjectStatus).toHaveBeenCalledWith("project-1", "reviewing", "owner-1");
  });
});
