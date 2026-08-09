import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { EmailConfigBanner } from "@/components/EmailConfigBanner";
import { BroadcastForm } from "@/components/BroadcastForm";

export default async function BroadcastPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-parchment-100">
      <SiteHeader name={session.user.name} role="ADMIN" />
      <div className="mx-auto max-w-2xl px-6 py-14">
        <EmailConfigBanner />

        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brass-600">
          Student Services
        </p>
        <h1 className="mt-1 font-display text-3xl italic text-ink-900">Message Students</h1>
        <p className="mt-1 max-w-[60ch] text-sm text-ink-500">
          Send a one-off email to a filtered group — a deadline reminder, a nudge to students who
          haven&rsquo;t started, or anything else you&rsquo;d otherwise send manually.
        </p>

        <div className="mt-8">
          <BroadcastForm />
        </div>
      </div>
    </div>
  );
}
