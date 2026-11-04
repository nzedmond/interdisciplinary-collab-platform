import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminProjects } from "@/components/admin-projects";
import { AdminUsers } from "@/components/admin-users";
import { getAdminOverview, getSessionAdminId, listProjectsForAdmin, listUsersForAdmin } from "@/lib/admin-repository";

function Stat({ label, value, detail, highlight }: { label: string; value: number; detail: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? "border-gold/40 bg-gold/10" : "border-ink/10 bg-paper"}`}>
      <p className="text-xs font-semibold uppercase text-ink/50">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink/60">{detail}</p>
    </div>
  );
}

export default async function AdminPage() {
  const adminId = await getSessionAdminId();

  // Non-admins get the same page as a missing route, so the admin area isn't advertised.
  if (!adminId) {
    notFound();
  }

  const [overview, projects, users] = await Promise.all([
    getAdminOverview(),
    listProjectsForAdmin(),
    listUsersForAdmin()
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <section className="mt-5 rounded-lg border border-ink/10 bg-white/90 p-6 shadow-soft">
        <p className="text-sm font-semibold text-moss">Administration</p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink">Admin tools</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">
          Verify legitimate projects, archive ones that shouldn&apos;t be listed, and manage who can use the platform.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Users"
            value={overview.users.total}
            detail={`${overview.users.students} students · ${overview.users.faculty} faculty · ${overview.users.admins} admin${overview.users.admins === 1 ? "" : "s"}${overview.users.suspended ? ` · ${overview.users.suspended} suspended` : ""}`}
          />
          <Stat
            label="Projects"
            value={overview.projects.total}
            detail={`${overview.projects.open} open · ${overview.projects.reviewing} reviewing · ${overview.projects.filled} filled · ${overview.projects.archived} archived`}
          />
          <Stat
            label="Awaiting verification"
            value={overview.projects.awaitingVerification}
            detail="Active projects not yet checked by an admin"
            highlight={overview.projects.awaitingVerification > 0}
          />
          <Stat
            label="Applications"
            value={overview.applications.total}
            detail={`${overview.applications.submitted} new · ${overview.applications.interview} interviewing · ${overview.applications.accepted} accepted · ${overview.applications.declined} declined`}
          />
        </div>
      </section>

      <div className="mt-6 space-y-6">
        <AdminProjects initialProjects={projects} />
        <AdminUsers initialUsers={users} currentAdminId={adminId} />
      </div>
    </main>
  );
}
