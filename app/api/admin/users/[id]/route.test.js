import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session-user", () => ({
  getSessionUserId: vi.fn()
}));

vi.mock("@/lib/admin-repository", () => ({
  getSessionAdminId: vi.fn(),
  updateUserByAdmin: vi.fn()
}));

import { PATCH } from "./route";
import { getSessionUserId } from "@/lib/session-user";
import { getSessionAdminId, updateUserByAdmin } from "@/lib/admin-repository";

function patch(userId, body) {
  return PATCH(
    new Request(`http://localhost/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `admin-users-${Math.random()}` },
      body: JSON.stringify(body)
    }),
    { params: Promise.resolve({ id: userId }) }
  );
}

describe("PATCH /api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUserId).mockResolvedValue("admin-1");
    vi.mocked(getSessionAdminId).mockResolvedValue("admin-1");
  });

  it("returns 401 when signed out", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);
    expect((await patch("user-2", { suspended: true })).status).toBe(401);
  });

  it("returns 403 for non-admins", async () => {
    vi.mocked(getSessionAdminId).mockResolvedValue(null);

    expect((await patch("user-2", { role: "admin" })).status).toBe(403);
    expect(updateUserByAdmin).not.toHaveBeenCalled();
  });

  it.each([[{}], [{ role: "superuser" }], [{ suspended: "true" }]])("returns 400 for invalid body %j", async (body) => {
    expect((await patch("user-2", body)).status).toBe(400);
    expect(updateUserByAdmin).not.toHaveBeenCalled();
  });

  it.each([[{ suspended: true }], [{ role: "student" }]])("refuses to let admins lock themselves out: %j", async (body) => {
    expect((await patch("admin-1", body)).status).toBe(409);
    expect(updateUserByAdmin).not.toHaveBeenCalled();
  });

  it("returns 404 when the user is missing", async () => {
    vi.mocked(updateUserByAdmin).mockResolvedValue(null);
    expect((await patch("missing", { suspended: true })).status).toBe(404);
  });

  it("changes another user's role and suspension", async () => {
    vi.mocked(updateUserByAdmin).mockResolvedValue({ id: "user-2", role: "faculty", suspended: true });

    const response = await patch("user-2", { role: "faculty", suspended: true });

    expect(response.status).toBe(200);
    expect(updateUserByAdmin).toHaveBeenCalledWith("user-2", { role: "faculty", suspended: true });
  });
});
