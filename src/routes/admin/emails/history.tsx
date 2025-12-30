import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryOptions } from "@tanstack/react-query";
import { getEmailBatchesFn } from "~/fn/emails";
import { EmailHistory } from "./-components/email-history";

const emailBatchesQueryOptions = queryOptions({
  queryKey: ["admin", "emailBatches"],
  queryFn: () => getEmailBatchesFn(),
});

export const Route = createFileRoute("/admin/emails/history")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(emailBatchesQueryOptions);
  },
  component: EmailHistoryPage,
});

function EmailHistoryPage() {
  const queryClient = useQueryClient();
  const { data: emailBatches, isLoading: emailBatchesLoading } = useQuery(
    emailBatchesQueryOptions
  );

  // Auto-refresh email batches to update progress bars
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["admin", "emailBatches"] });
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [queryClient]);

  return (
    <div
    >
      <EmailHistory
        emailBatches={emailBatches}
        emailBatchesLoading={emailBatchesLoading}
      />
    </div>
  );
}
