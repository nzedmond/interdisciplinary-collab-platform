import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session-user", () => ({
  getSessionUserId: vi.fn()
}));

vi.mock("@/lib/admin-repository", () => ({
  getSessionAdminId: vi.fn(),
  moderateProject: vi.fn()
}));

import { PATCH } from "./route";
import { getSessionUserId } from "@/lib/session-user";
import { getSessionAdminId, moderateProject } from "@/lib/admin-repository";

const context = { params: Promise.resolve({ id: "project-1" }) };

function patch(body) {
  return PATCH(
    new Request("http://localhost/api/admin/projects/project-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `admin-projects-${Math.random()}` },
      body: JSON.stringify(body)
    }),
    context
  );
}

describe("PATCH /api/admin/projects/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUserId).mockResolvedValue("admin-1");
    vi.mocked(getSessionAdminId).mockResolvedValue("admin-1");
  });

  it("returns 401 when signed out", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);
    expect((await patch({ verified: true })).status).toBe(401);
  });

  it("returns 403 for non-admins", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("student-1");
    vi.mocked(getSessionAdminId).mockResolvedValue(null);

    expect((await patch({ verified: true })).status).toBe(403);
    expect(moderateProject).not.toHaveBeenCalled();
  });

  it.each([[{}], [{ verified: "yes" }], [{ archived: 1 }]])("returns 400 for invalid body %j", async (body) => {
    expect((await patch(body)).status).toBe(400);
    expect(moderateProject).not.toHaveBeenCalled();
  });

  it("returns 404 when the project is missing", async () => {
    vi.mocked(moderateProject).mockResolvedValue(null);
    expect((await patch({ archived: true })).status).toBe(404);
  });

  it("verifies a project", async () => {
    vi.mocked(moderateProject).mockResolvedValue({ id: "project-1", verified: true });

    const response = await patch({ verified: true });

    expect(response.status).toBe(200);
    expect((await response.json()).project.verified).toBe(true);
    expect(moderateProject).toHaveBeenCalledWith("project-1", { verified: true, archived: undefined });
  });
});
