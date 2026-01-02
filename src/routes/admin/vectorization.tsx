import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  Loader2,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PageHeader } from "./-components/page-header";
import { Page } from "./-components/page";
import {
  getVectorizationStatusFn,
  queueVectorizeAllSegmentsFn,
  queueVectorizeSegmentFn,
  cancelVectorizeSegmentFn,
} from "~/fn/vector-search";
import { toast } from "sonner";
import { queryOptions } from "@tanstack/react-query";
import { assertIsAdminFn } from "~/fn/auth";

const POLLING_INTERVAL = 5000; // Poll every 5 seconds

export const Route = createFileRoute("/admin/vectorization")({
  beforeLoad: () => assertIsAdminFn(),
  component: AdminVectorization,
});

const vectorizationQuery = queryOptions({
  queryKey: ["admin", "vectorization", "status"],
  queryFn: () => getVectorizationStatusFn(),
  refetchInterval: POLLING_INTERVAL, // Poll for job status updates
});

type SegmentStatus = Awaited<
  ReturnType<typeof getVectorizationStatusFn>
>["segments"][number];

function AdminVectorization() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(vectorizationQuery);

  const queueAllMutation = useMutation({
    mutationFn: queueVectorizeAllSegmentsFn,
    onSuccess: (result) => {
      if (result.jobsQueued > 0) {
        toast.success(
          `Queued ${result.jobsQueued} segment${result.jobsQueued !== 1 ? "s" : ""} for vectorization`
        );
      } else {
        toast.info("No segments need vectorization");
      }
      queryClient.invalidateQueries({
        queryKey: ["admin", "vectorization"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to queue vectorization jobs"
      );
    },
  });

  const queueSegmentMutation = useMutation({
    mutationFn: queueVectorizeSegmentFn,
    onSuccess: (result) => {
      if (result.job) {
        toast.success("Vectorization job queued");
      } else {
        toast.info("Vectorization job already in progress");
      }
      queryClient.invalidateQueries({
        queryKey: ["admin", "vectorization"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to queue vectorization job"
      );
    },
  });

  const cancelSegmentMutation = useMutation({
    mutationFn: cancelVectorizeSegmentFn,
    onSuccess: (result) => {
      if (result.cancelledCount > 0) {
        toast.success("Vectorization job cancelled");
      } else {
        toast.info("No active job to cancel");
      }
      queryClient.invalidateQueries({
        queryKey: ["admin", "vectorization"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to cancel vectorization job"
      );
    },
  });

  const handleVectorizeAll = () => {
    queueAllMutation.mutate({});
  };

  const handleVectorizeSegment = (segmentId: number) => {
    queueSegmentMutation.mutate({ data: { segmentId } });
  };

  const handleCancelSegment = (segmentId: number) => {
    cancelSegmentMutation.mutate({ data: { segmentId } });
  };

  // Check if any segments have active jobs
  const hasActiveJobs = data?.segments.some((s) => s.activeVectorizeJob);

  if (isLoading) {
    return (
      <Page>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Page>
    );
  }

  if (!data) {
    return (
      <Page>
        <div className="text-center text-muted-foreground">
          Failed to load vectorization status
        </div>
      </Page>
    );
  }

  const { segments, modules, stats } = data;

  // Group segments by module
  const segmentsByModule = new Map<
    number,
    { module: (typeof modules)[number]; segments: SegmentStatus[] }
  >();

  modules.forEach((module) => {
    segmentsByModule.set(module.id, {
      module,
      segments: [],
    });
  });

  segments.forEach((segment) => {
    const moduleId = modules.find((m) => m.title === segment.moduleTitle)?.id;
    if (moduleId) {
      const moduleData = segmentsByModule.get(moduleId);
      if (moduleData) {
        moduleData.segments.push(segment);
      }
    }
  });

  // Count active jobs
  const activeJobCount = segments.filter((s) => s.activeVectorizeJob).length;

  return (
    <Page>
      <PageHeader
        title="Transcript Vectorization"
        highlightedWord="Vectorization"
        description="Generate vector embeddings for transcript search. Embeddings enable semantic search across all course content."
        actions={
          <Button
            onClick={handleVectorizeAll}
            disabled={
              queueAllMutation.isPending || stats.needsVectorization === 0
            }
            className="flex items-center gap-2"
          >
            {queueAllMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Queueing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Vectorize All
              </>
            )}
          </Button>
        }
      />

      {/* Active Jobs Banner */}
      {hasActiveJobs && (
        <div className="mb-6 p-4 rounded-lg border border-blue-500/20 bg-blue-500/10 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <div>
            <p className="font-medium text-blue-600 dark:text-blue-400">
              {activeJobCount} vectorization job{activeJobCount !== 1 ? "s" : ""}{" "}
              in progress
            </p>
            <p className="text-sm text-muted-foreground">
              Status updates automatically every 5 seconds
            </p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Segments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSegments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Transcripts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withTranscripts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vectorized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.vectorized}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Needs Vectorization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.needsVectorization}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Chunks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChunks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Segments List */}
      <div className="space-y-6">
        {Array.from(segmentsByModule.values())
          .filter(({ segments }) => segments.length > 0)
          .sort((a, b) => a.module.order - b.module.order)
          .map(({ module, segments: moduleSegments }) => (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>
                  {moduleSegments.length} segment
                  {moduleSegments.length !== 1 ? "s" : ""} •{" "}
                  {moduleSegments.filter((s) => s.isVectorized).length}{" "}
                  vectorized
                  {moduleSegments.some((s) => s.activeVectorizeJob) && (
                    <span className="ml-2 text-blue-500">
                      • {moduleSegments.filter((s) => s.activeVectorizeJob).length}{" "}
                      processing
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {moduleSegments.map((segment) => (
                    <SegmentRow
                      key={segment.id}
                      segment={segment}
                      onVectorize={() => handleVectorizeSegment(segment.id)}
                      onCancel={() => handleCancelSegment(segment.id)}
                      isQueueing={
                        queueSegmentMutation.isPending &&
                        queueSegmentMutation.variables?.data.segmentId ===
                          segment.id
                      }
                      isCancelling={
                        cancelSegmentMutation.isPending &&
                        cancelSegmentMutation.variables?.data.segmentId ===
                          segment.id
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </Page>
  );
}

interface SegmentRowProps {
  segment: SegmentStatus;
  onVectorize: () => void;
  onCancel: () => void;
  isQueueing: boolean;
  isCancelling: boolean;
}

function SegmentRow({
  segment,
  onVectorize,
  onCancel,
  isQueueing,
  isCancelling,
}: SegmentRowProps) {
  const isProcessing = segment.activeVectorizeJob;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-medium">{segment.title}</h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {segment.hasTranscript ? (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <FileText className="h-3 w-3" />
              <span>Has Transcript</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>No Transcript</span>
            </div>
          )}

          {isProcessing ? (
            <div className="flex items-center gap-1 text-blue-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Vectorizing...</span>
            </div>
          ) : segment.isVectorized ? (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Database className="h-3 w-3" />
              <span>{segment.chunkCount} chunks</span>
            </div>
          ) : segment.hasTranscript ? (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3 w-3" />
              <span>Not Vectorized</span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="ml-4 flex items-center gap-2">
        {isProcessing ? (
          <>
            <Badge variant="outline" className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing
            </Badge>
            <Button
              onClick={onCancel}
              disabled={isCancelling}
              size="sm"
              variant="ghost"
              title="Cancel vectorization"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {isCancelling ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          </>
        ) : segment.needsVectorization ? (
          <Button
            onClick={onVectorize}
            disabled={isQueueing}
            size="sm"
            variant="outline"
          >
            {isQueueing ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Queueing...
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-2" />
                Vectorize
              </>
            )}
          </Button>
        ) : segment.isVectorized ? (
          <>
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Complete
            </Badge>
            <Button
              onClick={onVectorize}
              disabled={isQueueing}
              size="sm"
              variant="ghost"
              title="Re-run vectorization"
            >
              {isQueueing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
          </>
        ) : (
          <Badge variant="secondary" className="flex items-center gap-1">
            No Transcript
          </Badge>
        )}
      </div>
    </div>
  );
}
