import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { AWARD_THRESHOLDS } from "@/lib/awards";
import { prisma } from "@/lib/prisma";

export default async function HelpPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user ? ((session.user as any).role as "STUDENT" | "ADMIN") : "STUDENT";
  const semester = await prisma.semester.findFirst({ where: { isActive: true } });

  return (
    <div className="min-h-screen bg-parchment-100">
      {session?.user ? (
        <SiteHeader name={session.user.name} role={role} />
      ) : (
        <div className="border-b border-brass-400/25 bg-ink-800 px-6 py-4">
          <p className="font-display text-sm italic text-white">AUIS Volunteering Hours Tracker</p>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-6 py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brass-600">
          How It Works
        </p>
        <h1 className="mt-1 font-display text-3xl italic text-ink-900">Volunteering Hours, Step by Step</h1>
        {semester && (
          <p className="mt-1 text-sm text-ink-500">
            Current window: {semester.name} &middot; deadline {semester.deadline.toDateString()}
          </p>
        )}

        <ol className="mt-8 space-y-6">
          <Step n={1} title="Log an entry">
            Whenever you finish a volunteering activity, add it from your dashboard: the date,
            where you volunteered, what you did, how many hours, and your supervisor&rsquo;s name
            and email. Do this as you go — you don&rsquo;t need to wait until the semester ends.
          </Step>
          <Step n={2} title="Your supervisor confirms it">
            The moment you submit, your supervisor gets an email with a one-click link to confirm
            or reject the entry. They don&rsquo;t need an account or to log in anywhere — just one
            click. Until they respond, your entry shows as <b>Pending</b>.
          </Step>
          <Step n={3} title="It counts toward your total">
            Once confirmed, the hours count immediately — your dashboard updates live with your
            running total and current award tier.
          </Step>
          <Step n={4} title="Awards are calculated automatically">
            At the end of the window, Student Services pulls the final list. If you&rsquo;ve
            crossed 10 confirmed hours, you qualify — no separate form, no signatures, no
            scanning.
          </Step>
        </ol>

        <div className="rule-frame mt-10 rounded-sm bg-white p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-600">
            Award Tiers
          </p>
          <table className="mt-3 w-full text-left text-sm">
            <tbody>
              {AWARD_THRESHOLDS.slice()
                .reverse()
                .map((t) => (
                  <tr key={t.tier} className="border-t border-ink-900/10">
                    <td className="py-2 font-medium text-ink-800">
                      {t.tier.charAt(0) + t.tier.slice(1).toLowerCase()}
                    </td>
                    <td className="py-2 text-ink-600">
                      {t.min}–{t.max} hours
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-sm border-l-2 border-brass-400/60 bg-brass-200/10 p-5 text-sm text-ink-700">
          <p className="font-semibold text-ink-800">A few things worth knowing</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>An entry only counts once your supervisor confirms it — pending hours don&rsquo;t count yet.</li>
            <li>You can edit or delete an entry only while it&rsquo;s still Pending.</li>
            <li>Entries must fall within the current semester&rsquo;s date window.</li>
            <li>After the submission deadline, new entries can no longer be added.</li>
            <li>
              GPA-based awards (Dean&rsquo;s/President&rsquo;s) are separate and automatic — no
              submission needed for those.
            </li>
          </ul>
        </div>

        <p className="mt-8 text-sm text-ink-500">
          Still stuck? Reach out to Student Services directly.
        </p>

        {session?.user && (
          <Link
            href={role === "ADMIN" ? "/admin" : "/dashboard"}
            className="mt-6 inline-block brass-underline text-xs font-medium uppercase tracking-[0.15em] text-ink-600"
          >
            ← Back to your dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 font-display text-sm italic text-white">
        {n}
      </span>
      <div>
        <p className="font-display text-lg text-ink-900">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">{children}</p>
      </div>
    </li>
  );
}
