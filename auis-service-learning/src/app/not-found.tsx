import Link from "next/link";
import { Eagle } from "@/components/Eagle";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-800 px-6">
      <div className="text-center">
        <Eagle className="mx-auto h-10 w-12 text-brass-400/70" />
        <p className="mt-6 font-display text-4xl italic text-white">Page not found</p>
        <p className="mt-2 text-sm text-parchment-100/60">
          That link doesn&rsquo;t lead anywhere in the Volunteering Hours Tracker.
        </p>
        <Link
          href="/"
          className="mt-7 inline-block rounded-sm border border-brass-400/40 px-5 py-2.5 text-sm font-medium text-brass-200 transition hover:bg-white/5"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
