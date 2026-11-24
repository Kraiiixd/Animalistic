import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { auth } from "../auth";
import { ensureProfile } from "../lib/profile";

/** Sesi opsional: context.user null untuk tamu. */
export const withUser = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  return next({
    context: {
      user: session?.user ?? null,
      session: session?.session ?? null,
    },
  });
});

/** Prosedur terproteksi. Role dicek ulang dari database, bukan dari klien. */
export const authed = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session) throw new ORPCError("UNAUTHORIZED", { message: "Silakan masuk terlebih dahulu" });
  const p = await ensureProfile(session.user.id, session.user.name);
  return next({
    context: {
      user: session.user,
      session: session.session,
      profile: p ?? null,
    },
  });
});

/** Hanya admin atau developer. Dicek di server. */
export const adminOnly = authed.use(async ({ context, next }) => {
  const role = context.profile?.role;
  if (role !== "admin" && role !== "developer") {
    throw new ORPCError("FORBIDDEN", { message: "Akses ditolak" });
  }
  return next({ context: {} });
});
