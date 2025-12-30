import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
} from "lucide-react";

interface EmailBatch {
  id: number;
  subject: string;
  createdAt: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
}

interface EmailHistoryProps {
  emailBatches: EmailBatch[] | undefined;
  emailBatchesLoading: boolean;
}

function EmailBatchSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card/60 dark:bg-card/40 border border-border/50 p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="h-5 w-48 bg-muted/50 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-muted/30 rounded animate-pulse"></div>
          </div>
          <div className="h-6 w-20 bg-muted/30 rounded-full animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <div className="h-4 w-16 bg-muted/30 rounded animate-pulse"></div>
            <div className="h-6 w-12 bg-muted/50 rounded animate-pulse"></div>
          </div>
          <div className="space-y-1">
            <div className="h-4 w-12 bg-muted/30 rounded animate-pulse"></div>
            <div className="h-6 w-10 bg-muted/50 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-16 bg-muted/30 rounded animate-pulse"></div>
            <div className="h-4 w-12 bg-muted/30 rounded animate-pulse"></div>
          </div>
          <div className="h-2 w-full bg-muted/30 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
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
      return <CheckCircle className="h-4 w-4" />;
    case "processing":
      return <Loader2 className="h-4 w-4 animate-spin" />;
    case "failed":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export function EmailHistory({
  emailBatches,
  emailBatchesLoading,
}: EmailHistoryProps) {
  return (
    <div className="module-card">
      <div className="p-6 border-b border-border/50">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <Clock className="h-6 w-6 text-theme-500" />
          Recent Email Batches
        </h2>
        <p className="text-muted-foreground">
          Track the status of your recent email campaigns
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {emailBatchesLoading ? (
            [...Array(3)].map((_, idx) => <EmailBatchSkeleton key={idx} />)
          ) : emailBatches && emailBatches.length > 0 ? (
            emailBatches.map((batch) => (
              <div
                key={batch.id}
                className="group relative overflow-hidden rounded-xl bg-card/60 dark:bg-card/40 border border-border/50 p-6 hover:bg-card/80 dark:hover:bg-card/60 hover:border-theme-400/30 hover:shadow-elevation-2"
              >
                {/* Subtle hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 pointer-events-none rounded-xl"></div>

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1 flex-1">
                      <h4 className="text-lg font-semibold text-foreground">
                        {batch.subject}
                      </h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(batch.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(batch.status)}`}
                    >
                      {getStatusIcon(batch.status)}
                      {batch.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Recipients
                      </div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {batch.recipientCount}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Sent</div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {batch.sentCount}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {batch.sentCount} / {batch.recipientCount}
                      </span>
                    </div>
                    <Progress
                      value={
                        batch.recipientCount > 0
                          ? (batch.sentCount / batch.recipientCount) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  {batch.failedCount > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4" />
                      {batch.failedCount} failed deliveries
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <Mail className="h-16 w-16 mx-auto mb-6 opacity-30" />
              <p className="text-lg">No email batches yet</p>
              <p className="text-sm">Your sent emails will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
