import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Send,
  Users,
  Sparkles,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Calendar,
  FlaskConical,
} from "lucide-react";
import { useState } from "react";
import { RecipientsModal } from "./recipients-modal";

interface EmailBatch {
  id: number;
  subject: string;
  createdAt: Date | string;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
}

interface SegmentNotificationPanelProps {
  selectedCount: number;
  recipientCount: number | undefined;
  isLoadingRecipients: boolean;
  notificationType: "new" | "updated";
  onNotificationTypeChange: (type: "new" | "updated") => void;
  onSend: () => void;
  isSending: boolean;
  recentBatches: EmailBatch[] | undefined;
  isLoadingBatches: boolean;
  onTestEmail: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-3.5 w-3.5" />;
    case "processing":
      return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5" />;
    default:
      return <Clock className="h-3.5 w-3.5" />;
  }
};

export function SegmentNotificationPanel({
  selectedCount,
  recipientCount,
  isLoadingRecipients,
  notificationType,
  onNotificationTypeChange,
  onSend,
  isSending,
  recentBatches,
  isLoadingBatches,
  onTestEmail,
}: SegmentNotificationPanelProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);

  const handleSendClick = () => {
    if (selectedCount > 0 && recipientCount && recipientCount > 0) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSend = () => {
    setShowConfirmDialog(false);
    onSend();
  };

  return (
    <div className="space-y-6">
      {/* Notification Type */}
      <div className="module-card">
        <div className="p-6 border-b border-border/50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-theme-500" />
            Notification Type
          </h3>
        </div>
        <div className="p-6 space-y-3">
          <button
            type="button"
            onClick={() => onNotificationTypeChange("new")}
            className={`w-full text-left p-4 rounded-lg border ${
              notificationType === "new"
                ? "border-theme-500 bg-theme-500/10"
                : "border-border/50 hover:border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  notificationType === "new"
                    ? "border-theme-500"
                    : "border-muted-foreground/50"
                }`}
              >
                {notificationType === "new" && (
                  <div className="w-2 h-2 rounded-full bg-theme-500" />
                )}
              </div>
              <div>
                <span className="font-medium">New Video</span>
                <p className="text-sm text-muted-foreground">
                  Announce new content to subscribers
                </p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onNotificationTypeChange("updated")}
            className={`w-full text-left p-4 rounded-lg border ${
              notificationType === "updated"
                ? "border-theme-500 bg-theme-500/10"
                : "border-border/50 hover:border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  notificationType === "updated"
                    ? "border-theme-500"
                    : "border-muted-foreground/50"
                }`}
              >
                {notificationType === "updated" && (
                  <div className="w-2 h-2 rounded-full bg-theme-500" />
                )}
              </div>
              <div>
                <span className="font-medium">Updated Video</span>
                <p className="text-sm text-muted-foreground">
                  Notify about improvements to existing content
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recipients & Send */}
      <div className="module-card">
        <div className="p-6 border-b border-border/50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-theme-500" />
            Recipients
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Eligible subscribers
            </span>
            {isLoadingRecipients ? (
              <div className="h-8 w-16 bg-muted/50 rounded animate-pulse" />
            ) : (
              <button
                type="button"
                onClick={() => setShowRecipientsModal(true)}
                className="text-2xl font-bold text-theme-600 hover:text-theme-500 hover:underline underline-offset-2 transition-colors cursor-pointer"
                title="Click to view all recipients"
              >
                {recipientCount ?? 0}
              </button>
            )}
          </div>

          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
            This will send to all users who have opted in to course updates,
            including registered users, early access list members, and newsletter
            subscribers who haven&apos;t unsubscribed.
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSendClick}
              disabled={
                isSending ||
                selectedCount === 0 ||
                !recipientCount ||
                recipientCount === 0
              }
              className="flex-1 btn-gradient"
              size="lg"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Send to {recipientCount ?? 0}
                </>
              )}
            </Button>
            <Button
              onClick={onTestEmail}
              disabled={selectedCount === 0}
              variant="outline"
              size="lg"
              title="Send test email"
            >
              <FlaskConical className="h-5 w-5" />
            </Button>
          </div>

          {selectedCount === 0 && (
            <p className="text-sm text-amber-600 text-center">
              Select at least one segment to send notifications
            </p>
          )}
        </div>
      </div>

      {/* Recent Batches */}
      <div className="module-card">
        <div className="p-6 border-b border-border/50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-theme-500" />
            Recent Batches
          </h3>
        </div>
        <div className="p-6">
          {isLoadingBatches ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-border/50 bg-card/30"
                >
                  <div className="h-4 w-32 bg-muted/50 rounded animate-pulse mb-2" />
                  <div className="h-2 w-full bg-muted/30 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : recentBatches && recentBatches.length > 0 ? (
            <div className="space-y-3">
              {recentBatches.slice(0, 5).map((batch) => (
                <div
                  key={batch.id}
                  className="p-4 rounded-lg border border-border/50 bg-card/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {batch.subject}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(batch.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs px-2 py-0.5 ${getStatusColor(batch.status)}`}
                    >
                      {getStatusIcon(batch.status)}
                      <span className="ml-1">{batch.status}</span>
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>
                        {batch.sentCount}/{batch.recipientCount}
                      </span>
                    </div>
                    <Progress
                      value={
                        batch.recipientCount > 0
                          ? (batch.sentCount / batch.recipientCount) * 100
                          : 0
                      }
                      className="h-1.5"
                    />
                  </div>
                  {batch.failedCount > 0 && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {batch.failedCount} failed
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent batches
            </p>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Send className="h-5 w-5 text-theme-500" />
              Confirm Send
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-base space-y-2">
                <p>You are about to send email notifications:</p>
                <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                  <li>
                    <strong>{selectedCount}</strong> segment
                    {selectedCount > 1 ? "s" : ""} selected
                  </li>
                  <li>
                    <strong>{recipientCount}</strong> recipient
                    {(recipientCount ?? 0) > 1 ? "s" : ""}
                  </li>
                  <li>
                    Type:{" "}
                    <strong>
                      {notificationType === "new" ? "New Video" : "Updated Video"}
                    </strong>
                  </li>
                </ul>
                <p className="mt-3 text-muted-foreground">
                  This action cannot be undone. Emails will be sent immediately.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <Button onClick={handleConfirmSend} className="flex-1 btn-gradient">
              Send Emails
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recipients Modal */}
      <RecipientsModal
        open={showRecipientsModal}
        onOpenChange={setShowRecipientsModal}
      />
    </div>
  );
}
