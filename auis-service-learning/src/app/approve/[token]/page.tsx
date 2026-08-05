"use client";

import { useEffect, useState } from "react";

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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="max-w-sm rounded-xl bg-red-50 p-6 text-center text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!entry) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>;
  }

  if (done || entry.status !== "PENDING") {
    const status = done ?? entry.status;
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-lg font-medium">
            {status === "APPROVED" ? "Thanks — entry confirmed ✓" : "Entry marked as not confirmed"}
          </p>
          <p className="mt-2 text-sm text-slate-500">You can close this page now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8">
        <p className="text-sm text-slate-500">AUIS Service Learning Program</p>
        <h1 className="mt-1 text-lg font-semibold">Confirm {entry.studentName}'s volunteer hours</h1>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Date</dt><dd>{new Date(entry.date).toDateString()}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Department</dt><dd>{entry.department}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Hours</dt><dd>{entry.hours}</dd></div>
          <div><dt className="text-slate-500">Activity</dt><dd className="mt-1">{entry.action}</dd></div>
        </dl>

        {!showRejectBox ? (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => decide("APPROVED")}
              disabled={submitting}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              ✓ Confirm — this is accurate
            </button>
            <button
              onClick={() => setShowRejectBox(true)}
              disabled={submitting}
              className="flex-1 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              This isn't right
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <textarea
              placeholder="Optional: let the student know why (e.g. wrong hours, didn't happen)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={() => decide("REJECTED")}
                disabled={submitting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Submit
              </button>
              <button
                onClick={() => setShowRejectBox(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
