import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAwardTier } from "@/lib/awards";
import { AwardBadge } from "@/components/AwardBadge";
import { StatusPill } from "@/components/StatusPill";
import { DeleteEntryButton } from "@/components/DeleteEntryButton";
import { SiteHeader } from "@/components/SiteHeader";
import { StudentIdPrompt } from "@/components/StudentIdPrompt";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  const [user, semester] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.semester.findFirst({ where: { isActive: true } }),
  ]);
  const entries = semester
    ? await prisma.volunteerEntry.findMany({
        where: { studentId: userId, semesterId: semester.id },
        orderBy: { date: "desc" },
      })
    : [];

  const approvedHours = entries.filter((e) => e.status === "APPROVED").reduce((sum, e) => sum + e.hours, 0);
  const tier = getAwardTier(approvedHours);
  const deadlinePassed = semester ? new Date() > semester.deadline : false;

  return (
    <div className="min-h-screen bg-parchment-100">
      <SiteHeader name={session.user.name} role="STUDENT" />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brass-600">
              {session.user.name?.split(" ")[0] ?? "Student"}&rsquo;s Ledger
            </p>
            <h1 className="mt-1 font-display text-3xl italic text-ink-900">Your Volunteering Hours</h1>
            <p className="mt-1 text-sm text-ink-500">
              {semester ? semester.name : "No active semester configured yet."}
              {" · "}
              <Link href="/help" className="brass-underline text-ink-600">
                How this works
              </Link>
            </p>
          </div>
          {!deadlinePassed && semester && (
            <Link
              href="/entries/new"
              className="shrink-0 rounded-sm bg-ink-900 px-5 py-2.5 text-sm font-semibold tracking-wide text-parchment-50 shadow-seal transition hover:bg-ink-800"
            >
              + Add Entry
            </Link>
          )}
        </div>

        {semester && (
          <p className="mt-2 text-xs tracking-wide text-ink-500/70">
            Submission deadline: {semester.deadline.toDateString()}
            {deadlinePassed && (
              <span className="ml-1 font-medium text-claret-500"> — submissions are now closed</span>
            )}
          </p>
        )}

        {!user?.studentId && <StudentIdPrompt />}

        <div className="mt-8">
          <AwardBadge tier={tier} approvedHours={approvedHours} />
        </div>

        <div className="mt-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-ink-500">
            Entries — {entries.length}
          </p>

          <div className="space-y-3">
            {entries.length === 0 && (
              <div className="rule-frame rounded-sm border-dashed bg-white/40 p-10 text-center">
                <p className="font-display text-lg italic text-ink-700">Nothing logged yet</p>
                <p className="mt-1 text-sm text-ink-500">
                  Add your first volunteering entry to begin your record.
                </p>
              </div>
            )}
            {entries.map((e, i) => (
              <div
                key={e.id}
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                className="group animate-rise rounded-sm border border-ink-900/10 bg-white p-5 transition-shadow hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-display text-lg text-ink-900">{e.department}</p>
                    <p className="mt-0.5 text-sm text-ink-600">{e.action}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-ink-500/70">
                      {new Date(e.date).toDateString()} &middot; {e.hours} hrs &middot; Supervisor:{" "}
                      {e.supervisorName}
                    </p>
                    {e.status === "REJECTED" && e.rejectedReason && (
                      <p className="mt-1.5 text-xs text-claret-500">Reason: {e.rejectedReason}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusPill status={e.status} />
                    {e.status === "PENDING" && <DeleteEntryButton entryId={e.id} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
