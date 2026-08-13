export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors from nested Server Components / route handlers that
// Next.js's error.tsx boundary alone doesn't reach.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
