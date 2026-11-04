import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Download } from "lucide-react";
import { BarList, Heatmap, MethodComparison, PairedBars } from "@/components/analytics-charts";
import { getSessionAdminId } from "@/lib/admin-repository";
import { getAnalytics } from "@/lib/analytics";

// Always compute from current data.
export const dynamic = "force-dynamic";

function percent(value: number | null) {
  return value === null ? "–" : `${Math.round(value * 100)}%`;
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper p-4">
      <p className="text-xs font-semibold uppercase text-ink/50">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink/60">{detail}</p>
    </div>
  );
}

function Panel({ title, question, children }: { title: string; question: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink/60">{question}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-ink/10 bg-paper p-4 text-sm text-ink/60">{children}</p>;
}

export default async function AnalyticsPage() {
  if (!(await getSessionAdminId())) {
    notFound();
  }

  const analytics = await getAnalytics();
  const { participation, recommendationQuality, departmentNetwork, skillDemand, funnel } = analytics;
  const hasRankingData = recommendationQuality.methods.some((method) => method.count > 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
        >
          <ArrowLeft className="h-4 w-4" />
          Admin tools
        </Link>
        <a
          href="/api/admin/analytics/export"
          className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      <section className="mt-5 rounded-lg border border-ink/10 bg-white/90 p-6 shadow-soft">
        <p className="text-sm font-semibold text-moss">Research analytics</p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink">Collaboration analytics</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">
          How people collaborate across departments, which skills are in demand, and how well each matching method predicts
          the projects people actually choose. The CSV export has one anonymized row per application (no names, emails, or
          messages).
        </p>

        {analytics.syntheticAccounts > 0 ? (
          <p className="mt-4 flex gap-2 rounded-md border border-gold/40 bg-gold/10 px-4 py-3 text-sm leading-6 text-ink">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-gold" />
            <span>
              Includes synthetic demo data: {analytics.syntheticAccounts} of {analytics.totalAccounts} accounts and{" "}
              {analytics.syntheticApplications} of {participation.applications} applications use example.edu addresses. Use
              these numbers to demonstrate the system, not as research findings. The CSV marks these rows in the{" "}
              <code>synthetic</code> column.
            </span>
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Cross-department applications"
            value={percent(participation.crossDepartmentRate)}
            detail="Applicant's department isn't one of the project's"
          />
          <Stat
            label="Cross-department acceptances"
            value={percent(participation.crossDepartmentAcceptedRate)}
            detail={`Of ${participation.acceptedCount} accepted application${participation.acceptedCount === 1 ? "" : "s"}`}
          />
          <Stat
            label="Students who applied"
            value={`${participation.studentsWhoApplied} / ${participation.students}`}
            detail="Active students with at least one application"
          />
          <Stat
            label="Acceptance rate"
            value={percent(participation.acceptanceRate)}
            detail={`Of ${participation.decidedCount} decided application${participation.decidedCount === 1 ? "" : "s"}; ${participation.projectsWithApplicants} of ${participation.projects} projects have applicants`}
          />
        </div>
      </section>

      <div className="mt-6 space-y-6">
        <Panel
          title="Recommendation quality"
          question="Do semantic (meaning-based) scores rank the projects people actually apply to higher than keyword (exact skill) scores?"
        >
          {hasRankingData ? (
            <>
              <MethodComparison methods={recommendationQuality.methods} />
              <p className="mt-4 text-xs leading-5 text-ink/60">
                Each application is compared with every other active project the applicant could have chosen, scored from
                their current profile. Caveats: users saw hybrid scores while browsing, which can steer choices toward that
                method; profiles may have changed since they applied; and small samples make these rates unstable.
                {recommendationQuality.usedEmbeddings
                  ? ""
                  : " The embedding model was unavailable, so semantic results are missing."}
              </p>
            </>
          ) : (
            <Empty>No applications yet. Rankings appear once people apply to projects.</Empty>
          )}
        </Panel>

        <Panel
          title="Department collaboration network"
          question="Which departments' members apply to which departments' projects? Outlined cells are same-department."
        >
          {departmentNetwork.from.length > 0 ? (
            <Heatmap
              rows={departmentNetwork.from}
              columns={departmentNetwork.to}
              counts={departmentNetwork.counts}
              rowHeading="Applicant's department"
              columnHeading="project's department"
            />
          ) : (
            <Empty>No applications from people with a department set yet.</Empty>
          )}
          <p className="mt-3 text-xs text-ink/60">
            A project listed under several departments counts once in each of its columns.
          </p>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Skill demand vs supply" question="Skills most needed by open projects, next to how many people list them.">
            {skillDemand.length > 0 ? (
              <PairedBars
                items={skillDemand.map((item) => ({
                  label: item.skill,
                  first: item.projectsNeeding,
                  second: item.peopleWithSkill
                }))}
                firstLabel="Projects needing it"
                secondLabel="People with it"
                ariaLabel="Projects needing each skill and people who have it"
              />
            ) : (
              <Empty>No open projects list skills yet.</Empty>
            )}
          </Panel>

          <Panel title="Application funnel" question="Where applications currently stand.">
            <BarList
              ariaLabel="Applications by status"
              items={funnel.map((step) => ({ label: step.label, value: step.count }))}
            />
          </Panel>
        </div>
      </div>

      <p className="mt-6 text-xs text-ink/50">Generated {analytics.generatedAt.replace("T", " ").slice(0, 16)} UTC.</p>
    </main>
  );
}
