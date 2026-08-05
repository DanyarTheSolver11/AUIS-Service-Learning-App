// Award tiers exactly as defined in the Student Services email.
// Keep this in one place so a semester's rules can be tweaked without
// touching UI code.

export type AwardTier =
  | "NONE"
  | "REGULAR"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "DIAMOND";

export const AWARD_THRESHOLDS: { tier: AwardTier; min: number; max: number | null; label: string }[] = [
  { tier: "DIAMOND", min: 101, max: 250, label: "Diamond Award (101–250 hrs)" },
  { tier: "GOLD", min: 76, max: 100, label: "Gold Award (76–100 hrs)" },
  { tier: "SILVER", min: 51, max: 75, label: "Silver Award (51–75 hrs)" },
  { tier: "BRONZE", min: 26, max: 50, label: "Bronze Award (26–50 hrs)" },
  { tier: "REGULAR", min: 10, max: 25, label: "Regular Award (10–25 hrs)" },
];

export function getAwardTier(approvedHours: number): AwardTier {
  for (const t of AWARD_THRESHOLDS) {
    if (approvedHours >= t.min && (t.max === null || approvedHours <= t.max)) {
      return t.tier;
    }
  }
  return "NONE";
}

export function getAwardLabel(tier: AwardTier): string {
  if (tier === "NONE") return "No award yet — 10 hrs minimum required";
  return AWARD_THRESHOLDS.find((t) => t.tier === tier)!.label;
}

// Hours still needed to reach the next tier up. Useful for a
// "you're 4 hours away from Bronze" nudge on the student dashboard.
export function hoursToNextTier(approvedHours: number): { nextTier: AwardTier; hoursNeeded: number } | null {
  const ascending = [...AWARD_THRESHOLDS].sort((a, b) => a.min - b.min);
  for (const t of ascending) {
    if (approvedHours < t.min) {
      return { nextTier: t.tier, hoursNeeded: Math.ceil(t.min - approvedHours) };
    }
  }
  return null; // already at Diamond or above
}
