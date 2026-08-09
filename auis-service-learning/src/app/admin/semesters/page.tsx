import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SemesterManager } from "@/components/SemesterManager";

export default async function SemestersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/dashboard");

  const semesters = await prisma.semester.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { entries: true } } },
  });

  return (
    <div className="min-h-screen bg-parchment-100">
      <SiteHeader name={session.user.name} role="ADMIN" />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brass-600">
          Student Services
        </p>
        <h1 className="mt-1 font-display text-3xl italic text-ink-900">Semester Windows</h1>
        <p className="mt-1 max-w-[60ch] text-sm text-ink-500">
          Exactly one semester is &ldquo;active&rdquo; at a time — that&rsquo;s the window students
          submit into. Create the next one ahead of time, then flip it active when it's ready
          to open for submissions.
        </p>

        <div className="mt-8">
          <SemesterManager
            initialSemesters={semesters.map((s) => ({
              ...s,
              startDate: s.startDate.toISOString(),
              endDate: s.endDate.toISOString(),
              deadline: s.deadline.toISOString(),
              entryCount: s._count.entries,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
