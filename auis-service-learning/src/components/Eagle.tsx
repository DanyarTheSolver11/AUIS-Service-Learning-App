// Original geometric eagle mark — a nod to the AUIS mascot, not a
// reproduction of the official seal. Used sparingly as a watermark.
export function Eagle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 80" fill="none" className={className} aria-hidden="true">
      <path
        d="M50 8c-3 6-6 10-11 13L4 33c8-1 15 0 21 3-9 5-16 12-21 22 9-6 17-9 25-9-2 8-1 16 3 25 2-9 6-16 12-21 6 5 10 12 12 21 4-9 5-17 3-25 8 0 16 3 25 9-5-10-12-17-21-22 6-3 13-4 21-3l-35-12c-5-3-8-7-11-13-1.5-2-2.5-2-4 0Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="24" r="2.2" fill="currentColor" />
    </svg>
  );
}
