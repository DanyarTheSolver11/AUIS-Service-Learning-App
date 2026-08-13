"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { digest: error.digest, boundary: "global" } });
  }, [error]);

  return (
    <html>
      <body style={{ background: "#002855", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <p style={{ fontSize: "1.5rem", fontStyle: "italic" }}>Something went wrong</p>
          <p style={{ marginTop: 8, color: "#e8c877", fontSize: "0.875rem" }}>
            This has been logged. Please refresh, or contact IT if it keeps happening.
          </p>
        </div>
      </body>
    </html>
  );
}
