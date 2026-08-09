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

  const fieldCx =
    "mt-1.5 w-full rounded-sm border border-ink-900/15 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500/40 transition focus:border-brass-400 focus:outline-none focus:ring-2 focus:ring-brass-400/25";
  const labelCx = "text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-sm border border-claret-500/30 bg-claret-500/5 px-4 py-3 text-sm text-claret-600">
          {error}
        </p>
      )}

      <div>
        <label className={labelCx}>Date</label>
        <input
          type="date"
          required
          value={form.date}
          onChange={(e) => update("date", e.target.value)}
          className={fieldCx}
        />
      </div>

      <div>
        <label className={labelCx}>Department / Organization</label>
        <input
          type="text"
          required
          placeholder="e.g. AUIS Library"
          value={form.department}
          onChange={(e) => update("department", e.target.value)}
          className={fieldCx}
        />
      </div>

      <div>
        <label className={labelCx}>What did you do?</label>
        <textarea
          required
          rows={3}
          placeholder="Briefly describe your volunteering activity"
          value={form.action}
          onChange={(e) => update("action", e.target.value)}
          className={fieldCx}
        />
      </div>

      <div>
        <label className={labelCx}>Number of hours</label>
        <input
          type="number"
          step="0.5"
          min="0.5"
          max="24"
          required
          value={form.hours}
          onChange={(e) => update("hours", e.target.value)}
          className={fieldCx}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCx}>Supervisor&rsquo;s name</label>
          <input
            type="text"
            required
            value={form.supervisorName}
            onChange={(e) => update("supervisorName", e.target.value)}
            className={fieldCx}
          />
        </div>
        <div>
          <label className={labelCx}>Supervisor&rsquo;s email</label>
          <input
            type="email"
            required
            value={form.supervisorEmail}
            onChange={(e) => update("supervisorEmail", e.target.value)}
            className={fieldCx}
          />
        </div>
      </div>

      <p className="border-l-2 border-brass-400/50 pl-3 text-xs leading-relaxed text-ink-500">
        Your supervisor will receive an email with a one-click link to confirm this entry.
        No account is required on their end.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm bg-ink-900 px-4 py-3 text-sm font-semibold tracking-wide text-parchment-50 transition hover:bg-ink-800 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit Entry & Notify Supervisor"}
      </button>
    </form>
  );
}
