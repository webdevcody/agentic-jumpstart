import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/conversions/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/conversions/overview" });
  },
});