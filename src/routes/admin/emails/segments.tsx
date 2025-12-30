import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getRecentSegmentsForNotificationFn,
  getSegmentNotificationRecipientsCountFn,
  sendSegmentNotificationBatchFn,
  getEmailBatchesFn,
  sendTestSegmentNotificationFn,
} from "~/fn/emails";
import { SegmentSelector } from "./-components/segment-selector";
import { SegmentNotificationPanel } from "./-components/segment-notification-panel";
import { TestEmailDialog } from "./-components/test-email-dialog";

const recentSegmentsQueryOptions = queryOptions({
  queryKey: ["admin", "segments", "recent"],
  queryFn: () => getRecentSegmentsForNotificationFn(),
});

const recipientsCountQueryOptions = queryOptions({
  queryKey: ["admin", "segments", "recipientsCount"],
  queryFn: () => getSegmentNotificationRecipientsCountFn(),
});

const emailBatchesQueryOptions = queryOptions({
  queryKey: ["admin", "emailBatches"],
  queryFn: () => getEmailBatchesFn(),
});

export const Route = createFileRoute("/admin/emails/segments")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(recentSegmentsQueryOptions);
    context.queryClient.ensureQueryData(recipientsCountQueryOptions);
    context.queryClient.ensureQueryData(emailBatchesQueryOptions);
  },
  component: SegmentNotificationsPage,
});

function SegmentNotificationsPage() {
  const queryClient = useQueryClient();
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<number[]>([]);
  const [notificationType, setNotificationType] = useState<"new" | "updated">(
    "new"
  );
  const [testEmailOpen, setTestEmailOpen] = useState(false);

  const { data: segmentsData, isLoading: isLoadingSegments } = useQuery(
    recentSegmentsQueryOptions
  );

  const { data: recipientsData, isLoading: isLoadingRecipients } = useQuery(
    recipientsCountQueryOptions
  );

  const { data: emailBatches, isLoading: isLoadingBatches } = useQuery(
    emailBatchesQueryOptions
  );

  // Auto-refresh email batches to update progress bars
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["admin", "emailBatches"] });
    }, 5000);

    return () => clearInterval(interval);
  }, [queryClient]);

  const sendNotificationMutation = useMutation({
    mutationFn: (data: {
      segmentIds: number[];
      notificationType: "new" | "updated";
    }) => sendSegmentNotificationBatchFn({ data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "emailBatches"] });
      setSelectedSegmentIds([]);
      if (result.warning) {
        toast.warning("Email batch created", {
          description: result.warning,
        });
      } else {
        toast.success("Email batch started!", {
          description: "Notifications are being sent to all subscribers.",
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to send notifications", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    },
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: (data: {
      email: string;
      segmentIds: number[];
      notificationType: "new" | "updated";
    }) => sendTestSegmentNotificationFn({ data }),
    onSuccess: () => {
      setTestEmailOpen(false);
      toast.success("Test email sent!", {
        description: "Check your inbox for the test email.",
      });
    },
    onError: (error) => {
      toast.error("Failed to send test email", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    },
  });

  const handleSend = () => {
    sendNotificationMutation.mutate({
      segmentIds: selectedSegmentIds,
      notificationType,
    });
  };

  const handleTestEmail = (data: { email: string }) => {
    if (selectedSegmentIds.length === 0) {
      toast.error("No segments selected", {
        description: "Please select at least one segment before sending a test email.",
      });
      return;
    }

    sendTestEmailMutation.mutate({
      email: data.email,
      segmentIds: selectedSegmentIds,
      notificationType,
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Segment Selector (Left - 3 columns) */}
        <div
          className="lg:col-span-3"
        >
          <SegmentSelector
            segments={segmentsData?.segments}
            isLoading={isLoadingSegments}
            selectedIds={selectedSegmentIds}
            onSelectionChange={setSelectedSegmentIds}
          />
        </div>

        {/* Notification Panel (Right - 2 columns) */}
        <div
          className="lg:col-span-2"
        >
          <SegmentNotificationPanel
            selectedCount={selectedSegmentIds.length}
            recipientCount={recipientsData?.count}
            isLoadingRecipients={isLoadingRecipients}
            notificationType={notificationType}
            onNotificationTypeChange={setNotificationType}
            onSend={handleSend}
            isSending={sendNotificationMutation.isPending}
            recentBatches={emailBatches}
            isLoadingBatches={isLoadingBatches}
            onTestEmail={() => setTestEmailOpen(true)}
          />
        </div>
      </div>

      <TestEmailDialog
        open={testEmailOpen}
        onOpenChange={setTestEmailOpen}
        onSubmit={handleTestEmail}
        isPending={sendTestEmailMutation.isPending}
      />
    </>
  );
}
