import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAwardTier, getAwardLabel } from "@/lib/awards";
import { StatusPill } from "@/components/StatusPill";

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Student Services — Volunteer Hours</h1>
          <p className="text-sm text-slate-500">{semester ? semester.name : "No active semester configured"}</p>
        </div>
        {semester && (
          <a href="/api/admin/export" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Export ceremony list (CSV)
          </a>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Approved Hours</th>
              <th className="px-4 py-3">Award Tier</th>
              <th className="px-4 py-3">Pending Entries</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.student.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.student.name ?? "—"}</p>
                  <p className="text-xs text-slate-400">{r.student.email}</p>
                </td>
                <td className="px-4 py-3">{r.student.studentId ?? "—"}</td>
                <td className="px-4 py-3">{r.totalHours.toFixed(1)}</td>
                <td className="px-4 py-3">{getAwardLabel(r.tier)}</td>
                <td className="px-4 py-3">
                  {r.pending > 0 ? <StatusPill status="PENDING" /> : <span className="text-slate-400">—</span>}
                  {r.pending > 0 && <span className="ml-1 text-xs text-slate-500">({r.pending})</span>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No entries submitted yet this semester.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
