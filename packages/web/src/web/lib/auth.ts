import { createAuthClient } from "better-auth/react";
import { managedAuthClient } from "@runablehq/managed-auth/client";

const config = {
  applicationId: import.meta.env.VITE_APPLICATION_ID,
  issuer: import.meta.env.VITE_RUNABLE_AUTH_ISSUER,
};

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_WEBSITE_URL ?? window.location.origin,
  basePath: "/api/auth",
  plugins: [managedAuthClient(config)],
});

/** Resolves once a returning managed sign-in (?code=…) is exchanged. Gated in Provider. */
export const redirectReady: Promise<unknown> = authClient.managedAuth
  .handleRedirect()
  .catch((err: unknown) => console.error("managed auth redirect failed", err));
