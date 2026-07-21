import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session-user", () => ({
  getSessionUserId: vi.fn()
}));

vi.mock("@/lib/project-repository", () => ({
  getApplicationAuthorizationContext: vi.fn(),
  updateOwnedProjectApplicationStatus: vi.fn()
}));

import { PATCH } from "./route";
import { getSessionUserId } from "@/lib/session-user";
import {
  getApplicationAuthorizationContext,
  updateOwnedProjectApplicationStatus
} from "@/lib/project-repository";

function patchRequest(body) {
  return new Request("http://localhost/api/applications/application-1", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

const context = {
  params: Promise.resolve({
    id: "application-1"
  })
};

describe("PATCH /api/applications/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    const response = await PATCH(patchRequest({ status: "interview" }), context);
    expect(response.status).toBe(401);
  });

  it("returns 403 when user does not own the project", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");
    vi.mocked(getApplicationAuthorizationContext).mockResolvedValue({
      id: "application-1",
      project: {
        ownerId: "owner-2"
      }
    });

    const response = await PATCH(patchRequest({ status: "interview" }), context);
    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid status values", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");
    vi.mocked(getApplicationAuthorizationContext).mockResolvedValue({
      id: "application-1",
      project: {
        ownerId: "user-1"
      }
    });

    const response = await PATCH(patchRequest({ status: "maybe" }), context);
    expect(response.status).toBe(400);
  });

  it("updates application status when authorized", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");
    vi.mocked(getApplicationAuthorizationContext).mockResolvedValue({
      id: "application-1",
      project: {
        ownerId: "user-1"
      }
    });
    vi.mocked(updateOwnedProjectApplicationStatus).mockResolvedValue({
      id: "application-1",
      status: "accepted"
    });

    const response = await PATCH(patchRequest({ status: "accepted" }), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.application.status).toBe("accepted");
    expect(updateOwnedProjectApplicationStatus).toHaveBeenCalledWith(
      "application-1",
      "accepted",
      "user-1"
    );
  });
});
