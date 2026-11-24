import { createAuthClient } from "better-auth/react";

// Login hanya lewat Google (Better Auth). Sesi berupa cookie, tidak perlu token manual.
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_WEBSITE_URL ?? window.location.origin,
  basePath: "/api/auth",
});
