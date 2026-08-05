import { randomBytes } from "crypto";

// 32 bytes of randomness, base64url-encoded -> unguessable, URL-safe.
// This is what makes the supervisor's email link work with zero login.
export function generateApprovalToken(): string {
  return randomBytes(32).toString("base64url");
}
