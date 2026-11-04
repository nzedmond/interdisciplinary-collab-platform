import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session-user", () => ({ getSessionUserId: vi.fn() }));
vi.mock("@/lib/admin-repository", () => ({ getSessionAdminId: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ getAnalytics: vi.fn() }));

import { GET } from "./route";
import { getSessionUserId } from "@/lib/session-user";
import { getSessionAdminId } from "@/lib/admin-repository";
import { getAnalytics } from "@/lib/analytics";
import { toCsvCell } from "@/lib/csv";

const row = {
  applicationKey: "a1",
  applicantKey: "u1",
  applicantRole: "student",
  applicantDepartment: "=HYPERLINK(\"x\")",
  projectDepartments: ["History", "Media, Studies"],
  crossDepartment: true,
  status: "accepted",
  appliedAt: "2026-10-01",
  candidateCount: 8,
  semanticScore: 72,
  keywordScore: 33,
  hybridScore: 60,
  semanticPercentile: 0.857,
  keywordPercentile: 0.5,
  hybridPercentile: 0.714,
  synthetic: true
};

describe("GET /api/admin/analytics/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUserId).mockResolvedValue("admin-1");
    vi.mocked(getSessionAdminId).mockResolvedValue("admin-1");
    vi.mocked(getAnalytics).mockResolvedValue({ rows: [row] });
  });

  it("returns 401 when signed out and 403 for non-admins", async () => {
    vi.mocked(getSessionUserId).mockResolvedValueOnce(null);
    expect((await GET()).status).toBe(401);

    vi.mocked(getSessionAdminId).mockResolvedValueOnce(null);
    expect((await GET()).status).toBe(403);
    expect(getAnalytics).toHaveBeenCalledTimes(0);
  });

  it("returns an anonymized CSV with a header and one row per application", async () => {
    const response = await GET();
    const text = await response.text();
    const [header, firstRow] = text.trim().split("\r\n");

    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(header.split(",")).toContain("semantic_percentile");
    expect(header).not.toMatch(/name|email|message/);
    expect(firstRow).toContain('"History; Media, Studies"');
    expect(firstRow.endsWith(",true")).toBe(true);
  });
});

describe("toCsvCell", () => {
  it("neutralizes spreadsheet formulas but keeps negative numbers", () => {
    expect(toCsvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(toCsvCell("@cmd")).toBe("'@cmd");
    expect(toCsvCell(-3)).toBe("-3");
  });

  it("quotes commas, quotes, and newlines; leaves empty for null", () => {
    expect(toCsvCell('a "b", c')).toBe('"a ""b"", c"');
    expect(toCsvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(toCsvCell(null)).toBe("");
  });
});
