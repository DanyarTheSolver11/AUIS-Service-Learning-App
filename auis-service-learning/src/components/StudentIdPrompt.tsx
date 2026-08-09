"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StudentIdPrompt() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: value }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else setError((await res.json()).error ?? "Couldn't save that — try again.");
  }

  return (
    <div className="rule-frame animate-rise mb-6 rounded-sm border-brass-400/50 bg-brass-200/20 p-5">
      <p className="text-sm font-semibold text-ink-800">One quick thing before you start —</p>
      <p className="mt-1 text-sm text-ink-600">
        Student Services needs your <b>Student ID</b> to list you correctly for the Awards Ceremony.
      </p>
      <form onSubmit={handleSave} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          required
          placeholder="e.g. dd23103"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-sm border border-ink-900/15 bg-white px-3.5 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-2 focus:ring-brass-400/25"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-sm bg-ink-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-claret-600">{error}</p>}
    </div>
  );
}
