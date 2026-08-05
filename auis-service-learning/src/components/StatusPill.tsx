const STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}
