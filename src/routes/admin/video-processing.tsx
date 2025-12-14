import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Video,
  FileText,
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
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
  getSegmentsWithProcessingStatusFn,
  queueMissingJobsForAllSegmentsFn,
  queueAllJobsForSegmentFn,
} from "~/fn/video-processing-jobs";
import { toast } from "sonner";
import { queryOptions } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/video-processing")({
  component: AdminVideoProcessing,
});

const segmentsQuery = queryOptions({
  queryKey: ["admin", "video-processing", "segments"],
  queryFn: () => getSegmentsWithProcessingStatusFn(),
  refetchInterval: 5000, // Refetch every 5 seconds to show real-time updates
});

type SegmentWithStatus = Awaited<
  ReturnType<typeof getSegmentsWithProcessingStatusFn>
>["segments"][number];

function AdminVideoProcessing() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(segmentsQuery);
  const [processingSegments, setProcessingSegments] = useState<Set<number>>(
    new Set()
  );

  const queueAllMutation = useMutation({
    mutationFn: queueMissingJobsForAllSegmentsFn,
    onSuccess: (result) => {
      toast.success(
        `Queued ${result.jobsQueued} job${result.jobsQueued !== 1 ? "s" : ""} for processing`
      );
      queryClient.invalidateQueries({
        queryKey: ["admin", "video-processing"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to queue jobs"
      );
    },
  });

  const queueSegmentMutation = useMutation({
    mutationFn: queueAllJobsForSegmentFn,
    onSuccess: (result) => {
      toast.success(
        `Queued ${result.jobs.length} job${result.jobs.length !== 1 ? "s" : ""} for segment`
      );
      queryClient.invalidateQueries({
        queryKey: ["admin", "video-processing"],
      });
      setProcessingSegments((prev) => {
        const next = new Set(prev);
        next.delete(result.jobs[0]?.segmentId || 0);
        return next;
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to queue jobs"
      );
      setProcessingSegments((prev) => {
        const next = new Set(prev);
        next.delete(0);
        return next;
      });
    },
  });

  const handleQueueAll = () => {
    queueAllMutation.mutate();
  };

  const handleQueueSegment = (segmentId: number) => {
    setProcessingSegments((prev) => new Set(prev).add(segmentId));
    queueSegmentMutation.mutate({ data: { segmentId } });
  };

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
          Failed to load segments
        </div>
      </Page>
    );
  }

  const { segments, modules } = data;

  // Group segments by module
  const segmentsByModule = new Map<
    number,
    { module: (typeof modules)[number]; segments: SegmentWithStatus[] }
  >();

  modules.forEach((module) => {
    segmentsByModule.set(module.id, {
      module,
      segments: [],
    });
  });

  segments.forEach((segment) => {
    const moduleData = segmentsByModule.get(segment.moduleId);
    if (moduleData) {
      moduleData.segments.push(segment);
    }
  });

  // Calculate statistics
  const totalSegments = segments.length;
  const segmentsWithVideo = segments.filter((s) => s.hasVideo).length;
  const segmentsNeedingTranscript = segments.filter(
    (s) => s.needsTranscript && !s.activeTranscriptJob
  ).length;
  const segmentsNeedingTranscode = segments.filter(
    (s) => s.needsTranscode && !s.activeTranscodeJob
  ).length;
  const activeJobs = segments.filter(
    (s) => s.activeTranscriptJob || s.activeTranscodeJob
  ).length;

  return (
    <Page>
      <PageHeader
        title="Video Processing"
        highlightedWord="Processing"
        description="Manage video transcript generation and transcoding for all course segments. Jobs are processed sequentially to prevent system overload."
        actions={
          <Button
            onClick={handleQueueAll}
            disabled={
              queueAllMutation.isPending ||
              (segmentsNeedingTranscript === 0 &&
                segmentsNeedingTranscode === 0)
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
                Process All Missing
              </>
            )}
          </Button>
        }
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Segments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSegments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Segments with Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segmentsWithVideo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Need Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segmentsNeedingTranscript}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Need Transcode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segmentsNeedingTranscode}</div>
          </CardContent>
        </Card>
      </div>

      {/* Segments List */}
      <div className="space-y-6">
        {Array.from(segmentsByModule.values())
          .sort((a, b) => a.module.order - b.module.order)
          .map(({ module, segments: moduleSegments }) => (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>
                  {moduleSegments.length} segment
                  {moduleSegments.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {moduleSegments
                    .sort((a, b) => a.order - b.order)
                    .map((segment) => (
                      <SegmentRow
                        key={segment.id}
                        segment={segment}
                        onProcess={() => handleQueueSegment(segment.id)}
                        isProcessing={processingSegments.has(segment.id)}
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
  segment: SegmentWithStatus;
  onProcess: () => void;
  isProcessing: boolean;
}

function SegmentRow({ segment, onProcess, isProcessing }: SegmentRowProps) {
  const needsProcessing =
    (segment.needsTranscript && !segment.activeTranscriptJob) ||
    (segment.needsTranscode && !segment.activeTranscodeJob);

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-medium">{segment.title}</h3>
          {segment.isPremium && (
            <Badge variant="secondary" className="text-xs">
              Premium
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <StatusBadge
            icon={Video}
            label="Video"
            has={segment.hasVideo}
            active={false}
          />
          <StatusBadge
            icon={FileText}
            label="Transcript"
            has={segment.hasTranscript}
            active={segment.activeTranscriptJob}
            needs={segment.needsTranscript}
          />
          <StatusBadge
            icon={Video}
            label="720p"
            has={segment.has720p}
            active={segment.activeTranscodeJob}
            needs={segment.needsTranscode}
          />
          <StatusBadge
            icon={Video}
            label="480p"
            has={segment.has480p}
            active={segment.activeTranscodeJob}
            needs={segment.needsTranscode}
          />
        </div>
      </div>
      <div className="ml-4">
        {needsProcessing ? (
          <Button
            onClick={onProcess}
            disabled={isProcessing}
            size="sm"
            variant="outline"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Queueing...
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-2" />
                Process
              </>
            )}
          </Button>
        ) : segment.activeTranscriptJob || segment.activeTranscodeJob ? (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        ) : (
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Complete
          </Badge>
        )}
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  has: boolean;
  active: boolean;
  needs?: boolean;
}

function StatusBadge({
  icon: Icon,
  label,
  has,
  active,
  needs,
}: StatusBadgeProps) {
  if (active) {
    return (
      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>{label}</span>
      </div>
    );
  }

  if (has) {
    return (
      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        <span>{label}</span>
      </div>
    );
  }

  if (needs) {
    return (
      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <AlertCircle className="h-3 w-3" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <XCircle className="h-3 w-3" />
      <span>{label}</span>
    </div>
  );
}
