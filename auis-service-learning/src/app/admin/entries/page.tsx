import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { EntriesManager } from "@/components/EntriesManager";

export default async function AdminEntriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/dashboard");

  const semester = await prisma.semester.findFirst({ where: { isActive: true } });
  const entries = semester
    ? await prisma.volunteerEntry.findMany({
        where: { semesterId: semester.id },
        include: { student: { select: { name: true, email: true, studentId: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="min-h-screen bg-parchment-100">
      <SiteHeader name={session.user.name} role="ADMIN" />
      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brass-600">
          Student Services
        </p>
        <h1 className="mt-1 font-display text-3xl italic text-ink-900">Entries</h1>
        <p className="mt-1 max-w-[65ch] text-sm text-ink-500">
          {semester ? semester.name : "No active semester"} — review individual submissions, nudge a
          slow supervisor, step in directly if one can&rsquo;t be reached, or log hours a student
          reported to you in person.
        </p>

        <div className="mt-8">
          <EntriesManager
            hasSemester={!!semester}
            initialEntries={entries.map((e) => ({
              id: e.id,
              date: e.date.toISOString(),
              department: e.department,
              action: e.action,
              hours: e.hours,
              status: e.status,
              supervisorName: e.supervisorName,
              supervisorEmail: e.supervisorEmail,
              rejectedReason: e.rejectedReason,
              reminderSentAt: e.reminderSentAt?.toISOString() ?? null,
              studentName: e.student.name,
              studentEmail: e.student.email,
              studentIdNo: e.student.studentId,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
