import { createFileRoute } from "@tanstack/react-router";
import { invalidateSession, validateRequest } from "~/utils/auth";
import { deleteSessionTokenCookie } from "~/utils/session";

export const Route = createFileRoute("/api/logout")({
  server: {
    handlers: {
      GET: async () => {
        const { session } = await validateRequest();
        if (!session) {
          return new Response(null, {
            status: 302,
            headers: { Location: "/" },
          });
        }
        await invalidateSession(session?.id);
        await deleteSessionTokenCookie();
        return new Response(null, { status: 302, headers: { Location: "/" } });
      },
    },
  },
});
