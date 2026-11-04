"use client";

import { Ban, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminRole, AdminUser } from "@/lib/admin-repository";
import { cn } from "@/lib/utils";

type AdminUsersProps = {
  initialUsers: AdminUser[];
  currentAdminId: string;
};

const roleLabels: Record<AdminRole, string> = {
  student: "Student",
  faculty: "Faculty",
  admin: "Admin"
};

export function AdminUsers({ initialUsers, currentAdminId }: AdminUsersProps) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return normalized
      ? users.filter((user) => [user.name, user.email, user.department].join(" ").toLowerCase().includes(normalized))
      : users;
  }, [query, users]);

  async function updateUser(userId: string, change: { role?: AdminRole; suspended?: boolean }) {
    setPendingId(userId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change)
      });
      const data = (await response.json()) as { user?: AdminUser; error?: string };

      if (!response.ok || !data.user) {
        throw new Error(data.error ?? "The user could not be updated.");
      }

      setUsers((current) => current.map((user) => (user.id === userId ? data.user! : user)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "The user could not be updated.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Users</h2>
        <label className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
          <span className="sr-only">Search users</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, department"
            className="focus-ring w-full rounded-md border border-ink/15 bg-white py-2 pl-9 pr-3 text-sm text-ink"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
          {error}
        </p>
      ) : null}

      <div className="mt-4 divide-y divide-ink/10 rounded-lg border border-ink/10">
        {visibleUsers.map((user) => {
          const isSelf = user.id === currentAdminId;
          const isPending = pendingId === user.id;

          return (
            <div key={user.id} className={cn("flex flex-wrap items-center justify-between gap-3 p-4", user.suspended && "bg-coral/5")}>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                  {user.name}
                  {isSelf ? <span className="text-xs font-normal text-ink/50">(you)</span> : null}
                  {user.suspended ? (
                    <span className="rounded-full bg-coral/10 px-2 py-0.5 text-xs font-semibold text-coral">Suspended</span>
                  ) : !user.canSignIn ? (
                    <span
                      className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold text-ink/60"
                      title="No password yet. The person can claim this account at /signup."
                    >
                      No password
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-ink/60">
                  {user.email}
                  {user.department ? ` · ${user.department}` : ""} · {user.projects} project{user.projects === 1 ? "" : "s"} ·{" "}
                  {user.applications} application{user.applications === 1 ? "" : "s"} · joined {user.joinedAt}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 rounded-md border border-ink/15 bg-white px-2 py-1">
                  <ShieldCheck className="h-3 w-3 text-ink/50" />
                  <span className="sr-only">Role for {user.name}</span>
                  <select
                    value={user.role}
                    disabled={isPending || isSelf}
                    title={isSelf ? "You can't change your own role." : undefined}
                    onChange={(event) => updateUser(user.id, { role: event.target.value as AdminRole })}
                    className="focus-ring bg-transparent text-xs font-semibold text-ink outline-none disabled:opacity-60"
                  >
                    {(Object.keys(roleLabels) as AdminRole[]).map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </label>
                {isSelf ? null : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => updateUser(user.id, { suspended: !user.suspended })}
                    className={cn(
                      "focus-ring inline-flex items-center gap-1 rounded-md border border-ink/15 bg-white px-2 py-1 text-xs font-semibold transition disabled:opacity-60",
                      user.suspended ? "text-ink/80 hover:border-moss hover:text-moss" : "text-ink/80 hover:border-coral hover:text-coral"
                    )}
                  >
                    <Ban className="h-3 w-3" />
                    {user.suspended ? "Reinstate" : "Suspend"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {visibleUsers.length === 0 ? <p className="p-4 text-sm text-ink/60">No users match “{query}”.</p> : null}
      </div>
    </section>
  );
}
