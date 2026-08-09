import { AwardTier, hoursToNextTier } from "@/lib/awards";

const TIER_META: Record<
  AwardTier,
  { ring: string; ink: string; label: string; sub: string }
> = {
  NONE: { ring: "#c9c2ac", ink: "text-ink-600", label: "Unranked", sub: "10 hrs to qualify" },
  REGULAR: { ring: "#8aa9c9", ink: "text-[#3c5a78]", label: "Regular", sub: "10–25 hrs" },
  BRONZE: { ring: "#b5651d", ink: "text-[#7a4315]", label: "Bronze", sub: "26–50 hrs" },
  SILVER: { ring: "#9aa3ad", ink: "text-[#5b636b]", label: "Silver", sub: "51–75 hrs" },
  GOLD: { ring: "#d1ab4a", ink: "text-brass-600", label: "Gold", sub: "76–100 hrs" },
  DIAMOND: { ring: "#5aa9a3", ink: "text-[#2f6b66]", label: "Diamond", sub: "101–250 hrs" },
};

export function AwardBadge({ tier, approvedHours }: { tier: AwardTier; approvedHours: number }) {
  const next = hoursToNextTier(approvedHours);
  const meta = TIER_META[tier];
  // Progress ring: fraction of the way toward the *next* tier's floor,
  // purely decorative — clamped so it never looks broken at the extremes.
  const progress = next
    ? Math.min(1, approvedHours / (approvedHours + next.hoursNeeded))
    : 1;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="rule-frame animate-rise rounded-sm bg-white/70 p-8 shadow-seal">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#efe4c9" strokeWidth="3" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={meta.ring}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="ledger-number text-3xl font-semibold text-ink-900">
              {approvedHours.toFixed(1)}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">hours</span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-500">Current Standing</p>
          <p className={`mt-1 font-display text-2xl italic ${meta.ink}`}>{meta.label} Award</p>
          <p className="mt-1 text-sm text-ink-600">{meta.sub}</p>

          {next ? (
            <p className="mt-3 text-sm text-ink-600">
              <span className="font-semibold text-ink-800">{next.hoursNeeded}</span> more approved hour
              {next.hoursNeeded === 1 ? "" : "s"} to reach{" "}
              <span className={TIER_META[next.nextTier].ink}>{TIER_META[next.nextTier].label}</span>.
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink-600">You&rsquo;ve reached the highest tier. Well done.</p>
          )}
        </div>
      </div>
    </div>
  );
}
