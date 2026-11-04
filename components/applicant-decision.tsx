"use client";

import { Check, MessagesSquare, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import type { Application } from "@/lib/types";
import { cn, statusLabel } from "@/lib/utils";

type Status = Application["status"];

type ApplicantDecisionProps = {
  applicationId: string;
  initialStatus: Status;
  onStatusChange?: (status: Status) => void;
};

const statusStyles: Record<Status, string> = {
  submitted: "bg-blue/10 text-blue",
  interview: "bg-gold/20 text-ink",
  accepted: "bg-moss/15 text-moss",
  declined: "bg-coral/10 text-coral"
};

const actions: { status: Status; label: string; icon: typeof Check; className: string }[] = [
  { status: "interview", label: "Interview", icon: MessagesSquare, className: "hover:border-gold hover:text-ink" },
  { status: "accepted", label: "Accept", icon: Check, className: "hover:border-moss hover:text-moss" },
  { status: "declined", label: "Decline", icon: X, className: "hover:border-coral hover:text-coral" }
];

export function ApplicantDecision({ applicationId, initialStatus, onStatusChange }: ApplicantDecisionProps) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(nextStatus: Status) {
    const previousStatus = status;
    setPendingStatus(nextStatus);
    setError(null);
    setStatus(nextStatus);

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Status could not be updated.");
      }

      onStatusChange?.(nextStatus);
    } catch (updateError) {
      setStatus(previousStatus);
      setError(updateError instanceof Error ? updateError.message : "Status could not be updated.");
    } finally {
      setPendingStatus(null);
    }
  }

  // A decided application only offers "Undo" (back to submitted) to avoid accidental flips.
  const isDecided = status === "accepted" || status === "declined";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusStyles[status])} aria-live="polite">
          {statusLabel(status)}
        </span>
        {isDecided ? (
          <button
            type="button"
            disabled={pendingStatus !== null}
            onClick={() => updateStatus("submitted")}
            className="focus-ring inline-flex items-center gap-1 rounded-md border border-ink/15 bg-white px-2 py-1 text-xs font-semibold text-ink/70 transition hover:border-ink hover:text-ink disabled:opacity-60"
          >
            <RotateCcw className="h-3 w-3" />
            Undo
          </button>
        ) : (
          actions
            .filter((action) => action.status !== status)
            .map(({ status: actionStatus, label, icon: Icon, className }) => (
              <button
                key={actionStatus}
                type="button"
                disabled={pendingStatus !== null}
                onClick={() => updateStatus(actionStatus)}
                className={cn(
                  "focus-ring inline-flex items-center gap-1 rounded-md border border-ink/15 bg-white px-2 py-1 text-xs font-semibold text-ink/80 transition disabled:opacity-60",
                  className
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))
        )}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-coral">
          {error}
        </p>
      ) : null}
    </div>
  );
}
