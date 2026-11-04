import { getSessionAdminId } from "@/lib/admin-repository";
import { getAnalytics, type ApplicationRow } from "@/lib/analytics";
import { errorResponse } from "@/lib/api";
import { toCsvCell } from "@/lib/csv";
import { getSessionUserId } from "@/lib/session-user";

const columns: { header: string; value: (row: ApplicationRow) => unknown }[] = [
  { header: "application_key", value: (row) => row.applicationKey },
  { header: "applicant_key", value: (row) => row.applicantKey },
  { header: "applicant_role", value: (row) => row.applicantRole },
  { header: "applicant_department", value: (row) => row.applicantDepartment },
  { header: "project_departments", value: (row) => row.projectDepartments.join("; ") },
  { header: "cross_department", value: (row) => row.crossDepartment },
  { header: "status", value: (row) => row.status },
  { header: "applied_at", value: (row) => row.appliedAt },
  { header: "candidate_projects", value: (row) => row.candidateCount },
  { header: "semantic_score", value: (row) => row.semanticScore },
  { header: "keyword_score", value: (row) => row.keywordScore },
  { header: "hybrid_score", value: (row) => row.hybridScore },
  { header: "semantic_percentile", value: (row) => row.semanticPercentile },
  { header: "keyword_percentile", value: (row) => row.keywordPercentile },
  { header: "hybrid_percentile", value: (row) => row.hybridPercentile },
  { header: "synthetic", value: (row) => row.synthetic }
];

// One anonymized row per application (no names, emails, or message text) for
// analysis in R/Python/Sheets. Admins only.
export async function GET() {
  if (!(await getSessionUserId())) {
    return errorResponse(401, "Please sign in.");
  }

  if (!(await getSessionAdminId())) {
    return errorResponse(403, "Admins only.");
  }

  const { rows } = await getAnalytics();
  const csv = [
    columns.map((column) => column.header).join(","),
    ...rows.map((row) => columns.map((column) => toCsvCell(column.value(row))).join(","))
  ].join("\r\n");

  return new Response(`${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="collab-commons-applications-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}
