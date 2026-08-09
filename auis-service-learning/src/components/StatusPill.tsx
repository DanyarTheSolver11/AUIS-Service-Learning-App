const META: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING: { bg: "bg-brass-200/60", text: "text-brass-600", dot: "bg-brass-500", label: "Awaiting Confirmation" },
  APPROVED: { bg: "bg-ink-600/10", text: "text-ink-700", dot: "bg-ink-600", label: "Confirmed" },
  REJECTED: { bg: "bg-claret-500/10", text: "text-claret-600", dot: "bg-claret-500", label: "Not Confirmed" },
};

export function StatusPill({ status }: { status: string }) {
  const m = META[status] ?? { bg: "bg-ink-900/5", text: "text-ink-600", dot: "bg-ink-500", label: status };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${m.bg} ${m.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
