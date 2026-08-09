"use client";

import { Eagle } from "@/components/Eagle";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-800 px-6">
      <div className="text-center">
        <Eagle className="mx-auto h-10 w-12 text-brass-400/70" />
        <p className="mt-6 font-display text-3xl italic text-white">Something went wrong</p>
        <p className="mt-2 max-w-sm text-sm text-parchment-100/60">
          This has been logged. Try again, or contact IT if it keeps happening.
        </p>
        <button
          onClick={reset}
          className="mt-7 rounded-sm border border-brass-400/40 px-5 py-2.5 text-sm font-medium text-brass-200 transition hover:bg-white/5"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
