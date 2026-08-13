const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for instrumentation.ts on Next.js < 15 (enabled by default
  // from 15.3 onward - this project is on 14.x, so it stays explicit).
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only print Sentry's build-time logs in CI, keeps local `next dev`
  // output clean.
  silent: !process.env.CI,
  // Source map upload needs SENTRY_AUTH_TOKEN. Without it, this step is
  // skipped with a warning rather than failing the build - readable
  // stack traces in the Sentry dashboard are a nice-to-have you can add
  // later, not a launch blocker. See README.md for the token setup.
  widenClientFileUpload: true,
  disableLogger: true,
});
