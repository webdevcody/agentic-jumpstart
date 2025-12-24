import { createFileRoute, redirect } from "@tanstack/react-router";
import { invalidateSession, validateRequest } from "~/utils/auth";
import { deleteSessionTokenCookie } from "~/utils/session";

export const Route = createFileRoute("/api/logout")({
  server: {
    handlers: {
      GET: async () => {
        const { session } = await validateRequest();
        if (!session) {
          // Use throw redirect() to avoid immutable headers error
          throw redirect({ to: "/" });
        }
        await invalidateSession(session?.id);
        await deleteSessionTokenCookie();
        // Use throw redirect() to avoid immutable headers error when combining setCookie with Response
        throw redirect({ to: "/" });
      },
    },
  },
});
