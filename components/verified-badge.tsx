import { BadgeCheck } from "lucide-react";

export function VerifiedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-moss px-3 py-1 text-xs font-semibold text-white"
      title="Checked by a Collab Commons admin"
    >
      <BadgeCheck className="h-3 w-3" />
      Verified
    </span>
  );
}
