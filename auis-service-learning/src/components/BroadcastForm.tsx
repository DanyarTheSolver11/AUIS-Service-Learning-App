"use client";

import { useState } from "react";

const AUDIENCES = [
  { value: "ALL_STUDENTS", label: "Every student who has logged in", hint: "Everyone in the system" },
  { value: "NO_ENTRIES", label: "Haven't submitted anything yet", hint: "Good for a first nudge" },
  { value: "HAS_PENDING", label: "Have an entry awaiting supervisor confirmation", hint: "Chase-up reminder" },
  { value: "BELOW_10_HOURS", label: "Below the 10-hour minimum so far", hint: "Encourage them toward qualifying" },
] as const;

export function BroadcastForm() {
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]["value"]>("HAS_PENDING");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);

  const selectedAudience = AUDIENCES.find((a) => a.value === audience)!;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }

    setSending(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audience, subject, message }),
    });
    setSending(false);
    setConfirmStep(false);
    if (res.ok) setResult(await res.json());
    else setError((await res.json()).error ?? "That didn't send.");
  }

  const fieldCx =
    "mt-1.5 w-full rounded-sm border border-ink-900/15 bg-white px-3.5 py-2.5 text-sm focus:border-brass-400 focus:outline-none focus:ring-2 focus:ring-brass-400/25";
  const labelCx = "text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600";

  return (
    <form onSubmit={handleSend} className="rule-frame space-y-5 rounded-sm bg-white p-7 shadow-lift">
      {error && (
        <p className="rounded-sm border border-claret-500/30 bg-claret-500/5 px-4 py-3 text-sm text-claret-600">
          {error}
        </p>
      )}
      {result && (
        <div className="rounded-sm border border-ink-600/20 bg-ink-600/5 px-4 py-3 text-sm text-ink-800">
          Sent to {result.sent} student{result.sent === 1 ? "" : "s"}.
          {result.failed.length > 0 && (
            <span className="text-claret-600"> {result.failed.length} failed to deliver.</span>
          )}
        </div>
      )}

      <div>
        <label className={labelCx}>Audience</label>
        <select
          value={audience}
          onChange={(e) => {
            setAudience(e.target.value as typeof audience);
            setConfirmStep(false);
          }}
          className={fieldCx}
        >
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink-500">{selectedAudience.hint}</p>
      </div>

      <div>
        <label className={labelCx}>Subject</label>
        <input
          type="text"
          required
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setConfirmStep(false);
          }}
          placeholder="e.g. One week left to log your volunteering hours"
          className={fieldCx}
        />
      </div>

      <div>
        <label className={labelCx}>Message</label>
        <textarea
          required
          rows={7}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setConfirmStep(false);
          }}
          placeholder="Write plainly — this goes out as-is, no need to add a greeting or sign-off, those are added automatically."
          className={fieldCx}
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className={`w-full rounded-sm px-4 py-3 text-sm font-semibold tracking-wide transition disabled:opacity-50 ${
          confirmStep ? "bg-claret-500 text-white hover:bg-claret-600" : "bg-ink-900 text-parchment-50 hover:bg-ink-800"
        }`}
      >
        {sending
          ? "Sending…"
          : confirmStep
          ? `Confirm — send to "${selectedAudience.label}"`
          : "Review & Send"}
      </button>
      {confirmStep && !sending && (
        <button
          type="button"
          onClick={() => setConfirmStep(false)}
          className="w-full text-center text-xs text-ink-500 hover:text-ink-700"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
