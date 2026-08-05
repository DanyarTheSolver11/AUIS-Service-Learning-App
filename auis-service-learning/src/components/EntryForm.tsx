"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EntryForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: "",
    department: "",
    action: "",
    hours: "",
    supervisorName: "",
    supervisorEmail: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, hours: parseFloat(form.hours) }),
    });

    setLoading(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Please check the fields and try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div>
        <label className="text-sm font-medium">Date</label>
        <input
          type="date"
          required
          value={form.date}
          onChange={(e) => update("date", e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Department / Organization</label>
        <input
          type="text"
          required
          placeholder="e.g. AUIS Library"
          value={form.department}
          onChange={(e) => update("department", e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium">What did you do?</label>
        <textarea
          required
          rows={3}
          placeholder="Briefly describe your volunteering activity"
          value={form.action}
          onChange={(e) => update("action", e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Number of hours</label>
        <input
          type="number"
          step="0.5"
          min="0.5"
          max="24"
          required
          value={form.hours}
          onChange={(e) => update("hours", e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Supervisor's name</label>
          <input
            type="text"
            required
            value={form.supervisorName}
            onChange={(e) => update("supervisorName", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Supervisor's email</label>
          <input
            type="email"
            required
            value={form.supervisorEmail}
            onChange={(e) => update("supervisorEmail", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Your supervisor will get an email with a one-click link to confirm this entry. No account needed on their end.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit entry & notify supervisor"}
      </button>
    </form>
  );
}
