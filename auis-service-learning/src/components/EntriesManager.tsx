"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "./StatusPill";

type Entry = {
  id: string;
  date: string;
  department: string;
  action: string;
  hours: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  supervisorName: string;
  supervisorEmail: string;
  rejectedReason: string | null;
  reminderSentAt: string | null;
  studentName: string | null;
  studentEmail: string;
  studentIdNo: string | null;
};

type Filter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const fieldCx =
  "w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-2 focus:ring-brass-400/25";
const labelCx = "text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500";

export function EntriesManager({
  initialEntries,
  hasSemester,
}: {
  initialEntries: Entry[];
  hasSemester: boolean;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filter !== "ALL" && e.status !== filter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (e.studentName ?? "").toLowerCase().includes(q) ||
        e.studentEmail.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
      );
    });
  }, [entries, filter, search]);

  const counts = useMemo(
    () => ({
      ALL: entries.length,
      PENDING: entries.filter((e) => e.status === "PENDING").length,
      APPROVED: entries.filter((e) => e.status === "APPROVED").length,
      REJECTED: entries.filter((e) => e.status === "REJECTED").length,
    }),
    [entries]
  );

  async function override(id: string, decision: "APPROVED" | "REJECTED") {
    if (decision === "REJECTED" && !confirm("Mark this entry as not confirmed?")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setBusyId(null);
    if (res.ok) {
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: decision } : e)));
      router.refresh();
    } else setNotice((await res.json()).error ?? "That didn't go through.");
  }

  async function remind(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/admin/entries/${id}/remind`, { method: "POST" });
    setBusyId(null);
    if (res.ok) {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, reminderSentAt: new Date().toISOString() } : e))
      );
      setNotice("Reminder sent to the supervisor.");
    } else setNotice((await res.json()).error ?? "Couldn't send that reminder.");
  }

  async function remove(id: string) {
    if (!confirm("Permanently delete this entry? This can't be undone.")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/entries/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      router.refresh();
    } else setNotice((await res.json()).error ?? "Couldn't delete that entry.");
  }

  if (!hasSemester) {
    return (
      <p className="rule-frame rounded-sm border-dashed bg-white/40 p-10 text-center text-sm text-ink-500">
        No active semester configured yet — set one up under Semesters first.
      </p>
    );
  }

  return (
    <div>
      {notice && (
        <div className="mb-4 flex items-center justify-between rounded-sm border border-brass-400/40 bg-brass-200/20 px-4 py-2.5 text-sm text-ink-800">
          {notice}
          <button onClick={() => setNotice(null)} className="text-xs text-ink-500 hover:text-ink-800">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-sm px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition ${
                filter === f ? "bg-ink-900 text-white" : "border border-ink-900/15 text-ink-600 hover:bg-ink-900/5"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()} ({counts[f]})
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search student or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${fieldCx} sm:max-w-[240px]`}
        />
      </div>

      <div className="mt-5 space-y-3">
        {filtered.length === 0 && (
          <p className="rule-frame rounded-sm border-dashed bg-white/40 p-10 text-center text-sm text-ink-500">
            Nothing here.
          </p>
        )}
        {filtered.map((e) => (
          <div key={e.id} className="rule-frame rounded-sm bg-white p-5 shadow-seal">
            {editingId === e.id ? (
              <EditEntryForm
                entry={e}
                onCancel={() => setEditingId(null)}
                onSaved={(updated) => {
                  setEntries((prev) => prev.map((x) => (x.id === e.id ? { ...x, ...updated } : x)));
                  setEditingId(null);
                  router.refresh();
                }}
                onError={setNotice}
              />
            ) : (
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base text-ink-900">{e.studentName ?? e.studentEmail}</p>
                    <StatusPill status={e.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {e.studentEmail} {e.studentIdNo && `· ID ${e.studentIdNo}`}
                  </p>
                  <p className="mt-2 text-sm text-ink-800">
                    {e.department} — {e.hours} hrs on {new Date(e.date).toDateString()}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-600">{e.action}</p>
                  <p className="mt-2 text-xs text-ink-500">
                    Supervisor: {e.supervisorName} ({e.supervisorEmail})
                    {e.reminderSentAt && <> · reminded {new Date(e.reminderSentAt).toDateString()}</>}
                  </p>
                  {e.rejectedReason && <p className="mt-1 text-xs text-claret-600">Reason: {e.rejectedReason}</p>}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {e.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => override(e.id, "APPROVED")}
                        disabled={busyId === e.id}
                        className="rounded-sm bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => override(e.id, "REJECTED")}
                        disabled={busyId === e.id}
                        className="rounded-sm border border-claret-500/30 px-3 py-1.5 text-xs font-medium text-claret-600 hover:bg-claret-500/5 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => remind(e.id)}
                        disabled={busyId === e.id}
                        className="rounded-sm border border-ink-900/15 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-900/5 disabled:opacity-50"
                      >
                        Remind
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setEditingId(e.id)}
                    className="rounded-sm border border-ink-900/15 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-900/5"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(e.id)}
                    disabled={busyId === e.id}
                    className="rounded-sm border border-claret-500/20 px-3 py-1.5 text-xs font-medium text-claret-500/80 hover:bg-claret-500/5 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        {showManual ? (
          <ManualEntryForm
            onCancel={() => setShowManual(false)}
            onCreated={(entry) => {
              setEntries((prev) => [entry, ...prev]);
              setShowManual(false);
              router.refresh();
            }}
            onError={setNotice}
          />
        ) : (
          <button
            onClick={() => setShowManual(true)}
            className="w-full rounded-sm border border-dashed border-ink-900/20 py-4 text-sm font-medium text-ink-600 transition hover:border-brass-400/60 hover:bg-brass-200/10"
          >
            + Log hours on a student&rsquo;s behalf
          </button>
        )}
      </div>
    </div>
  );
}

