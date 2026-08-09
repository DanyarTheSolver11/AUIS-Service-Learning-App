"use client";

import { useEffect, useState } from "react";
import { Eagle } from "@/components/Eagle";

type EntryView = {
  id: string;
  date: string;
  department: string;
  action: string;
  hours: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  studentName: string;
  supervisorName: string;
};

export default function ApprovePage({ params }: { params: { token: string } }) {
  const [entry, setEntry] = useState<EntryView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [reason, setReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  useEffect(() => {
    fetch(`/api/approve/${params.token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Unable to load this entry.");
        return r.json();
      })
      .then((data) => setEntry(data.entry))
      .catch((e) => setError(e.message));
  }, [params.token]);

  async function decide(decision: "APPROVED" | "REJECTED") {
    setSubmitting(true);
    const res = await fetch(`/api/approve/${params.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason: decision === "REJECTED" ? reason : undefined }),
    });
    setSubmitting(false);
    if (res.ok) setDone(decision);
    else setError((await res.json()).error ?? "Something went wrong.");
  }

  const shell = (children: React.ReactNode) => (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-800 px-6 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,theme(colors.ink.700)_0%,transparent_65%)] opacity-80" />
        <Eagle className="absolute left-1/2 top-1/2 h-[460px] w-[580px] -translate-x-1/2 -translate-y-[54%] text-brass-300/[0.06]" />
      </div>
      <div className="relative w-full max-w-md animate-rise">{children}</div>
    </div>
  );

  if (error) {
    return shell(
      <div className="rule-frame rounded-sm bg-parchment-50 p-8 text-center shadow-lift">
        <p className="font-display text-lg italic text-claret-600">This link couldn&rsquo;t be opened</p>
        <p className="mt-2 text-sm text-ink-600">{error}</p>
      </div>
    );
  }

  if (!entry) {
    return shell(
      <div className="flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass-300/40 border-t-brass-300" />
      </div>
    );
  }

  if (done || entry.status !== "PENDING") {
    const status = done ?? entry.status;
    return shell(
      <div className="rule-frame rounded-sm bg-parchment-50 p-9 text-center shadow-lift">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-lg ${
            status === "APPROVED" ? "bg-ink-600/10 text-ink-700" : "bg-claret-500/10 text-claret-600"
          }`}
        >
          {status === "APPROVED" ? "✓" : "—"}
        </div>
        <p className="mt-4 font-display text-xl italic text-ink-900">
          {status === "APPROVED" ? "Entry confirmed" : "Marked as not confirmed"}
        </p>
        <p className="mt-2 text-sm text-ink-500">Thank you — you may close this page now.</p>
      </div>
    );
  }

  return shell(
    <div className="rule-frame rounded-sm bg-parchment-50 p-8 shadow-lift">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brass-600">
        AUIS Volunteering Hours Tracker
      </p>
      <h1 className="mt-2 font-display text-xl italic text-ink-900">
        Confirm {entry.studentName}&rsquo;s volunteer hours
      </h1>

      <dl className="mt-6 space-y-2.5 border-y border-ink-900/10 py-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-500">Date</dt>
          <dd className="text-ink-900">{new Date(entry.date).toDateString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500">Department</dt>
          <dd className="text-ink-900">{entry.department}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500">Hours</dt>
          <dd className="ledger-number text-ink-900">{entry.hours}</dd>
        </div>
        <div>
          <dt className="text-ink-500">Activity</dt>
          <dd className="mt-1 text-ink-900">{entry.action}</dd>
        </div>
      </dl>

      {!showRejectBox ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => decide("APPROVED")}
            disabled={submitting}
            className="flex-1 rounded-sm bg-ink-900 px-4 py-3 text-sm font-semibold tracking-wide text-parchment-50 transition hover:bg-ink-800 disabled:opacity-50"
          >
            ✓ Confirm — this is accurate
          </button>
          <button
            onClick={() => setShowRejectBox(true)}
            disabled={submitting}
            className="flex-1 rounded-sm border border-claret-500/40 px-4 py-3 text-sm font-semibold text-claret-600 transition hover:bg-claret-500/5"
          >
            This isn&rsquo;t right
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <textarea
            placeholder="Optional: let the student know why (e.g. wrong hours, didn't happen)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3.5 py-2.5 text-sm focus:border-brass-400 focus:outline-none focus:ring-2 focus:ring-brass-400/25"
          />
          <div className="flex gap-3">
            <button
              onClick={() => decide("REJECTED")}
              disabled={submitting}
              className="flex-1 rounded-sm bg-claret-500 px-4 py-3 text-sm font-semibold text-parchment-50 transition hover:bg-claret-600 disabled:opacity-50"
            >
              Submit
            </button>
            <button
              onClick={() => setShowRejectBox(false)}
              className="rounded-sm border border-ink-900/15 px-4 py-3 text-sm text-ink-700 hover:bg-ink-900/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
