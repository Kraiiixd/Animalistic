import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { ping } from "./routes/ping";
import { anime } from "./routes/anime";
import { library } from "./routes/library";
import { profile } from "./routes/profile";
import { admin } from "./routes/admin";
import { auth } from "./auth";

// API features are oRPC procedures, one file per feature in ./routes/.
export const router = {
  ping,
  anime,
  library,
  profile,
  admin,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export default app;
