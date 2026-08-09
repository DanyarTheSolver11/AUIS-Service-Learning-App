"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eagle } from "@/components/Eagle";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-800 px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,theme(colors.ink.700)_0%,transparent_65%)] opacity-80" />
        <Eagle className="absolute left-1/2 top-1/2 h-[520px] w-[650px] -translate-x-1/2 -translate-y-[54%] text-brass-300/[0.07]" />
      </div>

      <div className="relative w-full max-w-sm animate-rise">
        <div className="rule-frame rounded-sm bg-white/[0.06] px-9 py-11 text-center backdrop-blur-sm">
          <Eagle className="mx-auto h-9 w-11 text-brass-300" />

          <p className="mt-4 font-display text-[11px] uppercase tracking-[0.35em] text-brass-300">
            American University of Iraq, Sulaimani
          </p>

          <div className="mx-auto my-6 h-px w-10 bg-brass-400/60" />

          <h1 className="font-display text-3xl italic text-white">
            Volunteering Hours
            <span className="block not-italic text-[13px] font-medium tracking-[0.2em] text-brass-200/80">
              TRACKER &middot; AUIS STUDENT SERVICES
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-[26ch] text-sm leading-relaxed text-parchment-100/70">
            Record your volunteering, gather supervisor confirmation, and track your standing
            toward this year&rsquo;s Awards Ceremony.
          </p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="group mt-9 flex w-full items-center justify-center gap-3 rounded-sm border border-brass-400/50 bg-brass-500 px-5 py-3 text-sm font-semibold tracking-wide text-white transition-all hover:bg-brass-600 active:scale-[0.99]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path fill="currentColor" d="M12.24 10.28v3.68h5.12c-.22 1.32-1.6 3.88-5.12 3.88-3.08 0-5.6-2.56-5.6-5.72s2.52-5.72 5.6-5.72c1.76 0 2.94.75 3.62 1.4l2.47-2.38C16.87 3.87 14.76 3 12.24 3 7.28 3 3.24 7.02 3.24 12s4.04 9 9 9c5.2 0 8.64-3.66 8.64-8.82 0-.59-.06-1.04-.14-1.5z"/>
            </svg>
            Continue with AUIS Google Account
          </button>

          <p className="mt-5 text-[11px] tracking-wide text-parchment-100/40">
            Access restricted to @auis.edu.krd accounts
          </p>
        </div>

        <p className="mt-6 text-center font-display text-[13px] italic tracking-[0.08em] text-brass-200/50">
          &ldquo;Learn Today, Lead Tomorrow&rdquo;
        </p>
        <Link
          href="/help"
          className="mt-3 block text-center text-[11px] uppercase tracking-[0.15em] text-parchment-100/40 transition hover:text-brass-200/70"
        >
          How does this work?
        </Link>
      </div>
    </div>
  );
}
