import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session-user", () => ({
  getSessionUserId: vi.fn()
}));

vi.mock("@/lib/project-repository", () => ({
  createApplication: vi.fn(),
  getProjectAuthorizationContext: vi.fn()
}));

import { POST } from "./route";
import { createApplication, getProjectAuthorizationContext } from "@/lib/project-repository";
import { getSessionUserId } from "@/lib/session-user";

function postRequest(body) {
  return new Request("http://localhost/api/projects/project-1/applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

const context = {
  params: Promise.resolve({
    id: "project-1"
  })
};

describe("POST /api/projects/[id]/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    const response = await POST(postRequest({}), context);
    expect(response.status).toBe(401);
  });

  it("returns 403 when applying to own project", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("owner-1");
    vi.mocked(getProjectAuthorizationContext).mockResolvedValue({
      id: "project-1",
      ownerId: "owner-1",
      status: "OPEN"
    });

    const response = await POST(postRequest({}), context);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain("own project");
  });

  it("returns 409 when project is closed", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");
    vi.mocked(getProjectAuthorizationContext).mockResolvedValue({
      id: "project-1",
      ownerId: "owner-1",
      status: "REVIEWING"
    });

    const response = await POST(postRequest({}), context);
    expect(response.status).toBe(409);
  });

  it("returns 400 for invalid availability option", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");
    vi.mocked(getProjectAuthorizationContext).mockResolvedValue({
      id: "project-1",
      ownerId: "owner-1",
      status: "OPEN"
    });

    const response = await POST(
      postRequest({
        message: "I have relevant experience with this kind of interdisciplinary work.",
        availability: "20 hrs/week"
      }),
      context
    );

    expect(response.status).toBe(400);
  });

  it("creates an application when authorized and valid", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");
    vi.mocked(getProjectAuthorizationContext).mockResolvedValue({
      id: "project-1",
      ownerId: "owner-1",
      status: "OPEN"
    });
    vi.mocked(createApplication).mockResolvedValue({ id: "application-1" });

    const response = await POST(
      postRequest({
        message: "I have relevant experience with this kind of interdisciplinary work.",
        availability: "3-5 hrs/week"
      }),
      context
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.application.id).toBe("application-1");
    expect(createApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        availability: "3-5 hrs/week"
      }),
      "user-1"
    );
  });
});
