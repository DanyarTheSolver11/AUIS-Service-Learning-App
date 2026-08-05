"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">AUIS Service Learning Program</h1>
        <p className="mt-2 text-sm text-slate-500">
          Log your volunteering hours for the AUIS Awards Ceremony.
        </p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Continue with AUIS Google Account
        </button>
        <p className="mt-4 text-xs text-slate-400">
          Only @auis.edu.krd accounts can sign in.
        </p>
      </div>
    </div>
  );
}
