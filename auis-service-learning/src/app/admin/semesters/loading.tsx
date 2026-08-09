export default function Loading() {
  return (
    <div className="min-h-screen bg-parchment-100">
      <div className="h-[76px] animate-pulse bg-ink-800/95" />
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="h-4 w-40 animate-pulse rounded bg-ink-900/10" />
        <div className="mt-3 h-8 w-96 animate-pulse rounded bg-ink-900/10" />
        <div className="mt-8 h-72 animate-pulse rounded-sm bg-ink-900/5" />
      </div>
    </div>
  );
}
