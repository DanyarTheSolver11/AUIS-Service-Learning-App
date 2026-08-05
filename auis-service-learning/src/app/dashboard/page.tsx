import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAwardTier } from "@/lib/awards";
import { AwardBadge } from "@/components/AwardBadge";
import { StatusPill } from "@/components/StatusPill";
import { DeleteEntryButton } from "@/components/DeleteEntryButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  const semester = await prisma.semester.findFirst({ where: { isActive: true } });
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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your Volunteering Hours</h1>
          <p className="text-sm text-slate-500">{semester ? semester.name : "No active semester configured yet."}</p>
        </div>
        {!deadlinePassed && semester && (
          <Link href="/entries/new" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            + Add Entry
          </Link>
        )}
      </div>

      {semester && (
        <p className="mt-1 text-xs text-slate-400">
          Submission deadline: {semester.deadline.toDateString()}
          {deadlinePassed && " — submissions are now closed"}
        </p>
      )}

      <div className="mt-6">
        <AwardBadge tier={tier} approvedHours={approvedHours} />
      </div>

      <div className="mt-8 space-y-3">
        {entries.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No entries yet. Add your first volunteering entry to get started.
          </p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{e.department}</p>
                <p className="text-sm text-slate-600">{e.action}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(e.date).toDateString()} · {e.hours} hrs · Supervisor: {e.supervisorName}
                </p>
                {e.status === "REJECTED" && e.rejectedReason && (
                  <p className="mt-1 text-xs text-red-600">Reason: {e.rejectedReason}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusPill status={e.status} />
                {e.status === "PENDING" && <DeleteEntryButton entryId={e.id} />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