function ManualEntryForm({
  onCancel,
  onCreated,
  onError,
}: {
  onCancel: () => void;
  onCreated: (e: Entry) => void;
  onError: (e: string) => void;
}) {
  const [studentEmail, setStudentEmail] = useState("");
  const [date, setDate] = useState("");
  const [department, setDepartment] = useState("");
  const [action, setAction] = useState("");
  const [hours, setHours] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentEmail, date, department, action, hours: parseFloat(hours) }),
    });
    setSaving(false);
    if (res.ok) {
      const { entry } = await res.json();
      onCreated({
        ...entry,
        date: entry.date,
        studentName: null,
        studentEmail,
        studentIdNo: null,
        reminderSentAt: null,
      });
    } else onError((await res.json()).error ?? "Couldn't log that entry.");
  }

  return (
    <form onSubmit={handleSubmit} className="rule-frame space-y-3 rounded-sm bg-white p-5 shadow-seal">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-600">
        Manual Entry — auto-approved, on your authority
      </p>
      <div>
        <label className={labelCx}>Student&rsquo;s AUIS email</label>
        <input
          type="email"
          required
          placeholder="student@auis.edu.krd"
          value={studentEmail}
          onChange={(e) => setStudentEmail(e.target.value)}
          className={fieldCx}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCx}>Date</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={fieldCx} />
        </div>
        <div>
          <label className={labelCx}>Hours</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            required
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className={fieldCx}
          />
        </div>
      </div>
      <div>
        <label className={labelCx}>Department / Organization</label>
        <input
          required
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className={fieldCx}
        />
      </div>
      <div>
        <label className={labelCx}>What did they do?</label>
        <textarea required rows={2} value={action} onChange={(e) => setAction(e.target.value)} className={fieldCx} />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-ink-900 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
        >
          {saving ? "Logging…" : "Log & approve"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm border border-ink-900/15 px-4 py-2 text-xs text-ink-700 hover:bg-ink-900/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditEntryForm({
  entry,
  onCancel,
  onSaved,
  onError,
}: {
  entry: Entry;
  onCancel: () => void;
  onSaved: (e: Partial<Entry>) => void;
  onError: (e: string) => void;
}) {
  const [date, setDate] = useState(entry.date.slice(0, 10));
  const [department, setDepartment] = useState(entry.department);
  const [action, setAction] = useState(entry.action);
  const [hours, setHours] = useState(String(entry.hours));
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/admin/entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, department, action, hours: parseFloat(hours) }),
    });
    setSaving(false);
    if (res.ok) {
      const { entry: updated } = await res.json();
      onSaved(updated);
    } else onError((await res.json()).error ?? "Couldn't save those changes.");
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-600">
        Editing — {entry.studentName ?? entry.studentEmail}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCx}>Date</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={fieldCx} />
        </div>
        <div>
          <label className={labelCx}>Hours</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            required
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className={fieldCx}
          />
        </div>
      </div>
      <div>
        <label className={labelCx}>Department / Organization</label>
        <input required value={department} onChange={(e) => setDepartment(e.target.value)} className={fieldCx} />
      </div>
      <div>
        <label className={labelCx}>Activity</label>
        <textarea required rows={2} value={action} onChange={(e) => setAction(e.target.value)} className={fieldCx} />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-ink-900 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm border border-ink-900/15 px-4 py-2 text-xs text-ink-700 hover:bg-ink-900/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
