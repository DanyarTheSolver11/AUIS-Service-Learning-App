import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EntryForm } from "@/components/EntryForm";
import { SiteHeader } from "@/components/SiteHeader";

export default async function NewEntryPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-parchment-100">
      <SiteHeader name={session?.user?.name} role="STUDENT" />
      <div className="mx-auto max-w-lg px-6 py-14">
        <Link
          href="/dashboard"
          className="brass-underline text-xs font-medium uppercase tracking-[0.15em] text-ink-600"
        >
          ← Back to your ledger
        </Link>

        <h1 className="mt-4 font-display text-3xl italic text-ink-900">Add Volunteering Entry</h1>
        <p className="mt-1 text-sm text-ink-500">Every entry is confirmed by your supervisor before it counts.</p>

        <div className="rule-frame animate-unfurl mt-8 origin-top rounded-sm bg-parchment-50 p-7 shadow-lift">
          <EntryForm />
        </div>
      </div>
    </div>
  );
}
