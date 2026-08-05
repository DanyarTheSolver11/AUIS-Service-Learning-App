import { AwardTier, getAwardLabel, hoursToNextTier } from "@/lib/awards";

const TIER_STYLES: Record<AwardTier, string> = {
  NONE: "bg-slate-100 text-slate-600",
  REGULAR: "bg-blue-100 text-blue-700",
  BRONZE: "bg-amber-100 text-amber-800",
  SILVER: "bg-slate-200 text-slate-800",
  GOLD: "bg-yellow-100 text-yellow-800",
  DIAMOND: "bg-cyan-100 text-cyan-800",
};

export function AwardBadge({ tier, approvedHours }: { tier: AwardTier; approvedHours: number }) {
  const next = hoursToNextTier(approvedHours);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">Approved hours this semester</p>
      <p className="mt-1 text-3xl font-bold">{approvedHours.toFixed(1)}</p>
      <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${TIER_STYLES[tier]}`}>
        {getAwardLabel(tier)}
      </span>
      {next && (
        <p className="mt-3 text-xs text-slate-500">
          {next.hoursNeeded} more approved hour{next.hoursNeeded === 1 ? "" : "s"} to reach {next.nextTier}.
        </p>
      )}
    </div>
  );
}
