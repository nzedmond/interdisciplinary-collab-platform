import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session-user", () => ({
  getSessionUserId: vi.fn()
}));

vi.mock("@/lib/project-repository", () => ({
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn()
}));

import { GET, PATCH } from "./route";
import { getSessionUserId } from "@/lib/session-user";
import { getUserProfile, updateUserProfile } from "@/lib/project-repository";

describe("GET /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns profile for authenticated user", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");
    vi.mocked(getUserProfile).mockResolvedValue({
      id: "user-1",
      name: "Maya Johnson",
      role: "student",
      department: "Computer Science",
      majorOrTitle: "Data Science major",
      graduationYear: 2027,
      skills: ["Python"],
      interests: ["Climate justice"],
      portfolioUrl: null,
      githubUrl: null
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile.id).toBe("user-1");
  });
});

describe("PATCH /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid payload", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");

    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "M",
          department: "",
          majorOrTitle: "",
          skills: ["Python"],
          interests: []
        })
      })
    );

    expect(response.status).toBe(400);
  });

  it("updates profile for valid payload", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("user-1");
    vi.mocked(updateUserProfile).mockResolvedValue({
      id: "user-1",
      name: "Maya Johnson",
      role: "student",
      department: "Computer Science",
      majorOrTitle: "Data Science major",
      graduationYear: 2027,
      skills: ["Python", "React"],
      interests: ["Climate justice"],
      portfolioUrl: null,
      githubUrl: "https://github.com/maya"
    });

    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Maya Johnson",
          department: "Computer Science",
          majorOrTitle: "Data Science major",
          graduationYear: 2027,
          portfolioUrl: "",
          githubUrl: "https://github.com/maya",
          skills: ["Python", "React"],
          interests: ["Climate justice"]
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile.name).toBe("Maya Johnson");
    expect(updateUserProfile).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        name: "Maya Johnson",
        department: "Computer Science"
      })
    );
  });
});
