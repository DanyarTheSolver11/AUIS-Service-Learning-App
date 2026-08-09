"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this entry? This can't be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert((await res.json()).error ?? "Failed to delete entry.");
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-[11px] uppercase tracking-wide text-claret-500/70 underline decoration-dotted underline-offset-2 transition-colors hover:text-claret-600 disabled:opacity-50"
    >
      {loading ? "Removing…" : "Withdraw"}
    </button>
  );
}
