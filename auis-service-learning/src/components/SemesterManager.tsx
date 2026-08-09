"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Semester = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  deadline: string;
  isActive: boolean;
  entryCount: number;
};

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

const fieldCx =
  "w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-2 focus:ring-brass-400/25";
const labelCx = "text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500";

export function SemesterManager({ initialSemesters }: { initialSemesters: Semester[] }) {
  const router = useRouter();
  const [semesters, setSemesters] = useState(initialSemesters);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function handleActivate(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/admin/semesters/${id}/activate`, { method: "POST" });
    setBusyId(null);
    if (res.ok) {
      setSemesters((prev) => prev.map((s) => ({ ...s, isActive: s.id === id })));
      refresh();
    } else setError((await res.json()).error ?? "Couldn't activate that semester.");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this semester? Only possible if it has no entries logged.")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/semesters/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) {
      setSemesters((prev) => prev.filter((s) => s.id !== id));
      refresh();
    } else setError((await res.json()).error ?? "Couldn't delete that semester.");
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-sm border border-claret-500/30 bg-claret-500/5 px-4 py-3 text-sm text-claret-600">
          {error}
        </p>
      )}

      {semesters.map((s) => (
        <div key={s.id} className="rule-frame animate-rise rounded-sm bg-white p-5 shadow-seal">
          {editingId === s.id ? (
            <EditForm
              semester={s}
              onCancel={() => setEditingId(null)}
              onSaved={(updated) => {
                setSemesters((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...updated } : x)));
                setEditingId(null);
                refresh();
              }}
              onError={setError}
            />
          ) : (
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg text-ink-900">{s.name}</p>
                  {s.isActive && (
                    <span className="rounded-full bg-ink-600/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-700">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  {new Date(s.startDate).toDateString()} → {new Date(s.endDate).toDateString()}
                  &nbsp;&middot;&nbsp; Deadline {new Date(s.deadline).toDateString()}
                  &nbsp;&middot;&nbsp; {s.entryCount} {s.entryCount === 1 ? "entry" : "entries"} logged
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!s.isActive && (
                  <button
                    onClick={() => handleActivate(s.id)}
                    disabled={busyId === s.id}
                    className="rounded-sm bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:opacity-50"
                  >
                    Set Active
                  </button>
                )}
                <button
                  onClick={() => setEditingId(s.id)}
                  className="rounded-sm border border-ink-900/15 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-900/5"
                >
                  Edit dates
                </button>
                {s.entryCount === 0 && (
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={busyId === s.id}
                    className="rounded-sm border border-claret-500/30 px-3 py-1.5 text-xs font-medium text-claret-600 hover:bg-claret-500/5"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {showCreate ? (
        <div className="rule-frame rounded-sm bg-white p-5 shadow-seal">
          <CreateForm
            onCancel={() => setShowCreate(false)}
            onCreated={(created) => {
              setSemesters((prev) =>
                created.isActive
                  ? [{ ...created, entryCount: 0 }, ...prev.map((s) => ({ ...s, isActive: false }))]
                  : [{ ...created, entryCount: 0 }, ...prev]
              );
              setShowCreate(false);
              refresh();
            }}
            onError={setError}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full rounded-sm border border-dashed border-ink-900/20 py-4 text-sm font-medium text-ink-600 transition hover:border-brass-400/60 hover:bg-brass-200/10"
        >
          + Add a new semester
        </button>
      )}
    </div>
  );
}

function EditForm({
  semester,
  onCancel,
  onSaved,
  onError,
}: {
  semester: Semester;
  onCancel: () => void;
  onSaved: (s: Partial<Semester>) => void;
  onError: (e: string) => void;
}) {
  const [name, setName] = useState(semester.name);
  const [startDate, setStartDate] = useState(toDateInput(semester.startDate));
  const [endDate, setEndDate] = useState(toDateInput(semester.endDate));
  const [deadline, setDeadline] = useState(toDateInput(semester.deadline));
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/admin/semesters/${semester.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, startDate, endDate, deadline }),
    });
    setSaving(false);
    if (res.ok) {
      const { semester: updated } = await res.json();
      onSaved(updated);
    } else onError((await res.json()).error ?? "Couldn't save changes.");
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <label className={labelCx}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className={fieldCx} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCx}>Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className={fieldCx}
          />
        </div>
        <div>
          <label className={labelCx}>End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className={fieldCx}
          />
        </div>
        <div>
          <label className={labelCx}>Submission deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            className={fieldCx}
          />
        </div>
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

function CreateForm({
  onCancel,
  onCreated,
  onError,
}: {
  onCancel: () => void;
  onCreated: (s: Semester) => void;
  onError: (e: string) => void;
}) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [activate, setActivate] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/semesters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, startDate, endDate, deadline, activate }),
    });
    setSaving(false);
    if (res.ok) {
      const { semester } = await res.json();
      onCreated(semester);
    } else onError((await res.json()).error ?? "Couldn't create that semester.");
  }

  return (
    <form onSubmit={handleCreate} className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-600">New Semester</p>
      <div>
        <label className={labelCx}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Spring 2026"
          required
          className={fieldCx}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCx}>Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className={fieldCx}
          />
        </div>
        <div>
          <label className={labelCx}>End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className={fieldCx}
          />
        </div>
        <div>
          <label className={labelCx}>Submission deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            className={fieldCx}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-ink-600">
        <input type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} />
        Make this the active semester immediately (deactivates the current one)
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-ink-900 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create semester"}
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
