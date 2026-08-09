import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAwardTier, getAwardLabel, AWARD_THRESHOLDS } from "@/lib/awards";
import { StatusPill } from "@/components/StatusPill";
import { SiteHeader } from "@/components/SiteHeader";
import { EmailConfigBanner } from "@/components/EmailConfigBanner";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/dashboard");

  const semester = await prisma.semester.findFirst({ where: { isActive: true } });

  const students = semester
    ? await prisma.user.findMany({
        where: { role: "STUDENT" },
        include: { entries: { where: { semesterId: semester.id } } },
        orderBy: { name: "asc" },
      })
    : [];

  const rows = students
    .map((s) => {
      const approved = s.entries.filter((e) => e.status === "APPROVED");
      const pending = s.entries.filter((e) => e.status === "PENDING").length;
      const totalHours = approved.reduce((sum, e) => sum + e.hours, 0);
      return { student: s, totalHours, tier: getAwardTier(totalHours), pending, entryCount: s.entries.length };
    })
    .filter((r) => r.entryCount > 0)
    .sort((a, b) => b.totalHours - a.totalHours);

  const totalApprovedHours = rows.reduce((sum, r) => sum + r.totalHours, 0);
  const totalPending = rows.reduce((sum, r) => sum + r.pending, 0);
  const qualifyingCount = rows.filter((r) => r.tier !== "NONE").length;

  const daysLeft = semester
    ? Math.ceil((semester.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-parchment-100">
      <SiteHeader name={session.user.name} role="ADMIN" />
      <div className="mx-auto max-w-5xl px-6 py-14">
        <EmailConfigBanner />

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brass-600">
              Student Services
            </p>
            <h1 className="mt-1 font-display text-3xl italic text-ink-900">Volunteer Hours Registry</h1>
            <p className="mt-1 text-sm text-ink-500">
              {semester ? semester.name : "No active semester configured"}
              {daysLeft !== null && (
                <span className={daysLeft < 0 ? "text-claret-500" : daysLeft <= 14 ? "text-brass-600" : ""}>
                  {" "}
                  &middot; {daysLeft < 0 ? "submissions closed" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left to submit`}
                </span>
              )}
            </p>
          </div>
          {semester && (
            <div className="flex shrink-0 gap-2">
              <a
                href="/api/admin/export"
                className="rounded-sm bg-ink-900 px-4 py-2.5 text-sm font-semibold tracking-wide text-parchment-50 shadow-seal transition hover:bg-ink-800"
              >
                Ceremony List (CSV)
              </a>
              <a
                href="/api/admin/export/all"
                className="rounded-sm border border-ink-900/15 px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-900/5"
              >
                All Entries (CSV)
              </a>
            </div>
          )}
        </div>

        {semester && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Students Engaged" value={rows.length} />
            <StatCard label="Approved Hours" value={totalApprovedHours.toFixed(1)} />
            <StatCard
              label="Awaiting Review"
              value={totalPending}
              accent={totalPending > 0 ? "brass" : undefined}
            />
            <StatCard label="Currently Qualify" value={qualifyingCount} accent="ink" />
          </div>
        )}

        <div className="rule-frame animate-rise mt-8 overflow-x-auto rounded-sm bg-parchment-50 shadow-lift">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-900/15 bg-ink-900/[0.03]">
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
                  Student
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
                  ID
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
                  Approved Hours
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
                  Award Tier
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
                  Pending
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.student.id}
                  className={`border-b border-ink-900/[0.06] last:border-0 hover:bg-brass-200/[0.15] ${
                    i === 0 ? "bg-brass-200/10" : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink-900">{r.student.name ?? "—"}</p>
                    <p className="text-xs text-ink-500">{r.student.email}</p>
                  </td>
                  <td className="px-5 py-4 text-ink-700">{r.student.studentId ?? "—"}</td>
                  <td className="px-5 py-4 ledger-number text-base text-ink-900">{r.totalHours.toFixed(1)}</td>
                  <td className="px-5 py-4 text-ink-700">{getAwardLabel(r.tier)}</td>
                  <td className="px-5 py-4">
                    {r.pending > 0 ? (
                      <span className="inline-flex items-center gap-1.5">
                        <StatusPill status="PENDING" />
                        <span className="text-xs text-ink-500">({r.pending})</span>
                      </span>
                    ) : (
                      <span className="text-ink-500/40">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-ink-500">
                    No entries submitted yet this semester.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-ink-500/70">
          Award thresholds: {AWARD_THRESHOLDS.slice()
            .reverse()
            .map((t) => `${t.tier.charAt(0)}${t.tier.slice(1).toLowerCase()} ${t.min}\u2013${t.max}`)
            .join(" · ")}{" "}
          hrs.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "brass" | "ink";
}) {
  const valueColor = accent === "brass" ? "text-brass-600" : accent === "ink" ? "text-ink-700" : "text-ink-900";
  return (
    <div className="rounded-sm border border-ink-900/10 bg-white px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">{label}</p>
      <p className={`ledger-number mt-1 text-2xl ${valueColor}`}>{value}</p>
    </div>
  );
}
