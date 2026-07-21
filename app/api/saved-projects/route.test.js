import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session-user", () => ({
  getSessionUserId: vi.fn()
}));

vi.mock("@/lib/project-repository", () => ({
  getSavedProjectIds: vi.fn(),
  setSavedProject: vi.fn()
}));

import { PUT } from "./route";
import { getSessionUserId } from "@/lib/session-user";
import { setSavedProject } from "@/lib/project-repository";

function putRequest(body) {
  return new Request("http://localhost/api/saved-projects", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("PUT /api/saved-projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    const response = await PUT(putRequest({ projectId: "p-1", isSaved: true }));
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid projectId type", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");

    const response = await PUT(putRequest({ projectId: 123, isSaved: true }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid isSaved type", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");

    const response = await PUT(putRequest({ projectId: "p-1", isSaved: "true" }));
    expect(response.status).toBe(400);
  });

  it("updates saved projects for valid payloads", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");
    vi.mocked(setSavedProject).mockResolvedValue(["p-1", "p-2"]);

    const response = await PUT(putRequest({ projectId: "p-2", isSaved: true }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.savedProjectIds).toEqual(["p-1", "p-2"]);
    expect(setSavedProject).toHaveBeenCalledWith("p-2", true, "user-1");
  });
});
