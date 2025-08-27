import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/emails/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/emails/analytics" });
  },
});
